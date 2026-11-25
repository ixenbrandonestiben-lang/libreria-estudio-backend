const supportService = require('../services/supportService');
const { sendSuccess } = require('../utils/responseHelper');

async function listFaq(req, res, next) {
  try {
    const faqs = await supportService.listFaq({
      topic: req.query.topic,
      search: req.query.q
    });
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Preguntas frecuentes obtenidas',
      data: faqs
    });
  } catch (err) {
    return next(err);
  }
}

async function createTicket(req, res, next) {
  try {
    const ticket = await supportService.createTicket({
      userId: req.user ? req.user.id : null,
      contactEmail: req.body.contactEmail,
      orderNumber: req.body.orderNumber,
      subject: req.body.subject,
      message: req.body.message
    });
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Solicitud de soporte registrada correctamente',
      data: ticket
    });
  } catch (err) {
    return next(err);
  }
}

async function listMyTickets(req, res, next) {
  try {
    const tickets = await supportService.listUserTickets(req.user.id);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Tickets de soporte obtenidos',
      data: tickets
    });
  } catch (err) {
    return next(err);
  }
}

async function trackTicket(req, res, next) {
  try {
    const ticket = await supportService.trackTicket(req.query.ticketCode, req.query.email);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Estado del ticket consultado',
      data: ticket
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listFaq,
  createTicket,
  listMyTickets,
  trackTicket
};
