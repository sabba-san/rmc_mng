import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // Landing page
  console.log('Capturing Landing Page...');
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: '/home/abbas/.gemini/antigravity-ide/brain/190404f8-f2dd-45c6-85f8-0e2f0206c086/landing_page.png',
    fullPage: false
  });

  // Login page
  console.log('Capturing Login Page...');
  await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: '/home/abbas/.gemini/antigravity-ide/brain/190404f8-f2dd-45c6-85f8-0e2f0206c086/login_page.png',
    fullPage: false
  });

  console.log('Screenshots captured successfully.');
  await browser.close();
}

main().catch((err) => {
  console.error('Error taking screenshot:', err);
  process.exit(1);
});
