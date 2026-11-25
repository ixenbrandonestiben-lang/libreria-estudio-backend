const crypto = require('crypto');
const { getConnection } = require('../config/database');
const cartModel = require('../models/cartModel');
const productModel = require('../models/productModel');
const inventoryService = require('./inventoryService');
const { AppError } = require('../utils/appError');

function hashCartToken(rawToken) {
  return crypto.createHash('sha256').update(String(rawToken)).digest('hex');
}

function generateCartToken() {
  return crypto.randomBytes(32).toString('hex');
}

function buildCartExpiry() {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}

function summarizeCart(cart, items, rawCartToken = null) {
  let subtotal = 0;
  let totalUnits = 0;

  const formattedItems = items.map((item) => {
    const unitPrice = Number(item.price);
    const quantity = Number(item.quantity);
    const lineTotal = unitPrice * quantity;
    subtotal += lineTotal;
    totalUnits += quantity;

    return {
      id: item.id,
      productId: item.product_id,
      sku: item.sku,
      title: item.title,
      slug: item.slug,
      unitLabel: item.unit_label,
      unitsPerPack: item.units_per_pack,
      unitPrice: unitPrice.toFixed(2),
      quantity,
      lineTotal: lineTotal.toFixed(2),
      stockAvailable: Number(item.stock_available),
      imageUrl: item.image_url,
      isActive: Boolean(item.is_active)
    };
  });

  return {
    cartId: cart ? cart.id : null,
    cartToken: rawCartToken,
    items: formattedItems,
    summary: {
      itemCount: formattedItems.length,
      totalUnits,
      subtotal: subtotal.toFixed(2)
    }
  };
}

async function resolveOrCreateCart({ userId = null, cartToken = null, createIfMissing = true, conn = null }) {
  if (userId) {
    const existing = await cartModel.findCartByUserId(userId, conn);
    if (existing) {
      return { cart: existing, rawCartToken: cartToken };
    }
    if (!createIfMissing) {
      return { cart: null, rawCartToken: cartToken };
    }
    const created = await cartModel.createCart({ userId, expiresAt: buildCartExpiry() }, conn);
    return { cart: created, rawCartToken: null };
  }

  let rawToken = cartToken;
  if (rawToken) {
    const existing = await cartModel.findCartBySessionTokenHash(hashCartToken(rawToken), conn);
    if (existing) {
      return { cart: existing, rawCartToken: rawToken };
    }
  }

  if (!createIfMissing) {
    return { cart: null, rawCartToken: rawToken };
  }

  rawToken = rawToken || generateCartToken();
  const created = await cartModel.createCart(
    {
      sessionTokenHash: hashCartToken(rawToken),
      expiresAt: buildCartExpiry()
    },
    conn
  );
  return { cart: created, rawCartToken: rawToken };
}

async function getCart({ userId = null, cartToken = null }) {
  const { cart, rawCartToken } = await resolveOrCreateCart({
    userId,
    cartToken,
    createIfMissing: false
  });

  if (!cart) {
    return summarizeCart(null, [], rawCartToken);
  }

  const items = await cartModel.getCartItems(cart.id);
  return summarizeCart(cart, items, rawCartToken);
}

async function addItem({ userId = null, cartToken = null, productId, quantity = 1 }) {
  const product = await productModel.findProductDetail(productId);
  if (!product) {
    throw AppError.notFound('Producto no encontrado o inactivo', 'PRODUCT_NOT_FOUND');
  }

  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const { cart, rawCartToken } = await resolveOrCreateCart({
      userId,
      cartToken,
      createIfMissing: true,
      conn
    });

    await inventoryService.reserveStock({
      cartId: cart.id,
      userId,
      productId,
      quantity,
      conn
    });

    const items = await cartModel.upsertCartItem(cart.id, productId, quantity, conn);
    await conn.commit();

    return summarizeCart(cart, items, rawCartToken);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function updateItemQuantity({ userId = null, cartToken = null, productId, quantity }) {
  if (quantity === 0) {
    return removeItem({ userId, cartToken, productId });
  }

  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const { cart, rawCartToken } = await resolveOrCreateCart({
      userId,
      cartToken,
      createIfMissing: false,
      conn
    });

    if (!cart) {
      throw AppError.notFound('Carrito no encontrado', 'CART_NOT_FOUND');
    }

    const currentItems = await cartModel.getCartItems(cart.id, conn);
    const target = currentItems.find((i) => Number(i.product_id) === Number(productId));
    if (!target) {
      throw AppError.notFound('El producto no se encuentra en el carrito', 'CART_ITEM_NOT_FOUND');
    }

    const currentQty = Number(target.quantity);
    if (quantity > currentQty) {
      const delta = quantity - currentQty;
      await inventoryService.reserveStock({
        cartId: cart.id,
        userId,
        productId,
        quantity: delta,
        conn
      });
    } else if (quantity < currentQty) {
      // Release existing product reservations and re-reserve exact new quantity
      await inventoryService.releaseCartProductReservations({
        cartId: cart.id,
        productId,
        conn
      });
      await inventoryService.reserveStock({
        cartId: cart.id,
        userId,
        productId,
        quantity,
        conn
      });
    }

    await cartModel.setCartItemQuantity(cart.id, productId, quantity, conn);
    const updatedItems = await cartModel.getCartItems(cart.id, conn);
    await conn.commit();

    return summarizeCart(cart, updatedItems, rawCartToken);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function removeItem({ userId = null, cartToken = null, productId }) {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const { cart, rawCartToken } = await resolveOrCreateCart({
      userId,
      cartToken,
      createIfMissing: false,
      conn
    });

    if (!cart) {
      throw AppError.notFound('Carrito no encontrado', 'CART_NOT_FOUND');
    }

    await inventoryService.releaseCartProductReservations({
      cartId: cart.id,
      productId,
      conn
    });

    const removed = await cartModel.removeCartItem(cart.id, productId, conn);
    if (!removed) {
      throw AppError.notFound('El producto no se encuentra en el carrito', 'CART_ITEM_NOT_FOUND');
    }

    const updatedItems = await cartModel.getCartItems(cart.id, conn);
    await conn.commit();

    return summarizeCart(cart, updatedItems, rawCartToken);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function clearCart({ userId = null, cartToken = null }) {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const { cart, rawCartToken } = await resolveOrCreateCart({
      userId,
      cartToken,
      createIfMissing: false,
      conn
    });

    if (!cart) {
      await conn.commit();
      return summarizeCart(null, [], rawCartToken);
    }

    await inventoryService.releaseCartReservations({ cartId: cart.id, conn });
    await cartModel.clearCart(cart.id, conn);
    await conn.commit();

    return summarizeCart(cart, [], rawCartToken);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = {
  hashCartToken,
  resolveOrCreateCart,
  getCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart
};
