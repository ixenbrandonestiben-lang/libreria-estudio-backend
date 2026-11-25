const express = require('express');
const orderController = require('../controllers/orderController');
const { authMiddleware, optionalAuthMiddleware } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const { termsAcceptanceMiddleware } = require('../middlewares/termsAcceptanceMiddleware');
const { validateMiddleware } = require('../middlewares/validateMiddleware');
const { USER_ROLES } = require('../utils/constants');
const {
  createOrderValidator,
  listOrdersValidator,
  orderNumberParamValidator,
  trackOrderValidator,
  updateOrderStatusValidator
} = require('../validators/orderValidator');

const router = express.Router();

router.get('/track', trackOrderValidator, validateMiddleware, orderController.trackOrder);

router.post(
  '/',
  optionalAuthMiddleware,
  termsAcceptanceMiddleware,
  createOrderValidator,
  validateMiddleware,
  orderController.createOrder
);

router.get('/', authMiddleware, listOrdersValidator, validateMiddleware, orderController.listMyOrders);
router.get(
  '/:orderNumber',
  authMiddleware,
  orderNumberParamValidator,
  validateMiddleware,
  orderController.getMyOrderDetail
);

router.patch(
  '/:orderId/status',
  authMiddleware,
  requireRole(USER_ROLES.ADMIN),
  updateOrderStatusValidator,
  validateMiddleware,
  orderController.updateOrderStatus
);

module.exports = router;
