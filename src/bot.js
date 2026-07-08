import 'dotenv/config';
import { session, Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { Redis } from '@telegraf/session/redis';
import { createClient } from 'redis';

import { calculatePulseZones } from './modules/pulseCalculator.js';
import { generateTDEEReport } from './modules/tdeeCalculator.js';
import { getLocale } from './utils/i18n.js';
import { activityFactors, STATES } from './utils/constants.js';
import { createAnalytics } from './modules/analytics.js';
import { createUserDataStore } from './modules/userDataStore.js';

const bot = new Telegraf(process.env.BOT_TOKEN);

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    keepAlive: 5000,
  },
  password: process.env.REDIS_PASSWORD || undefined,
  database: parseInt(process.env.REDIS_DB || '0', 10),
});

redisClient.on('error', (err) => console.error('Redis client error:', err));

const store = Redis({ client: redisClient });
const analytics = createAnalytics(redisClient);
const userDataStore = createUserDataStore(redisClient);

bot.use(session({ store: store }));

bot.use((ctx, next) => {
  if (!ctx.session) ctx.session = {};
  ctx.session.lang = ctx.session.lang || ctx.from?.language_code || 'ru';
  ctx.locales = getLocale(ctx.session.lang);
  return next();
});

const pulseResultKeyboard = (locales) => ({
  inline_keyboard: [
    [{ text: locales.pulse_calc_recalc_button || '🔄 Сделать новый расчёт', callback_data: 'recalc_pulse_zones' }],
    [{ text: locales.main_menu_button || '🏠 Главное меню', callback_data: 'main_menu' }]
  ]
});

const tdeeResultKeyboard = (locales) => ({
  inline_keyboard: [
    [{ text: locales.tdee_calc_recalc_button || '🔄 Сделать новый расчёт', callback_data: 'recalc_macros_tdee' }],
    [{ text: locales.main_menu_button || '🏠 Главное меню', callback_data: 'main_menu' }]
  ]
});

const mainMenuKeyboard = (locales) => ({
  inline_keyboard: [
    [{ text: locales.menu_button_pulse_calculator, callback_data: 'calc_pulse_zones' }],
    [{ text: locales.menu_button_tdee_calculator, callback_data: 'calc_macros_tdee' }],
    [{ text: '🌐 Выбрать язык', callback_data: 'select_language' }]
  ]
});

const startBot = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log('Redis connected successfully!');
    }
    await bot.launch();
    console.log('The bot is launched and ready to work!');
  } catch (error) {
    console.error('Failed to launch bot:', error);
    process.exit(1);
  }
};

startBot();

bot.start((ctx) => {
  ctx.session.state = STATES.IDLE;
  analytics.trackEvent(ctx.from.id, 'start', { lang: ctx.session.lang });
  const locales = ctx.locales;
  const msg = `${locales.greeting(ctx.from.first_name || '')}\n\n${locales.description_start_long}\n\n` +
      `*${locales.menu_button_pulse_calculator}*: ${locales.pulse_calc_short_desc}\n` +
      `*${locales.menu_button_tdee_calculator}*: ${locales.tdee_calc_short_desc}\n\n${locales.select_function}`;

  ctx.reply(msg, {
    parse_mode: 'Markdown',
    reply_markup: mainMenuKeyboard(locales)
  });
});

bot.command('stats', async (ctx) => {
  if (String(ctx.from.id) !== process.env.ADMIN_USER_ID) return;
  const stats = await analytics.getStats();
  ctx.reply(`📊 Статистика: Всего юзеров: ${stats.totalUsers}, DAU: ${stats.dau}`);
});

bot.action('select_language', (ctx) => {
  ctx.reply('Выберите язык / Choose language:', {
    reply_markup: { inline_keyboard: [[{text: 'Русский 🇷🇺', callback_data: 'lang_ru'}, {text: 'English 🇬🇧', callback_data: 'lang_en'}]] }
  });
  ctx.answerCbQuery();
});

bot.action(/lang_(ru|en)/, (ctx) => {
  ctx.session.lang = ctx.match[1];
  ctx.locales = getLocale(ctx.session.lang);
  ctx.reply('Язык обновлен / Language updated');
  ctx.answerCbQuery();
});

bot.action('main_menu', (ctx) => {
  ctx.session.state = STATES.IDLE;
  ctx.reply(ctx.locales.select_function, { reply_markup: mainMenuKeyboard(ctx.locales) });
  ctx.answerCbQuery();
});

const enterPulseCalculator = async (ctx) => {
  const locales = ctx.locales;
  const saved = await userDataStore.getPulseData(ctx.from.id);

  if (saved && saved.age) {
    ctx.reply(
        `У вас есть сохранённые данные (возраст: ${saved.age}). Использовать их для нового расчёта или ввести новые?`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '✅ Использовать сохранённые', callback_data: 'pulse_use_saved' }],
              [{ text: '✏️ Ввести новые', callback_data: 'pulse_enter_new' }]
            ]
          }
        }
    );
  } else {
    ctx.session.state = STATES.WAITING_FOR_AGE_PULSE;
    ctx.reply(locales.pulse_calc_start);
  }
};

bot.action('calc_pulse_zones', async (ctx) => {
  analytics.trackEvent(ctx.from.id, 'pulse_calc_started');
  await enterPulseCalculator(ctx);
  ctx.answerCbQuery();
});

bot.action('recalc_pulse_zones', async (ctx) => {
  analytics.trackEvent(ctx.from.id, 'pulse_calc_started');
  await enterPulseCalculator(ctx);
  ctx.answerCbQuery();
});

bot.action('pulse_enter_new', (ctx) => {
  ctx.session.state = STATES.WAITING_FOR_AGE_PULSE;
  ctx.reply(ctx.locales.pulse_calc_start);
  ctx.answerCbQuery();
});

bot.action('pulse_use_saved', async (ctx) => {
  const locales = ctx.locales;
  const saved = await userDataStore.getPulseData(ctx.from.id);

  if (!saved || !saved.age) {
    ctx.reply('Не удалось найти сохранённые данные, введите возраст заново:');
    ctx.session.state = STATES.WAITING_FOR_AGE_PULSE;
    return ctx.answerCbQuery();
  }

  const result = calculatePulseZones(saved.age, locales);
  analytics.trackEvent(ctx.from.id, 'pulse_calc_completed', { age: saved.age, source: 'saved' });
  ctx.reply(result, { parse_mode: 'Markdown', reply_markup: pulseResultKeyboard(locales) });
  ctx.session.state = STATES.IDLE;
  ctx.answerCbQuery();
});

const enterTdeeCalculator = async (ctx) => {
  const locales = ctx.locales;
  const saved = await userDataStore.getTdeeData(ctx.from.id);

  if (saved && saved.gender && saved.age && saved.weight && saved.height && saved.activityLevel) {
    ctx.reply(
        `У вас есть сохранённые данные (пол: ${saved.gender === 'male' ? 'муж.' : 'жен.'}, возраст: ${saved.age}, вес: ${saved.weight}, рост: ${saved.height}). Использовать их или ввести новые?`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '✅ Использовать сохранённые', callback_data: 'tdee_use_saved' }],
              [{ text: '✏️ Ввести новые', callback_data: 'tdee_enter_new' }]
            ]
          }
        }
    );
  } else {
    ctx.session.state = STATES.WAITING_FOR_GENDER_TDEE;
    ctx.reply(locales.tdee_calc_start, {
      reply_markup: { inline_keyboard: [[{text: 'Мужчина', callback_data: 'gender_male'}, {text: 'Женщина', callback_data: 'gender_female'}]] }
    });
  }
};

bot.action('calc_macros_tdee', async (ctx) => {
  analytics.trackEvent(ctx.from.id, 'tdee_calc_started');
  await enterTdeeCalculator(ctx);
  ctx.answerCbQuery();
});

bot.action('recalc_macros_tdee', async (ctx) => {
  analytics.trackEvent(ctx.from.id, 'tdee_calc_started');
  await enterTdeeCalculator(ctx);
  ctx.answerCbQuery();
});

bot.action('tdee_enter_new', (ctx) => {
  ctx.session.state = STATES.WAITING_FOR_GENDER_TDEE;
  ctx.reply(ctx.locales.tdee_calc_start, {
    reply_markup: { inline_keyboard: [[{text: 'Мужчина', callback_data: 'gender_male'}, {text: 'Женщина', callback_data: 'gender_female'}]] }
  });
  ctx.answerCbQuery();
});

bot.action('tdee_use_saved', async (ctx) => {
  const locales = ctx.locales;
  const saved = await userDataStore.getTdeeData(ctx.from.id);

  if (!saved) {
    ctx.reply('Не удалось найти сохранённые данные, начнём заново.');
    ctx.session.state = STATES.WAITING_FOR_GENDER_TDEE;
    ctx.reply(locales.tdee_calc_start, {
      reply_markup: { inline_keyboard: [[{text: 'Мужчина', callback_data: 'gender_male'}, {text: 'Женщина', callback_data: 'gender_female'}]] }
    });
    return ctx.answerCbQuery();
  }

  const report = generateTDEEReport(saved, locales);
  analytics.trackEvent(ctx.from.id, 'tdee_calc_completed', {
    gender: saved.gender, age: saved.age, activityLevel: saved.activityLevel, source: 'saved'
  });
  ctx.reply(report, { parse_mode: 'Markdown', reply_markup: tdeeResultKeyboard(locales) });
  ctx.session.state = STATES.IDLE;
  ctx.answerCbQuery();
});

bot.action(/gender_(male|female)/, (ctx) => {
  ctx.session.tdeeData = { gender: ctx.match[1] };
  ctx.session.state = STATES.WAITING_FOR_AGE_TDEE;
  ctx.reply(ctx.locales.tdee_calc_gender_selected(ctx.match[1]));
  ctx.answerCbQuery();
});

bot.on(message('text'), async (ctx) => {
  const state = ctx.session.state;
  const locales = ctx.locales;

  if (state === STATES.WAITING_FOR_AGE_PULSE) {
    const age = parseInt(ctx.message.text);
    if (!isNaN(age) && age > 0 && age < 120) {
      const result = calculatePulseZones(age, locales);
      await userDataStore.savePulseData(ctx.from.id, { age });
      analytics.trackEvent(ctx.from.id, 'pulse_calc_completed', { age, source: 'new' });
      ctx.reply(result, { parse_mode: 'Markdown', reply_markup: pulseResultKeyboard(locales) });
      ctx.session.state = STATES.IDLE;
    } else {
      ctx.reply(locales.pulse_calc_invalid_age);
    }
  } else if (state === STATES.WAITING_FOR_AGE_TDEE) {
    const age = parseInt(ctx.message.text);
    if (!isNaN(age) && age > 0 && age < 120) {
      ctx.session.tdeeData.age = age;
      ctx.session.state = STATES.WAITING_FOR_WEIGHT_TDEE;
      ctx.reply(locales.tdee_calc_ask_weight);
    } else {
      ctx.reply(locales.tdee_calc_invalid_age);
    }
  } else if (state === STATES.WAITING_FOR_WEIGHT_TDEE) {
    const weight = parseFloat(ctx.message.text.replace(',', '.'));
    if (!isNaN(weight) && weight > 0 && weight < 300) {
      ctx.session.tdeeData.weight = weight;
      ctx.session.state = STATES.WAITING_FOR_HEIGHT_TDEE;
      ctx.reply(locales.tdee_calc_ask_height);
    } else {
      ctx.reply(locales.tdee_calc_invalid_weight);
    }
  } else if (state === STATES.WAITING_FOR_HEIGHT_TDEE) {
    const height = parseInt(ctx.message.text);
    if (!isNaN(height) && height > 0 && height < 250) {
      ctx.session.tdeeData.height = height;
      ctx.session.state = STATES.WAITING_FOR_ACTIVITY_TDEE;
      const keyboard = Object.keys(activityFactors).map(k => [{ text: locales[`activity_level_${k}`], callback_data: `activity_${k}` }]);
      ctx.reply(locales.tdee_calc_ask_activity, { reply_markup: { inline_keyboard: keyboard } });
    } else {
      ctx.reply(locales.tdee_calc_invalid_height);
    }
  }
});

bot.action(/activity_(.+)/, async (ctx) => {
  const activityLevel = ctx.match[1];
  if (!activityFactors[activityLevel]) {
    ctx.reply(ctx.locales.tdee_calc_invalid_activity);
    return ctx.answerCbQuery();
  }

  ctx.session.tdeeData.activityLevel = activityLevel;
  const userData = ctx.session.tdeeData;
  const report = generateTDEEReport(userData, ctx.locales);

  await userDataStore.saveTdeeData(ctx.from.id, {
    gender: userData.gender,
    age: userData.age,
    weight: userData.weight,
    height: userData.height,
    activityLevel
  });
  analytics.trackEvent(ctx.from.id, 'tdee_calc_completed', {
    gender: userData.gender, age: userData.age, activityLevel, source: 'new'
  });

  ctx.reply(report, { parse_mode: 'Markdown', reply_markup: tdeeResultKeyboard(ctx.locales) });
  ctx.session.state = STATES.IDLE;
  delete ctx.session.tdeeData;
  ctx.answerCbQuery();
});

const stopBot = async () => {
  await bot.stop();
  await redisClient.quit();
  process.exit(0);
};

process.once('SIGINT', stopBot);
process.once('SIGTERM', stopBot);