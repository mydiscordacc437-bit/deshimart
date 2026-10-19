// src/utils/phoneSanitizer.js
/**
 * Bangladeshi Mobile Phone Sanitizer & Validator
 * 
 * Features:
 *   - Converts Bangla numerals (০, ১, ২, ৩, ৪, ৫, ৬, ৭, ৮, ৯) to English (0-9)
 *   - Strips non-digit characters (+, -, spaces, parenthesis)
 *   - Handles +880 / 880 prefixes cleanly
 *   - Auto-prepends leading 0 if user enters 10 digits starting with 1[3-9]
 *   - Validates strict BD 11-digit mobile format: 01[3-9]XXXXXXXX
 *   - Identifies telecom operator for fraud risk assessment
 */

const BANGLA_TO_ENG_DIGITS = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
};

export function sanitizeBDPhone(input) {
  if (!input) return '';

  // 1. Convert Bangla numerals to English
  let converted = String(input)
    .split('')
    .map(ch => BANGLA_TO_ENG_DIGITS[ch] || ch)
    .join('');

  // 2. Strip all non-digit characters
  let digits = converted.replace(/\D/g, '');

  // 3. Handle international prefixes: 8801... -> 01...
  if (digits.startsWith('880')) {
    digits = digits.slice(2);
  } else if (digits.startsWith('88') && digits.length >= 13) {
    digits = digits.slice(2);
  }

  // 4. If customer omitted leading zero (e.g. 1712345678, 10 digits)
  if (digits.length === 10 && /^[1-9]/.test(digits)) {
    digits = '0' + digits;
  }

  // Return up to 11 digits
  return digits.slice(0, 11);
}

export function isValidBDPhone(phone) {
  const sanitized = sanitizeBDPhone(phone);
  return /^01[3-9]\d{8}$/.test(sanitized);
}

export function getBDOperatorName(phone) {
  const sanitized = sanitizeBDPhone(phone);
  if (!sanitized || sanitized.length < 3) return 'অজানা (Unknown)';

  const prefix = sanitized.slice(0, 3);
  switch (prefix) {
    case '017':
    case '013':
      return 'Grameenphone / Skitto';
    case '018':
      return 'Robi';
    case '016':
      return 'Airtel';
    case '019':
    case '014':
      return 'Banglalink';
    case '015':
      return 'Teletalk';
    default:
      return 'অন্যান্য (Other)';
  }
}
