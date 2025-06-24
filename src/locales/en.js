export default {
  // --- General messages ---
  greeting: (userName) => userName ? `Hi, ${userName}! I'm TrueFit_AID_Bot – your fitness assistant.` : 'Hi! I\'m TrueFit_AID_Bot – your fitness assistant.',
  description_start_long: 'I can help you with fitness and health calculations:',
  pulse_calc_short_desc: 'I will calculate your personal heart rate zones for effective workouts.',
  tdee_calc_short_desc: 'I will determine your calorie and macronutrient needs to achieve your goals (weight loss, muscle gain, maintenance).',


  select_function: 'Choose what you want to calculate:',
  menu_button_pulse_calculator: 'Heart Rate Zones Calculator',
  menu_button_tdee_calculator: 'Calorie & Macronutrient Calculator',
  unknown_command: 'I didn\'t understand your command. Please choose a function from the menu or use /start.',
  internal_error: 'An internal error occurred. Please start over with /start.',
  main_menu_button: 'Back to Main Menu',

  pulse_calc_start: 'Great! To calculate your heart rate zones, I need your age. Please enter it as a number:',
  pulse_calc_recalc_button: 'Recalculate Heart Rate Zones',
  pulse_calc_invalid_age: 'Please enter a valid age (a positive number between 1 and 119).',
  pulse_calc_report_title: (age) => `*Heart Rate Zone Calculation for age ${age}:*\n\n`,
  pulse_calc_maxhr_formula: (maxHR) => `Your approximate Maximum Heart Rate (MaxHR), calculated *using the Fox, Haskell, and Davis formula* (220 - age), is: *${maxHR} beats/min*.\n\n`,
  pulse_calc_zones_header: `---Your Heart Rate Zones---\n`,
  pulse_calc_zone_item: (name, percentage, minPulse, maxPulse, purpose) =>
    `\n*${name} (${percentage}% MaxHR)*\n` +
    `Pulse range: *${minPulse}-${maxPulse} beats/min*\n` +
    `Purpose: _${purpose}_\n`,
  pulse_calc_note: '_Note: This is a standard formula calculation. Your individual MaxHR may vary._',
  pulse_calc_article_link: '*Want to learn more about heart rate zone training?* Read our post: [Heart Rate Zone Training Guide](https://t.me/YOUR_CHANNEL_NAME/POST_NUMBER_EN)', // REPLACE LINK

  // NEW KEYS FOR HEART RATE ZONE PURPOSES:
  pulse_calc_zone_health_recovery_name: 'Health / Recovery Zone',
  pulse_calc_zone_health_recovery_purpose: 'Light exercise, warm-up, cool-down, improving circulation.',
  pulse_calc_zone_fat_burn_name: 'Fat Burn Zone',
  pulse_calc_zone_fat_burn_purpose: 'Effective fat burning, improving overall endurance.',
  pulse_calc_zone_aerobic_name: 'Aerobic Zone',
  pulse_calc_zone_aerobic_purpose: 'Cardiovascular system development, endurance improvement.',
  pulse_calc_zone_anaerobic_name: 'Anaerobic Zone',
  pulse_calc_zone_anaerobic_purpose: 'Developing speed and anaerobic endurance, interval training.',
  pulse_calc_zone_maximal_name: 'Red Zone (Maximal)',
  pulse_calc_zone_maximal_purpose: 'Maximal effort, very short intervals, only for well-trained individuals.',


  // --- TDEE Calculator ---
  tdee_calc_start: 'Okay! First, please choose your gender:',
  tdee_calc_gender_male_button: 'Male',
  tdee_calc_gender_female_button: 'Female',
  tdee_calc_gender_selected: (gender) => `You selected: *${gender === 'male' ? 'Male' : 'Female'}*.\nNow enter your age (in years):`,
  tdee_calc_ask_age: 'Now enter your age (in years):', // Duplicate for clarity if needed. gender_selected is more comprehensive.
  tdee_calc_ask_weight: 'Great! Now enter your weight (in kilograms, e.g., 75.5):',
  tdee_calc_ask_height: 'Accepted! Now enter your height (in centimeters, e.g., 170):',
  tdee_calc_ask_activity: 'Excellent! One last step: choose your physical activity level:',
  tdee_calc_recalc_button: 'Recalculate Calories/Macros',
  tdee_calc_invalid_age: 'Please enter a valid age (an integer between 1 and 119) for TDEE calculation.',
  tdee_calc_invalid_weight: 'Please enter a valid weight (a number, e.g., 75.5) for TDEE calculation.',
  tdee_calc_invalid_height: 'Please enter a valid height (an integer between 1 and 249) for TDEE calculation.',
  tdee_calc_invalid_activity: 'Please select a valid activity level from the options provided.',
  tdee_calc_insufficient_data: 'Insufficient data for TDEE and macronutrient calculation. Please start over.',

  // --- TDEE Activity Levels ---
  activity_level_sedentary: 'Sedentary (little or no exercise)',
  activity_level_light: 'Light (1-3 days/week)',
  activity_level_moderate: 'Moderate (3-5 days/week)',
  activity_level_high: 'High (6-7 days/week)',
  activity_level_very_high: 'Very High (daily intense exercise)',

  // --- TDEE Report ---
  tdee_report_title: '*Your Calorie and Macronutrient Calculation:*\n\n',
  tdee_report_formula_used: 'Calculation based on the *Mifflin-St Jeor formula*.\n',
  tdee_report_gender: (gender) => `Gender: ${gender === 'male' ? 'Male' : 'Female'}\n`,
  tdee_report_age: (age) => `Age: ${age} years\n`,
  tdee_report_weight: (weight) => `Weight: ${weight} kg\n`,
  tdee_report_height: (height) => `Height: ${height} cm\n`,
  tdee_report_activity_level: (activityLevelText) => `Activity Level: ${activityLevelText}\n`,
  tdee_report_bmr: (bmr) => `\n*Your Basal Metabolic Rate (BMR):* ${Math.round(bmr)} kcal/day\n`,
  tdee_report_bmr_note: '_This is the amount of calories needed to maintain basic life functions at rest._\n',
  tdee_report_tdee: (tdee) => `\n*Your Total Daily Energy Expenditure (TDEE):* ${Math.round(tdee)} kcal/day\n`,
  tdee_report_tdee_note: '_This is the amount of calories you burn per day, including your physical activity._\n',
  tdee_report_macros_header: `\n*Macronutrient Recommendations:*\n`,
  tdee_report_protein: (minG, maxG, minCal, maxCal) => `  *Protein:* ${minG}-${maxG} g (${minCal}-${maxCal} kcal)\n`,
  tdee_report_fat: (minG, maxG, minCal, maxCal) => `  *Fats:* ${minG}-${maxG} g (${minCal}-${maxCal} kcal)\n`,
  tdee_report_carbs: (minG, maxG, minCal, maxCal) => `  *Carbohydrates:* ${minG}-${maxG} g (${minCal}-${maxCal} kcal)\n`,
  tdee_report_how_to_use: `\n*How to use these numbers:*\n`,
  tdee_report_maintain_weight: (tdee) => `  - *For weight maintenance:* Aim for ${Math.round(tdee)} kcal TDEE.\n`,
  tdee_report_lose_weight: (tdee) => `  - *For weight loss:* Create a deficit of 200-500 kcal from TDEE (target: ${Math.round(tdee - 350)} kcal).\n`,
  tdee_report_gain_weight: (tdee) => `  - *For muscle gain:* Create a surplus of 200-500 kcal to TDEE (target: ${Math.round(tdee + 350)} kcal).\n`,
  tdee_report_note: '_Remember, these are basic recommendations. Individual needs may vary._',
  tdee_report_article_link: '*Want to dive deeper into nutrition and macros?* Read our post: [Macronutrients: A Guide](https://t.me/YOUR_CHANNEL_NAME/POST_NUMBER_MACROS_EN)' // REPLACE LINK
};
