const userService = require('../services/userService');
const { sendSuccess } = require('../utils/responseHelper');

async function getProfile(req, res, next) {
  try {
    const profile = await userService.getProfile(req.user.id);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Perfil de usuario',
      data: profile
    });
  } catch (err) {
    return next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const updated = await userService.updateProfile(req.user.id, req.body);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Perfil actualizado correctamente',
      data: updated
    });
  } catch (err) {
    return next(err);
  }
}

async function deactivateAccount(req, res, next) {
  try {
    const result = await userService.deactivateAccount(req.user.id);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Cuenta desactivada correctamente',
      data: result
    });
  } catch (err) {
    return next(err);
  }
}

async function listAddresses(req, res, next) {
  try {
    const addresses = await userService.listAddresses(req.user.id);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Direcciones obtenidas correctamente',
      data: addresses
    });
  } catch (err) {
    return next(err);
  }
}

async function createAddress(req, res, next) {
  try {
    const address = await userService.createAddress(req.user.id, req.body);
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Dirección guardada correctamente',
      data: address
    });
  } catch (err) {
    return next(err);
  }
}

async function updateAddress(req, res, next) {
  try {
    const address = await userService.updateAddress(req.params.addressId, req.user.id, req.body);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Dirección actualizada correctamente',
      data: address
    });
  } catch (err) {
    return next(err);
  }
}

async function deleteAddress(req, res, next) {
  try {
    const result = await userService.deleteAddress(req.params.addressId, req.user.id);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Dirección eliminada correctamente',
      data: result
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  deactivateAccount,
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress
};
