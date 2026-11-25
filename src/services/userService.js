const userModel = require('../models/userModel');
const addressModel = require('../models/addressModel');
const { AppError } = require('../utils/appError');
const { cleanText } = require('../utils/sanitizer');

async function getProfile(userId) {
  const user = await userModel.findById(userId);
  if (!user || !user.is_active) {
    throw AppError.notFound('Usuario no encontrado', 'USER_NOT_FOUND');
  }
  return user;
}

async function updateProfile(userId, updates) {
  const sanitized = {};
  if (updates.fullName !== undefined) {
    sanitized.fullName = cleanText(updates.fullName);
  }
  if (updates.phone !== undefined) {
    sanitized.phone = updates.phone ? cleanText(updates.phone) : null;
  }

  const updated = await userModel.updateProfile(userId, sanitized);
  if (!updated) {
    throw AppError.notFound('Usuario no encontrado', 'USER_NOT_FOUND');
  }
  return updated;
}

async function deactivateAccount(userId) {
  const deactivated = await userModel.deactivateUser(userId);
  if (!deactivated) {
    throw AppError.notFound('Usuario no encontrado', 'USER_NOT_FOUND');
  }
  return { deactivated: true };
}

async function listAddresses(userId) {
  return addressModel.findAllByUserId(userId);
}

async function createAddress(userId, data) {
  return addressModel.createAddress(userId, {
    label: data.label ? cleanText(data.label) : 'Casa',
    recipientName: cleanText(data.recipientName),
    recipientPhone: cleanText(data.recipientPhone),
    addressLine1: cleanText(data.addressLine1),
    addressLine2: data.addressLine2 ? cleanText(data.addressLine2) : null,
    city: cleanText(data.city),
    stateOrDepartment: cleanText(data.stateOrDepartment),
    postalCode: data.postalCode ? cleanText(data.postalCode) : null,
    referenceNotes: data.referenceNotes ? cleanText(data.referenceNotes) : null,
    isDefault: Boolean(data.isDefault)
  });
}

async function updateAddress(addressId, userId, updates) {
  const existing = await addressModel.findByIdAndUserId(addressId, userId);
  if (!existing) {
    throw AppError.notFound('Dirección no encontrada', 'ADDRESS_NOT_FOUND');
  }

  const sanitized = {};
  const textFields = [
    'label',
    'recipientName',
    'recipientPhone',
    'addressLine1',
    'addressLine2',
    'city',
    'stateOrDepartment',
    'postalCode',
    'referenceNotes'
  ];

  for (const field of textFields) {
    if (updates[field] !== undefined) {
      sanitized[field] = updates[field] === null ? null : cleanText(updates[field]);
    }
  }
  if (updates.isDefault !== undefined) {
    sanitized.isDefault = Boolean(updates.isDefault);
  }

  return addressModel.updateAddress(addressId, userId, sanitized);
}

async function deleteAddress(addressId, userId) {
  const deleted = await addressModel.deleteAddress(addressId, userId);
  if (!deleted) {
    throw AppError.notFound('Dirección no encontrada', 'ADDRESS_NOT_FOUND');
  }
  return { deleted: true };
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
