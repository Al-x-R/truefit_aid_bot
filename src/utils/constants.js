/**
 * Physical activity coefficients for TDEE calculation.
 */
export const activityFactors = {
  sedentary: 1.2, // Sedentary (little or no exercise)
  light: 1.375,   // Light activity (1-3 days of light exercise per week)
  moderate: 1.55, // Moderate activity (3-5 days of moderate exercise per week)
  high: 1.725,    // High activity (6-7 days of intense exercise per week)
  very_high: 1.9  // Very high activity (daily very intense workouts, or a physically demanding job)
};

export const STATES = {
  IDLE: 'IDLE',
  WAITING_FOR_AGE_PULSE: 'WAITING_FOR_AGE_PULSE',
  WAITING_FOR_GENDER_TDEE: 'WAITING_FOR_GENDER_TDEE',
  WAITING_FOR_AGE_TDEE: 'WAITING_FOR_AGE_TDEE',
  WAITING_FOR_WEIGHT_TDEE: 'WAITING_FOR_WEIGHT_TDEE',
  WAITING_FOR_HEIGHT_TDEE: 'WAITING_FOR_HEIGHT_TDEE',
  WAITING_FOR_ACTIVITY_TDEE: 'WAITING_FOR_ACTIVITY_TDEE',
  SELECTING_LANGUAGE: 'SELECTING_LANGUAGE'
};

