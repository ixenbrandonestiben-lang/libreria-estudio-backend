const { getMailTransporter } = require('../config/mail');
const { env } = require('../config/env');
const { logger } = require('../utils/logger');

async function sendMailSafely({ to, subject, text, html }) {
  try {
    const transporter = getMailTransporter();
    await transporter.sendMail({
      from: env.mail.from,
      to,
      subject,
      text,
      html
    });
    logger.info('Correo procesado correctamente', { to, subject });
  } catch (err) {
    // Non-blocking: email failure must not break core transactional flows
    logger.warn('No se pudo enviar el correo electrónico', {
      to,
      subject,
      error: err.message
    });
  }
}

async function sendPasswordReset({ email, fullName, resetUrl }) {
  await sendMailSafely({
    to: email,
    subject: 'Recuperación de contraseña — Librería Estudio',
    text: `Hola ${fullName},\n\nRecibimos una solicitud para restablecer tu contraseña. Usa el siguiente enlace (válido por 30 minutos):\n${resetUrl}\n\nSi no solicitaste este cambio, ignora este mensaje.`,
    html: `<p>Hola <strong>${fullName}</strong>,</p><p>Recibimos una solicitud para restablecer tu contraseña. Usa el siguiente enlace (válido por 30 minutos):</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Si no solicitaste este cambio, ignora este mensaje.</p>`
  });
}

async function sendOrderConfirmation(order) {
  await sendMailSafely({
    to: order.customerEmail,
    subject: `Confirmación de pedido ${order.orderNumber} — Librería Estudio`,
    text: `Hola ${order.customerName},\n\nTu pedido ${order.orderNumber} fue registrado por un total de Q${order.totalAmount}.\nEstado actual: ${order.status}.\n\nGracias por comprar en Librería Estudio.`,
    html: `<p>Hola <strong>${order.customerName}</strong>,</p><p>Tu pedido <strong>${order.orderNumber}</strong> fue registrado por un total de <strong>Q${order.totalAmount}</strong>.</p><p>Estado actual: ${order.status}.</p><p>Gracias por comprar en Librería Estudio.</p>`
  });
}

async function sendSupportTicketConfirmation(ticket) {
  await sendMailSafely({
    to: ticket.contact_email,
    subject: `Ticket de soporte ${ticket.ticket_code} recibido — Librería Estudio`,
    text: `Hola,\n\nHemos recibido tu solicitud (${ticket.ticket_code}) con asunto: "${ticket.subject}".\nNuestro equipo te responderá a la brevedad.`,
    html: `<p>Hola,</p><p>Hemos recibido tu solicitud <strong>${ticket.ticket_code}</strong> con asunto: <em>${ticket.subject}</em>.</p><p>Nuestro equipo te responderá a la brevedad.</p>`
  });
}

module.exports = {
  sendPasswordReset,
  sendOrderConfirmation,
  sendSupportTicketConfirmation
};
