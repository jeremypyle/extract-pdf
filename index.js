const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to the PDF Extraction Service!');
});

app.post('/extractPdfLink', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).send({ error: 'URL is required' });
  }

  let browser;
  try {
    browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto(url);

    await page.waitForSelector('#downloadPdf button');
    await page.click('#downloadPdf button');

    await page.waitForTimeout(3000);

    const pdfLink = await page.evaluate(() => {
      const anchor = document.querySelector('a[href$=".pdf"]');
      return anchor ? anchor.href : null;
    });

    await browser.close();

    if (pdfLink) {
      res.status(200).send({ pdfLink });
    } else {
      res.status(404).send({ error: 'PDF link not found' });
    }
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    res.status(500).send({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
