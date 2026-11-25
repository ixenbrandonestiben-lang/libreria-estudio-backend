const legalService = require('../services/legalService');
const { getCookieOptions } = require('../config/security');
const { COOKIE_NAMES } = require('../utils/constants');
const { sendSuccess } = require('../utils/responseHelper');

function extractConsentToken(req) {
  const headerToken = req.headers['x-consent-token'];
  if (typeof headerToken === 'string' && headerToken.trim()) {
    return headerToken.trim();
  }
  const cookieHeader = req.headers.cookie;
  if (typeof cookieHeader === 'string') {
    const match = cookieHeader
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${COOKIE_NAMES.CONSENT_TOKEN}=`));
    if (match) {
      return decodeURIComponent(match.split('=')[1] || '');
    }
  }
  return null;
}

async function saveCookieConsent(req, res, next) {
  try {
    const result = await legalService.saveCookieConsent({
      userId: req.user ? req.user.id : null,
      consentToken: extractConsentToken(req),
      analyticsEnabled: req.body.analyticsEnabled,
      preferencesEnabled: req.body.preferencesEnabled,
      policyVersion: req.body.policyVersion
    });

    res.setHeader('X-Consent-Token', result.consentToken);
    res.cookie(
      COOKIE_NAMES.CONSENT_TOKEN,
      result.consentToken,
      getCookieOptions(365 * 24 * 60 * 60 * 1000)
    );

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Preferencias de cookies guardadas',
      data: result.consent
    });
  } catch (err) {
    return next(err);
  }
}

async function getCookieConsent(req, res, next) {
  try {
    const consent = await legalService.getCookieConsent({
      userId: req.user ? req.user.id : null,
      consentToken: extractConsentToken(req)
    });

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Preferencias de cookies consultadas',
      data: consent
    });
  } catch (err) {
    return next(err);
  }
}

async function getLegalMetadata(_req, res, next) {
  try {
    const metadata = legalService.getLegalDocumentsMetadata();
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Metadatos legales vigentes',
      data: metadata
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  saveCookieConsent,
  getCookieConsent,
  getLegalMetadata
};
