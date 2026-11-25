const express = require('express');
const authController = require('../controllers/authController');
const { authLimiter } = require('../middlewares/rateLimitMiddleware');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { validateMiddleware } = require('../middlewares/validateMiddleware');
const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator
} = require('../validators/authValidator');

const router = express.Router();

router.post('/register', authLimiter, registerValidator, validateMiddleware, authController.register);
router.post('/login', authLimiter, loginValidator, validateMiddleware, authController.login);
router.post(
  '/forgot-password',
  authLimiter,
  forgotPasswordValidator,
  validateMiddleware,
  authController.forgotPassword
);
router.post(
  '/reset-password',
  authLimiter,
  resetPasswordValidator,
  validateMiddleware,
  authController.resetPassword
);
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
