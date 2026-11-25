const crypto = require('crypto');
const consentModel = require('../models/consentModel');
const { LEGAL_VERSIONS } = require('../utils/constants');

function hashConsentToken(rawToken) {
  return crypto.createHash('sha256').update(String(rawToken)).digest('hex');
}

function generateConsentToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function saveCookieConsent({
  userId = null,
  consentToken = null,
  analyticsEnabled,
  preferencesEnabled,
  policyVersion
}) {
  const rawToken = consentToken || generateConsentToken();
  const consentTokenHash = hashConsentToken(rawToken);

  const saved = await consentModel.saveCookieConsent({
    userId,
    consentTokenHash,
    analyticsEnabled: Boolean(analyticsEnabled),
    preferencesEnabled: Boolean(preferencesEnabled),
    policyVersion: policyVersion || LEGAL_VERSIONS.COOKIE_POLICY_VERSION
  });

  return {
    consent: saved,
    consentToken: rawToken
  };
}

async function getCookieConsent({ userId = null, consentToken = null }) {
  if (userId) {
    const userConsent = await consentModel.findLatestByUserId(userId);
    if (userConsent) {
      return userConsent;
    }
  }

  if (consentToken) {
    return consentModel.findLatestByTokenHash(hashConsentToken(consentToken));
  }

  return null;
}

function getLegalDocumentsMetadata() {
  return {
    termsVersion: LEGAL_VERSIONS.TERMS_VERSION,
    privacyVersion: LEGAL_VERSIONS.PRIVACY_VERSION,
    cookiePolicyVersion: LEGAL_VERSIONS.COOKIE_POLICY_VERSION,
    updatedAt: '2026-01-01T00:00:00.000Z'
  };
}

module.exports = {
  saveCookieConsent,
  getCookieConsent,
  getLegalDocumentsMetadata
};
