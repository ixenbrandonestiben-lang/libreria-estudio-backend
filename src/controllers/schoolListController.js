const schoolListService = require('../services/schoolListService');
const { sendSuccess } = require('../utils/responseHelper');

async function quoteSchoolList(req, res, next) {
  try {
    const quotation = await schoolListService.quoteSchoolList({
      rawText: req.body.rawText,
      items: req.body.items,
      educationLevel: req.body.educationLevel
    });

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Cotización de lista escolar generada',
      data: quotation
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  quoteSchoolList
};
