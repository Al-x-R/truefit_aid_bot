import ru from '../locales/ru.js';
import en from '../locales/en.js';

export const locales = {
  'ru': ru,
  'en': en
};


export const getLocale = (lang) => {
  return locales[lang] || locales.ru;
};
