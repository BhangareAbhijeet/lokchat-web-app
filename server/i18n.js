const i18n = require("i18n");
const path = require("path");

// i18n configuration
i18n.configure({
  locales: ["en", "hi", "mr"],          // English, Hindi, Marathi
  directory: path.join(__dirname, "locales"), // folder containing en.json, hi.json, mr.json
  defaultLocale: "en",
  objectNotation: true,
  autoReload: true,
  updateFiles: false,                   // don't auto-update JSON files
});

module.exports = i18n;
