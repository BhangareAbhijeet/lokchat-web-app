const i18n = require("../i18n"); // import your i18n setup

module.exports = (err, req, res, next) => {
  console.error(err.stack);

  // Detect language from request, default to English
  const lang = req.body?.language || req.query?.language || "en";
  i18n.setLocale(lang);

  res.status(err.statusCode || 500).json({
    status: i18n.__("failed"),                 // translated status
    message: i18n.__(err.message || "server_error") // translated message
  });
};
