const express = require('express');
const schoolListController = require('../controllers/schoolListController');
const { searchQuoteLimiter } = require('../middlewares/rateLimitMiddleware');
const { validateMiddleware } = require('../middlewares/validateMiddleware');
const { quoteSchoolListValidator } = require('../validators/schoolListValidator');

const router = express.Router();

router.post(
  '/quote',
  searchQuoteLimiter,
  quoteSchoolListValidator,
  validateMiddleware,
  schoolListController.quoteSchoolList
);

module.exports = router;
