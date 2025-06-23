require('dotenv').config();

const { Telegraf, session } = require('telegraf');
const { message } = require('telegraf/filters');
const LocalSession = require('telegraf-session-local');
const { calculatePulseZones } = require('./modules/pulseCalculator');
const { generateTDEEReport, activityFactors } = require('./modules/tdeeCalculator');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Initialize session (will store data in memory by default)
// For production, it is better to use storage like Redis/Mongo
const localSession = new LocalSession({ database: 'session_db.json' }); // Save sessions to a file

bot.use(localSession.middleware()); // Connecting middleware for sessions

// --- Constants for states ---
const STATES = {
  IDLE: 'IDLE', // Waiting for function selection
  WAITING_FOR_AGE_PULSE: 'WAITING_FOR_AGE_PULSE', // Age Expectation for Pulse
  // states for TDEE
  WAITING_FOR_GENDER_TDEE: 'WAITING_FOR_GENDER_TDEE',
  WAITING_FOR_AGE_TDEE: 'WAITING_FOR_AGE_TDEE',
  WAITING_FOR_WEIGHT_TDEE: 'WAITING_FOR_WEIGHT_TDEE',
  WAITING_FOR_HEIGHT_TDEE: 'WAITING_FOR_HEIGHT_TDEE',
  WAITING_FOR_ACTIVITY_TDEE: 'WAITING_FOR_ACTIVITY_TDEE',
};

// /start command handler
bot.start((ctx) => {
  ctx.session.state = STATES.IDLE;
  const userName = ctx.from.first_name || '';
  const greetings = userName ? `Привет, ${userName}` : 'Привет';
  ctx.reply(`${greetings}! Выберите, что вы хотите рассчитать:`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Калькулятор Пульсовых Зон', callback_data: 'calc_pulse_zones' }],
        [{ text: 'Расчет Калорий и Макронутриентов', callback_data: 'calc_macros_tdee' }]
      ]
    }
  });
});

// Handler for the "Heart Rate Calculator" button
bot.action('calc_pulse_zones', (ctx) => {
  ctx.session.state = STATES.WAITING_FOR_AGE_PULSE; // Setting up the age waiting state
  ctx.reply('Отлично! Для расчета пульсовых зон мне нужен ваш возраст. Введите его, пожалуйста, числом:');
});

// Handler for the "Calculate Calories and Macronutrients" button
bot.action('calc_macros_tdee', (ctx) => {
  ctx.session.state = STATES.WAITING_FOR_GENDER_TDEE; // Set the first state for TDEE
  ctx.reply('Хорошо! Для начала, выберите ваш пол:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Мужской', callback_data: 'gender_male' }],
        [{ text: 'Женский', callback_data: 'gender_female' }]
      ]
    }
  });
  ctx.answerCbQuery();
});

// --- New handler for the "Make a new Calorie/Macro calculation" button" ---
bot.action('recalc_macros_tdee', (ctx) => {
  ctx.session.state = STATES.WAITING_FOR_GENDER_TDEE;
  ctx.reply('Хорошо, давайте сделаем новый расчет! Выберите ваш пол:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Мужской', callback_data: 'gender_male' }],
        [{ text: 'Женский', callback_data: 'gender_female' }]
      ]
    }
  });
  ctx.answerCbQuery();
});

// --- Gender Selection Handlers for TDEE ---
bot.action(/gender_(male|female)/, (ctx) => { // Regular expression for male or female
  console.log('ctx', ctx);
  const gender = ctx.match[1]; // Get 'male' or 'female' from callback_data
  ctx.session.tdeeData = ctx.session.tdeeData || {}; // Initialize an object to store TDEE data
  ctx.session.tdeeData.gender = gender;
  ctx.session.state = STATES.WAITING_FOR_AGE_TDEE; // Let's move on to the next state

  ctx.editMessageText(`Вы выбрали: *${gender === 'male' ? 'Мужской' : 'Женский'}*.\nТеперь введите ваш возраст (в годах):`, {
    parse_mode: 'Markdown'
  });
  ctx.answerCbQuery();
});

// --- Processing text messages (core logic for receiving data) ---
bot.on(message('text'), (ctx) => {
  const currentState = ctx.session.state || STATES.IDLE;
  switch (currentState) {
    case STATES.WAITING_FOR_AGE_PULSE:
      const age = parseInt(ctx.message.text);
      if (!isNaN(age) && age > 0 && age < 120) {
        const result = calculatePulseZones(age);
        ctx.reply(result, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Сделать новый расчет пульсовых зон', callback_data: 'calc_pulse_zones' }],
              [{ text: 'Вернуться в главное меню', callback_data: 'main_menu' }]
            ]
          }
        });
        ctx.session.state = STATES.IDLE;
      } else {
        ctx.reply('Пожалуйста, введите корректный возраст (целое число от 1 до 119).');
      }
      break;

    case STATES.WAITING_FOR_AGE_TDEE:
      const ageTDEE = parseInt(ctx.message.text);
      if (!isNaN(ageTDEE) && ageTDEE > 0 && ageTDEE < 120) {
        ctx.session.tdeeData.age = ageTDEE;
        ctx.session.state = STATES.WAITING_FOR_WEIGHT_TDEE;
        ctx.reply('Отлично! Теперь введите ваш вес (в килограммах, например, 75.5):');
      } else {
        ctx.reply('Пожалуйста, введите корректный возраст (целое число от 1 до 119) для расчета TDEE.');
      }
      break;

    case STATES.WAITING_FOR_WEIGHT_TDEE:
      const weightTDEE = parseFloat(ctx.message.text.replace(',', '.')); // We take into account the comma as a separator
      if (!isNaN(weightTDEE) && weightTDEE > 0 && weightTDEE < 300) {
        ctx.session.tdeeData.weight = weightTDEE;
        ctx.session.state = STATES.WAITING_FOR_HEIGHT_TDEE;
        ctx.reply('Принято! Теперь введите ваш рост (в сантиметрах, например, 170):');
      } else {
        ctx.reply('Пожалуйста, введите корректный вес (число, например, 75.5) для расчета TDEE.');
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
            case 'sedentary': text = 'Малоподвижный (очень мало или нет упражнений)'; break;
            case 'light': text = 'Легкая (1-3 дня/нед.)'; break;
            case 'moderate': text = 'Умеренная (3-5 дней/нед.)'; break;
            case 'high': text = 'Высокая (6-7 дней/нед.)'; break;
            case 'very_high': text = 'Очень высокая (ежедневно интенсивная)'; break;
          }
          return [{ text: text, callback_data: `activity_${key}` }];
        });
        ctx.reply('Отлично! И последний шаг: выберите ваш уровень физической активности:', {
          reply_markup: {
            inline_keyboard: activityKeyboard
          }
        });
      } else {
        ctx.reply('Пожалуйста, введите корректный рост (целое число от 1 до 249) для расчета TDEE.');
      }
      break;

    case STATES.IDLE:
    default:
      ctx.reply('Я не понял вашу команду. Пожалуйста, выберите функцию из меню или используйте /start.');
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


// --- Handler for button "Вернуться в главное меню" ---
bot.action('main_menu', (ctx) => {
  ctx.session.state = STATES.IDLE;
  ctx.reply('Выберите, что вы хотите рассчитать:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Калькулятор Пульсовых Зон', callback_data: 'calc_pulse_zones' }],
        [{ text: 'Расчет Калорий и Макронутриентов', callback_data: 'calc_macros_tdee' }]
      ]
    }
  });
});

// --- Activity Level Selection Handlers for TDEE ---
bot.action(/activity_(.+)/, (ctx) => { // Regular expression for any activity key
  const activityLevel = ctx.match[1];
  if (activityFactors[activityLevel]) { // Check that the activity level is valid
    ctx.session.tdeeData.activityLevel = activityLevel;
    const userData = ctx.session.tdeeData;

    // Generate a report
    const report = generateTDEEReport(userData);

    // We send a report and propose further actions
    ctx.reply(report, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Сделать новый расчет Калорий/Макросов', callback_data: 'recalc_macros_tdee' }],
          [{ text: 'Вернуться в главное меню', callback_data: 'main_menu' }]
        ]
      }
    });
    ctx.session.state = STATES.IDLE; // Resetting the state
    delete ctx.session.tdeeData; // Clearing TDEE data after calculation
  } else {
    ctx.reply('Пожалуйста, выберите корректный уровень активности из предложенных вариантов.');
  }
  ctx.answerCbQuery();
});


// Launching the bot
bot.launch();

console.log('Бот запущен!');

// Turn on graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
