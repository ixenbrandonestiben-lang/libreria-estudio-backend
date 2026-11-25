/**
 * Trims string values safely.
 * @param {unknown} value
 * @returns {string}
 */
function trimString(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim();
}

/**
 * Normalizes an email address.
 * @param {unknown} email
 * @returns {string}
 */
function normalizeEmail(email) {
  return trimString(email).toLowerCase();
}

/**
 * Escapes SQL LIKE wildcards (%, _, \).
 * @param {unknown} value
 * @returns {string}
 */
function escapeLike(value) {
  return trimString(value).replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * Removes control characters and collapses excess whitespace in user-provided text.
 * @param {unknown} value
 * @returns {string}
 */
function cleanText(value) {
  if (value === null || value === undefined) {
    return '';
  }
  // eslint-disable-next-line no-control-regex
  return String(value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/**
 * Normalizes text for accent-insensitive keyword matching.
 * @param {unknown} value
 * @returns {string}
 */
function normalizeForMatching(value) {
  return cleanText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

module.exports = {
  trimString,
  normalizeEmail,
  escapeLike,
  cleanText,
  normalizeForMatching
};
