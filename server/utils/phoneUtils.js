// utils/phoneUtils.js
const libphonenumber = require('google-libphonenumber'); // npm i google-libphonenumber
const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();

function normalizeToE164(rawNumber, defaultCountry = 'IN') {
  if (!rawNumber || typeof rawNumber !== 'string') return null;
  const cleaned = rawNumber.replace(/[\s()-\.]/g, '');
  try {
    // If number already includes + and country, parse as is
    const number = phoneUtil.parseAndKeepRawInput(cleaned, defaultCountry);
    if (!phoneUtil.isValidNumber(number)) return null;
    return phoneUtil.format(number, libphonenumber.PhoneNumberFormat.E164);
  } catch (e) {
    return null;
  }
}

module.exports = { normalizeToE164 };
