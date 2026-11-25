const express = require('express');
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { validateMiddleware } = require('../middlewares/validateMiddleware');
const {
  updateProfileValidator,
  addressValidator,
  addressIdParamValidator
} = require('../validators/userValidator');

const router = express.Router();

router.use(authMiddleware);

router.get('/profile', userController.getProfile);
router.put('/profile', updateProfileValidator, validateMiddleware, userController.updateProfile);
router.delete('/profile', userController.deactivateAccount);

router.get('/addresses', userController.listAddresses);
router.post('/addresses', addressValidator, validateMiddleware, userController.createAddress);
router.put(
  '/addresses/:addressId',
  addressIdParamValidator,
  addressValidator,
  validateMiddleware,
  userController.updateAddress
);
router.delete(
  '/addresses/:addressId',
  addressIdParamValidator,
  validateMiddleware,
  userController.deleteAddress
);

module.exports = router;
