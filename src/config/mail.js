const nodemailer = require('nodemailer');
const { env } = require('./env');

let transporter = null;

/**
 * Returns a singleton Nodemailer transporter.
 * Falls back to JSON transport when SMTP_HOST is not configured.
 * @returns {import('nodemailer').Transporter}
 */
function getMailTransporter() {
  if (transporter) {
    return transporter;
  }

  if (env.mail.host) {
    transporter = nodemailer.createTransport({
      host: env.mail.host,
      port: env.mail.port,
      secure: env.mail.secure,
      auth: env.mail.user
        ? {
            user: env.mail.user,
            pass: env.mail.pass
          }
        : undefined,
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 10000
    });
  } else {
    transporter = nodemailer.createTransport({
      jsonTransport: true
    });
  }

  return transporter;
}

module.exports = {
  getMailTransporter
};
