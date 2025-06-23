/**
 * Calculates Basal Metabolic Rate (BMR) using the Mifflin-St Jeor formula.
 * @param {string} gender - Gender ('male' or 'female').
 * @param {number} age - Age in years.
 * @param {number} weight - Weight in kg.
 * @param {number} height - Height in cm.
 * @returns {number} BMR value in calories.
 */
function calculateBMR(gender, age, weight, height) {
  // Mifflin-St Jeor Formula
  // For men: (10 * weight in kg) + (6.25 * height in cm) - (5 * age in years) + 5
  // For women: (10 * weight in kg) + (6.25 * height in cm) - (5 * age in years) - 161

  if (gender === 'male') {
    return (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else if (gender === 'female') {
    return (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }
  return 0; // На случай некорректного пола, хотя мы будем это валидировать на стороне бота
}

/**
 * Physical activity coefficients for TDEE calculation.
 * In the future, these can be moved to src/utils/constants.js
 */
const activityFactors = {
  sedentary: 1.2, // Sedentary (little or no exercise)
  light: 1.375,   // Light activity (1-3 days of light exercise per week)
  moderate: 1.55, // Moderate activity (3-5 days of moderate exercise per week)
  high: 1.725,    // High activity (6-7 days of intense exercise per week)
  very_high: 1.9  // Very high activity (daily very intense workouts, or a physically demanding job)
};

/**
 * Calculates Total Daily Energy Expenditure (TDEE).
 * @param {number} bmr - Basal Metabolic Rate.
 * @param {string} activityLevel - Activity level (key from activityFactors).
 * @returns {number} TDEE value in calories.
 */
function calculateTDEE(bmr, activityLevel) {
  const factor = activityFactors[activityLevel];
  if (factor) {
    return bmr * factor;
  }
  return bmr; // If activity level is unknown, return BMR
}

/**
 * Calculates macronutrient distribution.
 * Recommendations are given as a percentage of total TDEE, or in grams per kg of body weight.
 * Here, we use percentages.
 * @param {number} tdee - Total Daily Energy Expenditure.
 * @param {number} weight - User's current weight (for calculating protein and fat per kg).
 * @returns {object} An object with the recommended range of calories and grams for protein, fats, and carbohydrates.
 */
function calculateMacros(tdee, weight) {
  // Recommendations as percentages of TDEE
  const proteinPct = [0.25, 0.35]; // 25-35%
  const fatPct = [0.20, 0.30];     // 20-30%
  const carbPct = [0.40, 0.55];    // 40-55% (remainder)

  // Caloric content per 1g: Protein=4, Fat=9, Carbs=4

  const proteinCaloriesMin = tdee * proteinPct[0];
  const proteinCaloriesMax = tdee * proteinPct[1];
  const proteinGramsMin = Math.round(proteinCaloriesMin / 4);
  const proteinGramsMax = Math.round(proteinCaloriesMax / 4);

  const fatCaloriesMin = tdee * fatPct[0];
  const fatCaloriesMax = tdee * fatPct[1];
  const fatGramsMin = Math.round(fatCaloriesMin / 9);
  const fatGramsMax = Math.round(fatCaloriesMax / 9);

  // Carbohydrates - remainder
  const carbCaloriesMin = tdee * carbPct[0];
  const carbCaloriesMax = tdee * carbPct[1];
  const carbGramsMin = Math.round(carbCaloriesMin / 4);
  const carbGramsMax = Math.round(carbCaloriesMax / 4);

  return {
    protein: { minG: proteinGramsMin, maxG: proteinGramsMax, minCal: Math.round(proteinCaloriesMin), maxCal: Math.round(proteinCaloriesMax) },
    fat: { minG: fatGramsMin, maxG: fatGramsMax, minCal: Math.round(fatCaloriesMin), maxCal: Math.round(fatCaloriesMax) },
    carbs: { minG: carbGramsMin, maxG: carbGramsMax, minCal: Math.round(carbCaloriesMin), maxCal: Math.round(carbCaloriesMax) }
  };
}

/**
 * Generates a full report on TDEE and macronutrients.
 * @param {object} userData - Object with user data (gender, age, weight, height, activityLevel).
 * @returns {string} Formatted report text.
 */
function generateTDEEReport(userData) {
  const { gender, age, weight, height, activityLevel } = userData;

  if (!gender || !age || !weight || !height || !activityLevel) {
    return 'Недостаточно данных для расчета TDEE и макронутриентов. Пожалуйста, начните сначала.';
  }

  const bmr = calculateBMR(gender, age, weight, height);
  const tdee = calculateTDEE(bmr, activityLevel);
  const macros = calculateMacros(tdee, weight);

  let report = `*Ваш расчет калорий и макронутриентов:*\n\n`;
  report += `Расчет произведен по *формуле Миффлина-Сан-Жеора*.\n`;
  report += `Пол: ${gender === 'male' ? 'Мужской' : 'Женский'}\n`;
  report += `Возраст: ${age} лет\n`;
  report += `Вес: ${weight} кг\n`;
  report += `Рост: ${height} см\n`;
  report += `Уровень активности: ${Object.keys(activityFactors).find(key => activityFactors[key] === activityFactors[activityLevel])} \n`; // Просто для отображения, можно улучшить

  report += `\n*Ваш Базальный Метаболизм (BMR):* ${Math.round(bmr)} ккал/день\n`;
  report += `_Это количество калорий, необходимое для поддержания основных жизненных функций в состоянии покоя._\n`;
  report += `\n*Ваши Общие Суточные Энергозатраты (TDEE):* ${Math.round(tdee)} ккал/день\n`;
  report += `_Это количество калорий, которое вы сжигаете в день с учетом вашей физической активности._\n`;

  report += `\n*Рекомендации по макронутриентам:*\n`;
  report += `  *Белки:* ${macros.protein.minG}-${macros.protein.maxG} г (${macros.protein.minCal}-${macros.protein.maxCal} ккал)\n`;
  report += `  *Жиры:* ${macros.fat.minG}-${macros.fat.maxG} г (${macros.fat.minCal}-${macros.fat.maxCal} ккал)\n`;
  report += `  *Углеводы:* ${macros.carbs.minG}-${macros.carbs.maxG} г (${macros.carbs.minCal}-${macros.carbs.maxCal} ккал)\n`;

  report += `\n*Как использовать эти цифры?*\n`;
  report += `  - *Для поддержания веса:* Придерживайтесь TDEE ${Math.round(tdee)} ккал.\n`;
  report += `  - *Для похудения:* Создайте дефицит 200-500 ккал от TDEE (цель: ${Math.round(tdee - 350)} ккал).\n`; // Среднее значение
  report += `  - *Для набора мышечной массы:* Создайте профицит 200-500 ккал к TDEE (цель: ${Math.round(tdee + 350)} ккал).\n`;

  report += '\n_Помните, это базовые рекомендации. Индивидуальные потребности могут отличаться._';
  report += '\n\n*Хотите глубже разобраться в питании и макросах?* Читайте наш пост: [Макронутриенты: Гид](https://t.me/YOUR_CHANNEL_NAME/POST_NUMBER_MACROS)'; // Placeholder

  return report;
}

module.exports = {
  calculateBMR,
  calculateTDEE,
  calculateMacros,
  generateTDEEReport,
  activityFactors // We export these to use in the bot for buttons
};
