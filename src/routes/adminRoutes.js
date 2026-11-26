const express = require('express');
const adminController = require('../controllers/adminController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const { validateMiddleware } = require('../middlewares/validateMiddleware');
const { USER_ROLES } = require('../utils/constants');
const {
  listUsersValidator,
  updateUserRoleAndStatusValidator,
  listAdminProductsValidator,
  createProductValidator,
  updateProductValidator,
  listAdminOrdersValidator,
  listAdminTicketsValidator,
  updateTicketStatusValidator
} = require('../validators/adminValidator');

const router = express.Router();

router.use(authMiddleware, requireRole(USER_ROLES.ADMIN));

router.get('/analytics', adminController.getDashboardAnalytics);

router.get('/users', listUsersValidator, validateMiddleware, adminController.listUsers);
router.patch(
  '/users/:userId',
  updateUserRoleAndStatusValidator,
  validateMiddleware,
  adminController.updateUserRoleAndStatus
);

router.get('/products', listAdminProductsValidator, validateMiddleware, adminController.listProducts);
router.post('/products', createProductValidator, validateMiddleware, adminController.createProduct);
router.patch(
  '/products/:productId',
  updateProductValidator,
  validateMiddleware,
  adminController.updateProduct
);

router.get('/orders', listAdminOrdersValidator, validateMiddleware, adminController.listOrders);

router.get('/tickets', listAdminTicketsValidator, validateMiddleware, adminController.listTickets);
router.patch(
  '/tickets/:ticketCode',
  updateTicketStatusValidator,
  validateMiddleware,
  adminController.updateTicketStatus
);

module.exports = router;
