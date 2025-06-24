/**
 * Calculates heart rate zones based on age.
 * Uses the maximum heart rate formula: 220 - age.
 *
 * @param {number} age - The user's age.
 * @param {object} locales - Localization object.
 * @returns {string} Formatted text describing the heart rate zones.
 */
export const calculatePulseZones = (age, locales) => {
  if (typeof age !== 'number' || age <= 0) {
    return locales.pulse_calc_invalid_age;
  }

  const maxHR = 220 - age;


  const zones = [
    { name: locales.pulse_calc_zone_health_recovery_name || 'Зона Здоровья / Восстановления', range: [0.50, 0.60], purposeKey: 'pulse_calc_zone_health_recovery_purpose' },
    { name: locales.pulse_calc_zone_fat_burn_name || 'Зона Сжигания Жира', range: [0.60, 0.70], purposeKey: 'pulse_calc_zone_fat_burn_purpose' },
    { name: locales.pulse_calc_zone_aerobic_name || 'Аэробная Зона', range: [0.70, 0.80], purposeKey: 'pulse_calc_zone_aerobic_purpose' },
    { name: locales.pulse_calc_zone_anaerobic_name || 'Анаэробная Зона', range: [0.80, 0.90], purposeKey: 'pulse_calc_zone_anaerobic_purpose' },
    { name: locales.pulse_calc_zone_maximal_name || 'Красная Зона (Максимальная)', range: [0.90, 1.00], purposeKey: 'pulse_calc_zone_maximal_purpose' }
  ];

  let resultText = locales.pulse_calc_report_title(age);
  resultText += locales.pulse_calc_maxhr_formula(maxHR);
  resultText += locales.pulse_calc_zones_header;

  zones.forEach(zone => {
    const minPulse = Math.round(maxHR * zone.range[0]);
    const maxPulse = Math.round(maxHR * zone.range[1]);
    const percentage = `${Math.round(zone.range[0]*100)}-${Math.round(zone.range[1]*100)}`;
    resultText += locales.pulse_calc_zone_item(zone.name, percentage, minPulse, maxPulse, locales[zone.purposeKey]);
  });

  resultText += locales.pulse_calc_note;
  resultText += `\n\n${locales.pulse_calc_article_link}`;

  return resultText;
}

