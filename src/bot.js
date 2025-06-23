require('dotenv').config();

const { Telegraf, session } = require('telegraf');
const { message } = require('telegraf/filters');
const LocalSession = require('telegraf-session-local');
const { calculatePulseZones } = require('./modules/pulseCalculator');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Initialize session (will store data in memory by default)
// For production, it is better to use storage like Redis/Mongo
const localSession = new LocalSession({ database: 'session_db.json' }); // Save sessions to a file

bot.use(localSession.middleware()); // Connecting middleware for sessions

// --- Constants for states ---
const STATES = {
  IDLE: 'IDLE', // Waiting for function selection
  WAITING_FOR_AGE_PULSE: 'WAITING_FOR_AGE_PULSE', // Age Expectation for Pulse
  // ... other states for TDEE
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

// Launching the bot
bot.launch();

console.log('Бот запущен!');

// Turn on graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
