require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require("path");
const app = express();
//This is to verify the url
const dns = require('dns');
const urlParser = require('url');

// Basic Configuration
const port = process.env.PORT || 3000;

//Create link to mongoDB for conecting
const {MongoClient} = require('mongodb');
//Connect to mongoDB
const client = new MongoClient(process.env.MONGOO);
//Especified what database
const db = client.db('urlshortner');
//Creates colection of urls
const urls = db.collection('urls');

app.use(cors());
//This makes sure you can access req.body
app.use(express.json());
app.use(express.urlencoded({extended : true}));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl', function(req, res) {
  const url = req.body.url;
  const dnslookup = dns.lookup(urlParser.parse(url).hostname, async (err, address) => {
    if (!address){
      res.json({error : 'invalid url'})
    }else{
      //Gonna use numbers for shortner so count every Doc
      const urlCount = await urls.countDocuments({});
      const urlDoc = {
        url : url,
        short_url : urlCount
      }
      //Save to database
      const results = await urls.insertOne(urlDoc);
      res.json({ original_url: url, short_url: urlCount});
    }
  })
});
//It'll visit the short url
app.get('/api/shorturl/:short_url', async (req, res) => {
  const shorturl = req.params.short_url;
  //Use +shorturl to turn into a number
  const urlDoc = await urls.findOne({ short_url: +shorturl});
  res.redirect(urlDoc.url);
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
