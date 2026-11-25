const productModel = require('../models/productModel');
const { AppError } = require('../utils/appError');
const { escapeLike, cleanText } = require('../utils/sanitizer');

async function listCategories() {
  return productModel.listCategories();
}

async function listBrands() {
  return productModel.listBrands();
}

async function searchProducts(queryParams = {}) {
  const searchRaw = queryParams.q || queryParams.search || '';
  const search = searchRaw ? escapeLike(cleanText(searchRaw)) : undefined;

  const attributes = {};
  for (const key of productModel.ALLOWED_ATTRIBUTE_KEYS) {
    if (queryParams[key] !== undefined && queryParams[key] !== '') {
      attributes[key] = cleanText(queryParams[key]);
    }
  }

  return productModel.searchProducts({
    page: queryParams.page,
    limit: queryParams.limit,
    categorySlug: queryParams.category,
    brandSlug: queryParams.brand,
    search,
    minPrice: queryParams.minPrice,
    maxPrice: queryParams.maxPrice,
    inStockOnly: queryParams.inStockOnly === true || queryParams.inStockOnly === 'true',
    sort: queryParams.sort,
    attributes
  });
}

async function getProductDetail(identifier) {
  const product = await productModel.findProductDetail(cleanText(identifier));
  if (!product) {
    throw AppError.notFound('Producto no encontrado', 'PRODUCT_NOT_FOUND');
  }
  return product;
}

module.exports = {
  listCategories,
  listBrands,
  searchProducts,
  getProductDetail
};
