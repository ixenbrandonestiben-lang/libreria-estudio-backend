const crypto = require('crypto');
const supportModel = require('../models/supportModel');
const mailService = require('./mailService');
const { AppError } = require('../utils/appError');
const { cleanText, escapeLike, normalizeEmail } = require('../utils/sanitizer');

function generateTicketCode() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `SUP-${datePart}-${randomPart}`;
}

async function listFaq({ topic, search }) {
  return supportModel.listFaqItems({
    topic: topic ? cleanText(topic) : undefined,
    search: search ? escapeLike(cleanText(search)) : undefined
  });
}

async function createTicket({ userId = null, contactEmail, orderNumber = null, subject, message }) {
  const ticketCode = generateTicketCode();
  const ticket = await supportModel.createSupportTicket({
    ticketCode,
    userId,
    contactEmail: normalizeEmail(contactEmail),
    orderNumber: orderNumber ? cleanText(orderNumber) : null,
    subject: cleanText(subject),
    message: cleanText(message)
  });

  mailService.sendSupportTicketConfirmation(ticket);
  return ticket;
}

async function listUserTickets(userId) {
  return supportModel.listTicketsByUserId(userId);
}

async function trackTicket(ticketCode, contactEmail) {
  const ticket = await supportModel.findTicketByCodeAndEmail(
    cleanText(ticketCode),
    normalizeEmail(contactEmail)
  );
  if (!ticket) {
    throw AppError.notFound('Ticket de soporte no encontrado', 'TICKET_NOT_FOUND');
  }
  return ticket;
}

async function updateTicketStatus(ticketId, nextStatus) {
  const updated = await supportModel.updateTicketStatus(ticketId, nextStatus);
  if (!updated) {
    throw AppError.notFound('Ticket de soporte no encontrado', 'TICKET_NOT_FOUND');
  }
  return { ticketId, status: nextStatus };
}

module.exports = {
  listFaq,
  createTicket,
  listUserTickets,
  trackTicket,
  updateTicketStatus
};
