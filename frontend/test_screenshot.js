const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 }); // iPhone 12 Pro dimensions
  try {
    await page.goto('http://localhost:3000/home', { waitUntil: 'networkidle2', timeout: 10000 });
  } catch (e) {
    console.log('Timeout on /home, trying anyway');
  }
  await page.screenshot({ path: 'public/test_screenshot.png' });
  await browser.close();
  console.log('Screenshot saved to public/test_screenshot.png');
})();
