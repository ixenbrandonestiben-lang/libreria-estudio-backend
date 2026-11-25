const { body } = require('express-validator');

const registerValidator = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('El nombre completo es obligatorio')
    .isLength({ min: 2, max: 120 })
    .withMessage('El nombre debe tener entre 2 y 120 caracteres'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('El correo electrónico es obligatorio')
    .isEmail()
    .withMessage('Correo electrónico inválido')
    .isLength({ max: 190 })
    .withMessage('El correo no puede superar 190 caracteres')
    .normalizeEmail(),
  body('password')
    .isString()
    .withMessage('La contraseña es obligatoria')
    .isLength({ min: 8, max: 72 })
    .withMessage('La contraseña debe tener entre 8 y 72 caracteres'),
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 7, max: 30 })
    .withMessage('El teléfono debe tener entre 7 y 30 caracteres')
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('El correo electrónico es obligatorio')
    .isEmail()
    .withMessage('Correo electrónico inválido')
    .normalizeEmail(),
  body('password').isString().notEmpty().withMessage('La contraseña es obligatoria')
];

const forgotPasswordValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('El correo electrónico es obligatorio')
    .isEmail()
    .withMessage('Correo electrónico inválido')
    .normalizeEmail()
];

const resetPasswordValidator = [
  body('token').trim().notEmpty().withMessage('El token de recuperación es obligatorio'),
  body('newPassword')
    .isString()
    .isLength({ min: 8, max: 72 })
    .withMessage('La nueva contraseña debe tener entre 8 y 72 caracteres')
];

module.exports = {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator
};
