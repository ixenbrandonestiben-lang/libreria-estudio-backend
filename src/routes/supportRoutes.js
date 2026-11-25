const express = require('express');
const supportController = require('../controllers/supportController');
const { supportLimiter } = require('../middlewares/rateLimitMiddleware');
const { authMiddleware, optionalAuthMiddleware } = require('../middlewares/authMiddleware');
const { validateMiddleware } = require('../middlewares/validateMiddleware');
const {
  listFaqValidator,
  createTicketValidator,
  trackTicketValidator
} = require('../validators/supportValidator');

const router = express.Router();

router.get('/faq', listFaqValidator, validateMiddleware, supportController.listFaq);
router.post(
  '/tickets',
  supportLimiter,
  optionalAuthMiddleware,
  createTicketValidator,
  validateMiddleware,
  supportController.createTicket
);
router.get('/tickets/my', authMiddleware, supportController.listMyTickets);
router.get(
  '/tickets/track',
  trackTicketValidator,
  validateMiddleware,
  supportController.trackTicket
);

module.exports = router;
