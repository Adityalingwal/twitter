require('dotenv').config();
const { Builder, By, until } = require('selenium-webdriver');
const { MongoClient } = require('mongodb');

const twitterLoginUrl = 'https://twitter.com/login';
const twitterHomeUrl = 'https://twitter.com/home';
const explore= 'https://twitter.com/explore/tabs/trending';

const mongoUrl = process.env.MONGO_URL;

async function scrapeTwitter() {
  let driver = await new Builder().forBrowser('chrome').build();
  try {
   
    await driver.get(twitterLoginUrl);
    
    await driver.wait(until.elementLocated(By.xpath("//input[@name='text']")), 10000).sendKeys(process.env.TWITTER_USERNAME);
    await driver.findElement(By.xpath("//span[contains(text(),'Next')]")).click();

    await driver.wait(until.elementLocated(By.xpath("//input[@name='password']")), 10000).sendKeys(process.env.TWITTER_PASSWORD);
    await driver.findElement(By.xpath("//span[contains(text(),'Log in')]")).click();

    // Wait until home page is loaded
    await driver.wait(until.urlIs(twitterHomeUrl), 10000);

        // Locate the "Explore" link using the corrected XPath
        
        let exploreLink = await driver.findElement(By.xpath("//a[@href='/explore' and @aria-label='Search and explore' and @role='link' and @data-testid='AppTabBar_Explore_Link']"));

        // Click the "Explore" link
        await exploreLink.click();

        // Wait for the explore page to load
        await driver.wait(until.urlIs(explore), 10000);

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