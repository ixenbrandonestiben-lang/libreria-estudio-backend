const express = require('express');
const cartController = require('../controllers/cartController');
const { optionalAuthMiddleware } = require('../middlewares/authMiddleware');
const { validateMiddleware } = require('../middlewares/validateMiddleware');
const {
  addCartItemValidator,
  updateCartItemValidator,
  removeCartItemValidator
} = require('../validators/cartValidator');

const router = express.Router();

router.use(optionalAuthMiddleware);

router.get('/', cartController.getCart);
router.post('/items', addCartItemValidator, validateMiddleware, cartController.addItem);
router.put(
  '/items/:productId',
  updateCartItemValidator,
  validateMiddleware,
  cartController.updateItem
);
router.delete(
  '/items/:productId',
  removeCartItemValidator,
  validateMiddleware,
  cartController.removeItem
);
router.delete('/', cartController.clearCart);

module.exports = router;
