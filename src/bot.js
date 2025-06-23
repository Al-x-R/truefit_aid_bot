require('dotenv').config();
const { Telegraf } = require('telegraf')
const { message } = require('telegraf/filters')

const bot = new Telegraf(process.env.BOT_TOKEN)
//bot.start((ctx) => ctx.reply('Welcome'))

bot.start((ctx) => {
  ctx.reply('Привет! Я TrueFit_AID_Bot – ваш помощник в мире фитнеса. Выберите, что вы хотите рассчитать:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Калькулятор Пульсовых Зон', callback_data: 'calc_pulse_zones' }],
        [{ text: 'Расчет Калорий и Макронутриентов', callback_data: 'calc_macros_tdee' }]
      ]
    }
  });
});

// Обработчик кнопки "Калькулятор Пульсовых Зон"
bot.action('calc_pulse_zones', (ctx) => {
  ctx.editMessageText('Отлично! Для расчета пульсовых зон мне нужен ваш возраст. Введите его, пожалуйста, числом:');
  // Здесь будет вызов функции из модуля pulseCalculator
});

// Обработчик кнопки "Расчет Калорий и Макронутриентов"
bot.action('calc_macros_tdee', (ctx) => {
  ctx.editMessageText('Хорошо, для расчета калорий и макросов мне потребуются некоторые данные: пол, возраст, вес, рост и уровень активности. Начнем!');
  // Здесь будет вызов функции из модуля tdeeCalculator
});

bot.help((ctx) => ctx.reply('Send me a sticker'))
bot.on(message('sticker'), (ctx) => ctx.reply('👍'))
bot.hears('hi', (ctx) => ctx.reply('Hey there'))
bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
