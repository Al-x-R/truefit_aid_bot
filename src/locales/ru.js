module.exports = {

  // --- Общие сообщения ---
  greeting: (userName) => userName ? `Привет, ${userName}! Я TrueFit_AID_Bot – ваш помощник в мире фитнеса.` : 'Привет! Я TrueFit_AID_Bot – ваш помощник в мире фитнеса.',
  description_start_long: 'Я могу помочь вам с расчетами для фитнеса и здоровья:',
  pulse_calc_short_desc: 'Рассчитаю ваши персональные пульсовые зоны для эффективных тренировок.',
  tdee_calc_short_desc: 'Определю вашу норму калорий и макронутриентов для достижения ваших целей (похудение, набор массы, поддержание).',

  select_function: 'Выберите, что вы хотите рассчитать:',
  menu_button_pulse_calculator: 'Калькулятор Пульсовых Зон',
  menu_button_tdee_calculator: 'Расчет Калорий и Макронутриентов',
  unknown_command: 'Я не понял вашу команду. Пожалуйста, выберите функцию из меню или используйте /start.',
  internal_error: 'Произошла внутренняя ошибка. Пожалуйста, начните заново с /start.',
  main_menu_button: 'Вернуться в главное меню',

  // --- Пульсовые Зоны ---
  pulse_calc_start: 'Отлично! Для расчета пульсовых зон мне нужен ваш возраст. Введите его, пожалуйста, числом:',
  pulse_calc_recalc_button: 'Сделать новый расчет пульсовых зон',
  pulse_calc_invalid_age: 'Пожалуйста, введите корректный возраст (целое число от 1 до 119).',
  pulse_calc_report_title: (age) => `*Расчет пульсовых зон для возраста ${age} лет:*\n\n`,
  pulse_calc_maxhr_formula: (maxHR) => `Ваш примерный максимальный пульс (MaxHR), рассчитанный *по формуле Фокса, Хаскелла и Девиса* (220 - возраст), составляет: *${maxHR} ударов/мин*.\n\n`,
  pulse_calc_zones_header: `---Ваши пульсовые зоны---\n`,
  pulse_calc_zone_item: (name, percentage, minPulse, maxPulse, purpose) =>
    `\n*${name} (${percentage}% MaxHR)*\n` +
    `Диапазон пульса: *${minPulse}-${maxPulse} ударов/мин*\n` +
    `Назначение: _${purpose}_\n`,
  pulse_calc_note: '_Примечание: Это расчет по стандартной формуле. Ваш индивидуальный MaxHR может отличаться._',
  pulse_calc_article_link: '*Хотите узнать больше о тренировках по пульсовым зонам?* Читайте наш пост: [Тренировки по пульсовым зонам](https://t.me/YOUR_CHANNEL_NAME/POST_NUMBER)', // ЗАМЕНИТЕ ССЫЛКУ

  pulse_calc_zone_health_recovery_name: 'Зона Здоровья / Восстановления',
  pulse_calc_zone_health_recovery_purpose: 'Легкие нагрузки, разминка, заминка, улучшение кровообращения.',
  pulse_calc_zone_fat_burn_name: 'Зона Сжигания Жира',
  pulse_calc_zone_fat_burn_purpose: 'Эффективное жиросжигание, повышение общей выносливости.',
  pulse_calc_zone_aerobic_name: 'Аэробная Зона',
  pulse_calc_zone_aerobic_purpose: 'Развитие кардиоваскулярной системы, улучшение выносливости.',
  pulse_calc_zone_anaerobic_name: 'Анаэробная Зона',
  pulse_calc_zone_anaerobic_purpose: 'Развитие скорости и анаэробной выносливости, интервальные тренировки.',
  pulse_calc_zone_maximal_name: 'Красная Зона (Максимальная)',
  pulse_calc_zone_maximal_purpose: 'Максимальные усилия, очень короткие интервалы, только для подготовленных.',


  // --- TDEE Калькулятор ---
  tdee_calc_start: 'Хорошо! Для начала, выберите ваш пол:',
  tdee_calc_gender_male_button: 'Мужской',
  tdee_calc_gender_female_button: 'Женский',
  tdee_calc_gender_selected: (gender) => `Вы выбрали: *${gender === 'male' ? 'Мужской' : 'Женский'}*.\nТеперь введите ваш возраст (в годах):`,
  tdee_calc_ask_age: 'Теперь введите ваш возраст (в годах):', // Дублируется, но для ясности. gender_selected более полный.
  tdee_calc_ask_weight: 'Отлично! Теперь введите ваш вес (в килограммах, например, 75.5):',
  tdee_calc_ask_height: 'Принято! Теперь введите ваш рост (в сантиметрах, например, 170):',
  tdee_calc_ask_activity: 'Отлично! И последний шаг: выберите ваш уровень физической активности:',
  tdee_calc_recalc_button: 'Сделать новый расчет Калорий/Макросов',
  tdee_calc_invalid_age: 'Пожалуйста, введите корректный возраст (целое число от 1 до 119) для расчета TDEE.',
  tdee_calc_invalid_weight: 'Пожалуйста, введите корректный вес (число, например, 75.5) для расчета TDEE.',
  tdee_calc_invalid_height: 'Пожалуйста, введите корректный рост (целое число от 1 до 249) для расчета TDEE.',
  tdee_calc_invalid_activity: 'Пожалуйста, выберите корректный уровень активности из предложенных вариантов.',
  tdee_calc_insufficient_data: 'Недостаточно данных для расчета TDEE и макронутриентов. Пожалуйста, начните сначала.',

  // --- Уровни активности TDEE ---
  activity_level_sedentary: 'Малоподвижный (очень мало или нет упражнений)',
  activity_level_light: 'Легкая (1-3 дня/нед.)',
  activity_level_moderate: 'Умеренная (3-5 дней/нед.)',
  activity_level_high: 'Высокая (6-7 дней/нед.)',
  activity_level_very_high: 'Очень высокая (ежедневно интенсивная)',

  // --- TDEE Отчет ---
  tdee_report_title: '*Ваш расчет калорий и макронутриентов:*\n\n',
  tdee_report_formula_used: 'Расчет произведен по *формуле Миффлина-Сан-Жеора*.\n',
  tdee_report_gender: (gender) => `Пол: ${gender === 'male' ? 'Мужской' : 'Женский'}\n`,
  tdee_report_age: (age) => `Возраст: ${age} лет\n`,
  tdee_report_weight: (weight) => `Вес: ${weight} кг\n`,
  tdee_report_height: (height) => `Рост: ${height} см\n`,
  tdee_report_activity_level: (activityLevelText) => `Уровень активности: ${activityLevelText}\n`,
  tdee_report_bmr: (bmr) => `\n*Ваш Базальный Метаболизм (BMR):* ${Math.round(bmr)} ккал/день\n`,
  tdee_report_bmr_note: '_Это количество калорий, необходимое для поддержания основных жизненных функций в состоянии покоя._\n',
  tdee_report_tdee: (tdee) => `\n*Ваши Общие Суточные Энергозатраты (TDEE):* ${Math.round(tdee)} ккал/день\n`,
  tdee_report_tdee_note: '_Это количество калорий, которое вы сжигаете в день с учетом вашей физической активности._\n',
  tdee_report_macros_header: `\n*Рекомендации по макронутриентам:*\n`,
  tdee_report_protein: (minG, maxG, minCal, maxCal) => `  *Белки:* ${minG}-${maxG} г (${minCal}-${maxCal} ккал)\n`,
  tdee_report_fat: (minG, maxG, minCal, maxCal) => `  *Жиры:* ${minG}-${maxG} г (${minCal}-${maxCal} ккал)\n`,
  tdee_report_carbs: (minG, maxG, minCal, maxCal) => `  *Углеводы:* ${minG}-${maxG} г (${minCal}-${maxCal} ккал)\n`,
  tdee_report_how_to_use: `\n*Как использовать эти цифры?*\n`,
  tdee_report_maintain_weight: (tdee) => `  - *Для поддержания веса:* Придерживайтесь TDEE ${Math.round(tdee)} ккал.\n`,
  tdee_report_lose_weight: (tdee) => `  - *Для похудения:* Создайте дефицит 200-500 ккал от TDEE (цель: ${Math.round(tdee - 350)} ккал).\n`,
  tdee_report_gain_weight: (tdee) => `  - *Для набора мышечной массы:* Создайте профицит 200-500 ккал к TDEE (цель: ${Math.round(tdee + 350)} ккал).\n`,
  tdee_report_note: '_Помните, это базовые рекомендации. Индивидуальные потребности могут отличаться._',
  tdee_report_article_link: '*Хотите глубже разобраться в питании и макросах?* Читайте наш пост: [Макронутриенты: Гид](https://t.me/YOUR_CHANNEL_NAME/POST_NUMBER_MACROS)' // ЗАМЕНИТЕ ССЫЛКУ
};
