const express = require('express');
const legalController = require('../controllers/legalController');
const { optionalAuthMiddleware } = require('../middlewares/authMiddleware');
const { validateMiddleware } = require('../middlewares/validateMiddleware');
const { cookieConsentValidator } = require('../validators/supportValidator');

const router = express.Router();

router.get('/metadata', legalController.getLegalMetadata);
router.get('/cookies/consent', optionalAuthMiddleware, legalController.getCookieConsent);
router.post(
  '/cookies/consent',
  optionalAuthMiddleware,
  cookieConsentValidator,
  validateMiddleware,
  legalController.saveCookieConsent
);

module.exports = router;
