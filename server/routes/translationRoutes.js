const express = require("express");
const router = express.Router();
const i18n = require("i18n");

router.post("/", (req, res) => {
  const { text, language } = req.body;

  // Set target language
  i18n.setLocale(language || "en");

  // Here 'text' should be a key from your locales file
  const translated = i18n.__(text);

  res.json({
    translated: translated,
  });
});

module.exports = router;
