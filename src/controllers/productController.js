const productService = require('../services/productService');
const { sendSuccess } = require('../utils/responseHelper');

async function listCategories(_req, res, next) {
  try {
    const categories = await productService.listCategories();
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Categorías obtenidas correctamente',
      data: categories
    });
  } catch (err) {
    return next(err);
  }
}

async function listBrands(_req, res, next) {
  try {
    const brands = await productService.listBrands();
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Marcas obtenidas correctamente',
      data: brands
    });
  } catch (err) {
    return next(err);
  }
}

async function listProducts(req, res, next) {
  try {
    const result = await productService.searchProducts(req.query);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Productos obtenidos correctamente',
      data: result.items,
      meta: result.pagination
    });
  } catch (err) {
    return next(err);
  }
}

async function getProductDetail(req, res, next) {
  try {
    const product = await productService.getProductDetail(req.params.identifier);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Detalle del producto',
      data: product
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listCategories,
  listBrands,
  listProducts,
  getProductDetail
};
