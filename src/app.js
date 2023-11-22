const express    = require('express');
const bodyParser = require('body-parser');
const sequelize  = require('./database');
const UrlMapping = require('./models/urlMapping');
const morgan     = require('morgan');
const app        = express();
const PORT       = process.env.PORT || 3000;
const winston        = require('winston');
const expressWinston = require('express-winston');

app.use(morgan('combined'));
app.use(bodyParser.json());

// Set up Winston for logging
winston.configure({
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'logs/app.log' }),
    ],
  });
  
  // Set up ExpressWinston for logging
  app.use(
    expressWinston.logger({
      transports: [new winston.transports.Console()],
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      meta: true,
      expressFormat: true,
    })
  );

// Endpoint for URL Shortening
app.post('/api/shorten', async (req, res) => {
  const { url, customAlias, expiresAt } = req.body;

  // Handle custom alias (optional)
  let shortCode = customAlias || generateShortCode();

  // Check if the custom alias is already taken
  if (customAlias) {
    const existingRecord = await UrlMapping.findOne({ where: { shortCode: customAlias } });
    if (existingRecord) {
      return res.status(400).json({ error: 'Custom alias is already taken.' });
    }
  }

  try {
    // If custom alias is not provided or is taken, generate a new one
    while (true) {
      const existingRecord = await UrlMapping.findOne({ where: { shortCode } });
      if (!existingRecord) {
        break;
      }
      shortCode = generateShortCode();
    }

    const record = await UrlMapping.create({
      originalUrl: url,
      shortCode,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    const shortenedUrl = `http://localhost:${PORT}/${record.shortCode}`;
    res.json({ shortenedUrl });

    // Log URL shortening
    winston.info(`Shortened URL: ${url} -> ${shortenedUrl}
    timestamp :-> ${new Date(Date.now())};
    `);
  } catch (error) {
    console.error(error);
    winston.error(error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Redirect Functionality
app.get('/:shortCode', async (req, res) => {
  const { shortCode } = req.params;

  try {
    const record = await UrlMapping.findOne({ where: { shortCode } });

    if (record) {
        if (record.expiresAt && new Date() > new Date(record.expiresAt)) {
          return res.status(410).json({ error: 'URL has expired' });
        }
  
        res.redirect(record.originalUrl);
  
        // Log URL redirection
        winston.info(`Redirected to: ${record.originalUrl}`);
      } else {
        res.status(404).json({ error: 'URL not found' });
      }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start server
sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});

// Helper function to generate a random short code
function generateShortCode() {
  // Implement your logic to generate a short code
  // This is a simple example, you may need a more robust solution
  return Math.random().toString(36).substr(2, 6);
}

module.exports = app;