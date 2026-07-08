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

const bot = new Telegraf(process.env.BOT_TOKEN);

// Конфигурация Redis
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

bot.use(session({ store: store }));

// Middleware
bot.use((ctx, next) => {
  if (!ctx.session) ctx.session = {};
  ctx.session.lang = ctx.session.lang || ctx.from?.language_code || 'ru';
  ctx.locales = getLocale(ctx.session.lang);
  return next();
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
    reply_markup: {
      inline_keyboard: [
        [{ text: locales.menu_button_pulse_calculator, callback_data: 'calc_pulse_zones' }],
        [{ text: locales.menu_button_tdee_calculator, callback_data: 'calc_macros_tdee' }],
        [{ text: '🌐 Выбрать язык', callback_data: 'select_language' }]
      ]
    }
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

bot.action('calc_pulse_zones', (ctx) => {
  ctx.session.state = STATES.WAITING_FOR_AGE_PULSE;
  ctx.reply(ctx.locales.pulse_calc_start);
});

bot.action('calc_macros_tdee', (ctx) => {
  ctx.session.state = STATES.WAITING_FOR_GENDER_TDEE;
  ctx.reply(ctx.locales.tdee_calc_start, {
    reply_markup: { inline_keyboard: [[{text: 'Мужчина', callback_data: 'gender_male'}, {text: 'Женщина', callback_data: 'gender_female'}]] }
  });
});

// --- Gender Selection Handlers for TDEE ---
bot.action(/gender_(male|female)/, (ctx) => { // Regular expression for male or female
  const locales = ctx.locales;
  const gender = ctx.match[1]; // Get 'male' or 'female' from callback_data
  ctx.session.tdeeData = ctx.session.tdeeData || {}; // Initialize an object to store TDEE data
  ctx.session.tdeeData.gender = gender;
  ctx.session.state = STATES.WAITING_FOR_AGE_TDEE; // Let's move on to the next state

  ctx.reply(locales.tdee_calc_gender_selected(gender), {
    parse_mode: 'Markdown'
  });
  ctx.answerCbQuery();
});

// --- Processing text messages (core logic for receiving data) ---
bot.on(message('text'), (ctx) => {
  const state = ctx.session.state;
  const locales = ctx.locales;

  if (state === STATES.WAITING_FOR_AGE_PULSE) {
    const age = parseInt(ctx.message.text);
    if (!isNaN(age)) {
      ctx.reply(calculatePulseZones(age, locales), { parse_mode: 'Markdown' });
      ctx.session.state = STATES.IDLE;
    } else {
      ctx.reply(locales.pulse_calc_invalid_age);
    }
  } else if (state === STATES.WAITING_FOR_AGE_TDEE) {
    ctx.session.tdeeData.age = parseInt(ctx.message.text);
    ctx.session.state = STATES.WAITING_FOR_WEIGHT_TDEE;
    ctx.reply(locales.tdee_calc_ask_weight);
  } else if (state === STATES.WAITING_FOR_WEIGHT_TDEE) {
    ctx.session.tdeeData.weight = parseFloat(ctx.message.text.replace(',', '.'));
    ctx.session.state = STATES.WAITING_FOR_HEIGHT_TDEE;
    ctx.reply(locales.tdee_calc_ask_height);
  } else if (state === STATES.WAITING_FOR_HEIGHT_TDEE) {
    ctx.session.tdeeData.height = parseInt(ctx.message.text);
    ctx.session.state = STATES.WAITING_FOR_ACTIVITY_TDEE;
    const keyboard = Object.keys(activityFactors).map(k => [{ text: locales[`activity_level_${k}`], callback_data: `activity_${k}` }]);
    ctx.reply(locales.tdee_calc_ask_activity, { reply_markup: { inline_keyboard: keyboard } });
  }
});

bot.action(/activity_(.+)/, (ctx) => {
  ctx.session.tdeeData.activityLevel = ctx.match[1];
  const report = generateTDEEReport(ctx.session.tdeeData, ctx.locales);
  ctx.reply(report, { parse_mode: 'Markdown' });
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