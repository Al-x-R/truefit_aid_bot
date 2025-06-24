import 'dotenv/config';

import { session, Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
//const LocalSession = require('telegraf-session-local');
import { calculatePulseZones } from './modules/pulseCalculator.js';
import { generateTDEEReport } from './modules/tdeeCalculator.js';
import { getLocale } from './utils/i18n.js';
import { activityFactors, STATES } from './utils/constants.js';

import { Redis } from '@telegraf/session/redis';
import { createClient } from 'redis';



const bot = new Telegraf(process.env.BOT_TOKEN);

// Initialize session (will store data in memory by default)
// For production, it is better to use storage like Redis/Mongo
//const localSession = new LocalSession({ database: 'session_db.json' }); // Save sessions to a file

//bot.use(localSession.middleware()); // Connecting middleware for sessions

const redisClient = createClient({
  url: `redis://${process.env.REDIS_PASSWORD ? `:${process.env.REDIS_PASSWORD}@` : ''}${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}/${process.env.REDIS_DB || 0}`
});

redisClient.on('connect', () => console.log('Redis client connected! (via redis package)'));
redisClient.on('error', (err) => console.error('Redis Client Error (redis package):', err));

(async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    // В продакшене здесь можно завершить работу приложения или предпринять другие действия
  }
})();

bot.use(
  session({
    store: Redis(redisClient), // <-- Здесь используем Redis из '@telegraf/session/redis'
    ttl: 3600 // Время жизни сессии в секундах (1 час)
  })
);


// --- Middleware for language detection ---
bot.use((ctx, next) => {
  if (!ctx.session) {
    ctx.session = {};
    console.warn('ctx.session was undefined. Initializing an empty session object.');
  }

  ctx.session.lang = ctx.session.lang || ctx.from.language_code || 'ru';
  ctx.locales = getLocale(ctx.session.lang); // Attach locale to the context
  return next();
});

// /start command handler
bot.start((ctx) => {
  ctx.session.state = STATES.IDLE;
  const userName = ctx.from.first_name || '';
  const locales = ctx.locales;

  let welcomeMessage = locales.greeting(userName) + '\n\n';
  welcomeMessage += locales.description_start_long || 'Я могу помочь вам с расчетами для фитнеса и здоровья:';
  welcomeMessage += '\n\n';
  welcomeMessage += `*${locales.menu_button_pulse_calculator}*: ${locales.pulse_calc_short_desc || 'Рассчитаю ваши персональные пульсовые зоны для эффективных тренировок.'}\n`; // Добавим в локаль
  welcomeMessage += `*${locales.menu_button_tdee_calculator}*: ${locales.tdee_calc_short_desc || 'Определю вашу норму калорий и макронутриентов для достижения ваших целей (похудение, набор массы, поддержание).'} \n`; // Добавим в локаль

  welcomeMessage += '\n' + locales.select_function;

  ctx.reply(welcomeMessage, {
    reply_markup: {
      inline_keyboard: [
        [{ text: locales.menu_button_pulse_calculator, callback_data: 'calc_pulse_zones' }],
        [{ text: locales.menu_button_tdee_calculator, callback_data: 'calc_macros_tdee' }],
        [{ text: '🌐 Выбрать язык / Select Language', callback_data: 'select_language' }]
      ]
    }
  });
});

// --- Handler for the language selection button ---
bot.action('select_language', (ctx) => {
  ctx.session.state = STATES.SELECTING_LANGUAGE;
  ctx.reply('Пожалуйста, выберите язык:\nPlease select a language:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Русский 🇷🇺', callback_data: 'lang_ru' }],
        [{ text: 'English 🇬🇧', callback_data: 'lang_en' }]
      ]
    }
  });
  ctx.answerCbQuery();
});

// --- Handler for language selection ---
bot.action(/lang_(ru|en)/, (ctx) => {
  const lang = ctx.match[1];
  ctx.session.lang = lang;
  ctx.locales = getLocale(lang); // Update locales in context
  const userName = ctx.from.first_name || '';
  const locales = ctx.locales;

  let welcomeMessage = locales.greeting(userName) + '\n\n';
  welcomeMessage += locales.description_start_long || 'Я могу помочь вам с расчетами для фитнеса и здоровья:';
  welcomeMessage += '\n\n';
  welcomeMessage += `*${locales.menu_button_pulse_calculator}*: ${locales.pulse_calc_short_desc || 'Рассчитаю ваши персональные пульсовые зоны для эффективных тренировок.'}\n`;
  welcomeMessage += `*${locales.menu_button_tdee_calculator}*: ${locales.tdee_calc_short_desc || 'Определю вашу норму калорий и макронутриентов для достижения ваших целей (похудение, набор массы, поддержание).'} \n`;
  welcomeMessage += '\n' + locales.select_function;

  ctx.reply(welcomeMessage, {
    reply_markup: {
      inline_keyboard: [
        [{ text: ctx.locales.menu_button_pulse_calculator, callback_data: 'calc_pulse_zones' }],
        [{ text: ctx.locales.menu_button_tdee_calculator, callback_data: 'calc_macros_tdee' }],
        [{ text: '🌐 Выбрать язык / Select Language', callback_data: 'select_language' }]
      ]
    }
  });
  ctx.session.state = STATES.IDLE;
  ctx.answerCbQuery();
});

// Handler for the "Heart Rate Calculator" button
bot.action('calc_pulse_zones', (ctx) => {
  ctx.session.state = STATES.WAITING_FOR_AGE_PULSE; // Setting up the age waiting state
  ctx.reply(ctx.locales.pulse_calc_start);
});

bot.action('recalc_pulse_zones', (ctx) => {
  const locales = ctx.locales;
  ctx.session.state = STATES.WAITING_FOR_AGE_PULSE;
  ctx.reply(locales.pulse_calc_start);
  ctx.answerCbQuery();
});

// Handler for the "Calculate Calories and Macronutrients" button
bot.action('calc_macros_tdee', (ctx) => {
  const locales = ctx.locales;
  ctx.session.state = STATES.WAITING_FOR_GENDER_TDEE; // Set the first state for TDEE
  ctx.reply(locales.tdee_calc_start, {
    reply_markup: {
      inline_keyboard: [
        [{ text: locales.tdee_calc_gender_male_button, callback_data: 'gender_male' }],
        [{ text: locales.tdee_calc_gender_female_button, callback_data: 'gender_female' }]
      ]
    }
  });
  ctx.answerCbQuery();
});

// --- New handler for the "Make a new Calorie/Macro calculation" button" ---
bot.action('recalc_macros_tdee', (ctx) => {
  const locales = ctx.locales;
  ctx.session.state = STATES.WAITING_FOR_GENDER_TDEE;
  ctx.reply(locales.tdee_calc_start, {
    reply_markup: {
      inline_keyboard: [
        [{ text: locales.tdee_calc_gender_male_button, callback_data: 'gender_male' }],
        [{ text: locales.tdee_calc_gender_female_button, callback_data: 'gender_female' }]
      ]
    }
  });
  ctx.answerCbQuery();
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
  const currentState = ctx.session.state || STATES.IDLE;
  const locales = ctx.locales;

  if (ctx.message.text.startsWith('/')) {
    return;
  }

  switch (currentState) {
    case STATES.WAITING_FOR_AGE_PULSE:
      const age = parseInt(ctx.message.text);
      if (!isNaN(age) && age > 0 && age < 120) {
        const result = calculatePulseZones(age, locales);
        ctx.reply(result, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: locales.pulse_calc_recalc_button, callback_data: 'recalc_pulse_zones' }],
              [{ text: locales.main_menu_button, callback_data: 'main_menu' }]
            ]
          }
        });
        ctx.session.state = STATES.IDLE;
      } else {
        ctx.reply(locales.pulse_calc_invalid_age);
      }
      break;

    case STATES.WAITING_FOR_AGE_TDEE:
      const ageTDEE = parseInt(ctx.message.text);
      if (!isNaN(ageTDEE) && ageTDEE > 0 && ageTDEE < 120) {
        ctx.session.tdeeData.age = ageTDEE;
        ctx.session.state = STATES.WAITING_FOR_WEIGHT_TDEE;
        ctx.reply(locales.tdee_calc_ask_weight);
      } else {
        ctx.reply(locales.tdee_calc_invalid_age);
      }
      break;

    case STATES.WAITING_FOR_WEIGHT_TDEE:
      const weightTDEE = parseFloat(ctx.message.text.replace(',', '.')); // We take into account the comma as a separator
      if (!isNaN(weightTDEE) && weightTDEE > 0 && weightTDEE < 300) {
        ctx.session.tdeeData.weight = weightTDEE;
        ctx.session.state = STATES.WAITING_FOR_HEIGHT_TDEE;
        ctx.reply(locales.tdee_calc_ask_height);
      } else {
        ctx.reply(locales.tdee_calc_invalid_weight);
      }
      break;

    case STATES.WAITING_FOR_HEIGHT_TDEE:
      const heightTDEE = parseInt(ctx.message.text);
      if (!isNaN(heightTDEE) && heightTDEE > 0 && heightTDEE < 250) {
        ctx.session.tdeeData.height = heightTDEE;
        ctx.session.state = STATES.WAITING_FOR_ACTIVITY_TDEE;
        // activity level using buttons
        const activityKeyboard = Object.keys(activityFactors).map(key => {
          let text = '';
          switch(key) {
            case 'sedentary': text = locales.activity_level_sedentary; break;
            case 'light': text = locales.activity_level_light; break;
            case 'moderate': text = locales.activity_level_moderate; break;
            case 'high': text = locales.activity_level_high; break;
            case 'very_high': text = locales.activity_level_very_high; break;
          }
          return [{ text: text, callback_data: `activity_${key}` }];
        });
        ctx.reply(locales.tdee_calc_ask_activity, {
          reply_markup: {
            inline_keyboard: activityKeyboard
          }
        });
      } else {
        ctx.reply(locales.tdee_calc_invalid_height);
      }
      break;

    case STATES.IDLE:
      if (!ctx.message.text.startsWith('/')) {
        ctx.reply(locales.unknown_command);
      }
      break;
    default:
      ctx.reply(locales.internal_error);
      ctx.session.state = STATES.IDLE;
      break;
  }
});

// --- handler for the "start_over" button ---
// the handler will be triggered when the user clicks "Сделать новый расчет" or "Вернуться в главное меню"
bot.action('start_over', (ctx) => {
  ctx.session.state = STATES.IDLE; // Resetting the state
  ctx.reply('Выберите, что вы хотите рассчитать:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Калькулятор Пульсовых Зон', callback_data: 'calc_pulse_zones' }],
        [{ text: 'Расчет Калорий и Макронутриентов', callback_data: 'calc_macros_tdee' }]
      ]
    }
  });
});


// --- Handler for button "Back to main menu" ---
bot.action('main_menu', (ctx) => {
  const userName = ctx.from.first_name || '';
  const locales = ctx.locales;

  ctx.session.state = STATES.IDLE;
  ctx.reply(`${locales.greeting(userName)} ${locales.select_function}`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: locales.menu_button_pulse_calculator, callback_data: 'calc_pulse_zones' }],
        [{ text: locales.menu_button_tdee_calculator, callback_data: 'calc_macros_tdee' }],
        [{ text: '🌐 Выбрать язык / Select Language', callback_data: 'select_language' }]
      ]
    }
  });
  ctx.answerCbQuery();
});

// --- Activity Level Selection Handlers for TDEE ---
bot.action(/activity_(.+)/, (ctx) => { // Regular expression for any activity key
  const locales = ctx.locales;
  const activityLevel = ctx.match[1];
  if (activityFactors[activityLevel]) { // Check that the activity level is valid
    ctx.session.tdeeData.activityLevel = activityLevel;
    const userData = ctx.session.tdeeData;

    // Generate a report
    const report = generateTDEEReport(userData, locales);

    // We send a report and propose further actions
    ctx.reply(report, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: locales.tdee_calc_recalc_button, callback_data: 'recalc_macros_tdee' }],
          [{ text: locales.main_menu_button, callback_data: 'main_menu' }]
        ]
      }
    });
    ctx.session.state = STATES.IDLE; // Resetting the state
    delete ctx.session.tdeeData; // Clearing TDEE data after calculation
  } else {
    ctx.reply(locales.tdee_calc_invalid_activity);
  }
  ctx.answerCbQuery();
});


// Launching the bot
//bot.launch();

console.log('Бот запущен!');
console.log('Попытка подключения к Redis по адресу:', process.env.REDIS_HOST || 'localhost', ':', process.env.REDIS_PORT || 6379);

// Turn on graceful stop
//process.once('SIGINT', () => bot.stop('SIGINT'));
//process.once('SIGTERM', () => bot.stop('SIGTERM'));

(async () => {
  try {
    await bot.launch();
    console.log('Бот запущен!');
    console.log('Попытка подключения к Redis по адресу:', process.env.REDIS_HOST || 'localhost', ':', process.env.REDIS_PORT || 6379);

    // Обработчики завершения работы
    process.once('SIGINT', async () => {
      console.log('SIGINT received. Stopping bot...');
      await bot.stop('SIGINT');
      await redisClient.quit(); // Закрываем соединение с redisClient
      console.log('Bot and Redis stopped.');
      process.exit(0);
    });
    process.once('SIGTERM', async () => {
      console.log('SIGTERM received. Stopping bot...');
      await bot.stop('SIGTERM');
      await redisClient.quit(); // Закрываем соединение с redisClient
      console.log('Bot and Redis stopped.');
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start bot:', error);
    if (error.code === 'ECONNREFUSED' || error.message.includes('connect ECONNREFUSED')) {
      console.error('Check if Redis server is running and accessible at', process.env.REDIS_HOST || 'localhost', ':', process.env.REDIS_PORT || 6379);
      console.error('On macOS/Windows with Docker, try REDIS_HOST="host.docker.internal" in your .env or docker run command.');
    }
    process.exit(1);
  }
})();
