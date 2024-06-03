require('dotenv').config();
const { Builder, By, until } = require('selenium-webdriver');
const { MongoClient } = require('mongodb');

const twitterLoginUrl = 'https://twitter.com/login';
const twitterHomeUrl = 'https://twitter.com/home';
const mongoUrl = process.env.MONGO_URL;

async function scrapeTwitter() {
  let driver = await new Builder().forBrowser('chrome').build();
  try {
    // Login to Twitter
    await driver.get(twitterLoginUrl);
    
    await driver.wait(until.elementLocated(By.name('text')), 10000).sendKeys(process.env.TWITTER_USERNAME);
    await driver.findElement(By.css('div[role="button"][data-testid="ocfEnterTextNextButton"]')).click();

    await driver.wait(until.elementLocated(By.name('password')), 10000).sendKeys(process.env.TWITTER_PASSWORD);
    await driver.findElement(By.css('div[role="button"][data-testid="ocfEnterPasswordNextButton"]')).click();

    // Wait until home page is loaded
    await driver.wait(until.urlIs(twitterHomeUrl), 10000);

    // Fetch top 5 trending topics - Update the selector based on the current structure
    const trendsSection = await driver.findElement(By.css('section[aria-labelledby="accessible-list-0"]')); // This may need updating
    const trends = await trendsSection.findElements(By.css('div[data-testid="primaryColumn"] div.tweet p')); // Updated selector

    const topTrends = [];
    for (let i = 0; i < 5 && i < trends.length; i++) {
      topTrends.push(await trends[i].getText());
    }

    // Store the results in MongoDB
    const client = new MongoClient(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    const collection = client.db('twitter_trends').collection('trends');
    
    const doc = {
      uniqueId: new Date().getTime(),
      trends: topTrends,
      date: new Date()
    };

    await collection.insertOne(doc);
    await client.close();

    return doc;
  } catch (error) {
    console.error('Error scraping Twitter:', error);
    throw error;
  } finally {
    await driver.quit();
  }
}

module.exports = scrapeTwitter;