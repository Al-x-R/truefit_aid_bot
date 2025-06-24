const ru = require('../locales/ru');
const en = require('../locales/en');

const locales = {
  'ru': ru,
  'en': en
};

const defaultLang = 'ru'; // Default language

/**
 * Returns an object with text strings for the specified language.
 * @param {string} lang - Language code (e.g., 'ru' or 'en').
 * @returns {object} Localization object.
 */
function getLocale(lang) {
  return locales[lang] || locales[defaultLang];
}

module.exports = {
  getLocale
};
