import puppeteer from "puppeteer-core";
import path from "path";
import fs from "fs";

const CHROMIUM_PATH = "/Users/yashsrivastava/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";
const OUTPUT_DIR = "/Users/yashsrivastava/.gemini/antigravity-ide/brain/3f2f4175-7862-4a82-866a-d0ab390068cd/visual_qa";

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function runVisualQA() {
  const browser = await puppeteer.launch({
    executablePath: CHROMIUM_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const configs = [
    { name: "desktop_light_monochrome", width: 1440, height: 900, theme: "light", accent: "neutral" },
    { name: "desktop_light_blue", width: 1440, height: 900, theme: "light", accent: "blue" },
    { name: "desktop_dark_monochrome", width: 1440, height: 900, theme: "dark", accent: "neutral" },
    { name: "desktop_dark_blue", width: 1440, height: 900, theme: "dark", accent: "blue" },
    { name: "desktop_amoled_monochrome", width: 1440, height: 900, theme: "amoled", accent: "neutral" },
    { name: "desktop_amoled_blue", width: 1440, height: 900, theme: "amoled", accent: "blue" },
    { name: "mobile_390_amoled", width: 390, height: 844, theme: "amoled", accent: "neutral" },
    { name: "mobile_390_light", width: 390, height: 844, theme: "light", accent: "neutral" },
  ];

  for (const config of configs) {
    const page = await browser.newPage();
    await page.setViewport({ width: config.width, height: config.height });

    await page.evaluateOnNewDocument((theme, accent) => {
      localStorage.setItem("aegis:theme:v1", theme);
      localStorage.setItem("aegis:accent:v1", accent);
      localStorage.setItem("aegis:startup:timestamp:v1", String(Date.now()));
      localStorage.setItem("aegis:onboarding:v1", JSON.stringify({ completed: true, skipped: true }));
      localStorage.setItem("aegis:pwa:dismissed:v1", "true");
    }, config.theme, config.accent);

    await page.goto("http://localhost:3000/overview", { waitUntil: "networkidle0" });
    await new Promise((resolve) => setTimeout(resolve, 800));

    const screenshotPath = path.join(OUTPUT_DIR, `${config.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`Captured: ${screenshotPath}`);
    await page.close();
  }

  await browser.close();
}

runVisualQA().catch((err) => {
  console.error("Visual QA error:", err);
  process.exit(1);
});
