require('dotenv').config();
const express = require('express');
const scrapeTwitter = require('./scrapeTwitter');
const { MongoClient } = require('mongodb');

const app = express();
const port = 3000;
const mongoUrl = process.env.MONGO_URL;

app.use(express.static('views'));

app.get('/run-scrape', async (req, res) => {
  try {
    const result = await scrapeTwitter();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/results', async (req, res) => {
  const client = new MongoClient(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  const collection = client.db('twitter_trends').collection('trends');
  const latestRecord = await collection.find().sort({ _id: -1 }).limit(1).toArray();
  await client.close();
  
  res.json(latestRecord[0]);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
