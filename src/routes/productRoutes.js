const express = require('express');
const productController = require('../controllers/productController');
const { searchQuoteLimiter } = require('../middlewares/rateLimitMiddleware');
const { validateMiddleware } = require('../middlewares/validateMiddleware');
const {
  listProductsValidator,
  productIdentifierValidator
} = require('../validators/productValidator');

const router = express.Router();

router.get('/categories', productController.listCategories);
router.get('/brands', productController.listBrands);
router.get(
  '/',
  searchQuoteLimiter,
  listProductsValidator,
  validateMiddleware,
  productController.listProducts
);
router.get(
  '/:identifier',
  productIdentifierValidator,
  validateMiddleware,
  productController.getProductDetail
);

module.exports = router;
