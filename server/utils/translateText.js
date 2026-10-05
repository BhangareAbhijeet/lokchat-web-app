  const { spawn } = require("child_process");
const path = require("path");

async function translateText(text, source, target) {
  return new Promise((resolve, reject) => {
    const python = spawn("python3", [
      path.join(__dirname, "..", "services", "translation_service.py"),
    ]);

    let result = "";
    let error = "";

    python.stdout.on("data", (data) => {
      result += data.toString();
    });

    python.stderr.on("data", (data) => {
      error += data.toString();
    });

    python.on("close", (code) => {
      if (code !== 0 || error) return reject(new Error(error));
      try {
        const parsed = JSON.parse(result);
        if (parsed.error) return reject(new Error(parsed.error));
        resolve(parsed.translated);
      } catch (e) {
        reject(e);
      }
    });

    python.stdin.write(JSON.stringify({ text, source, target }));
    python.stdin.end();
  });
}

module.exports = translateText;
