require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const PORT = process.env.PORT || 300;

app.use(cors());
app.use(bodyParser.json());


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB', err));

const urlSchema = new mongoose.Schema({
    originalUrl: {type: String, required: true},
    shortId: {type:String, required: true, unique: true},
    clicks : { type:Number , default: 0},
    expiresAt: { type: Date, required: true }
});

const URL = mongoose.model('URL',urlSchema);

app.post('/shorten', async (req, res) => {
    const { originalUrl } = req.body;
  
    if (!originalUrl) {
      return res.status(400).send('Original URL is required!');
    }
    const { nanoid } = await import('nanoid');
    const shortId = nanoid(8); 
    const shortUrl = `https://url-shortener-mcxyab9et-moyseds-projects.vercel.app/${shortId}`;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours()+24);
  try{
    const newUrl = new URL( { originalUrl, shortId,expiresAt});
    await newUrl.save();
    res.status(201).json({originalUrl, shortUrl,expiresAt});
  }catch(err){
    res.status(500).send('Error saving to database');
  }
  });

  app.get('/:shortId',async (req,res) =>{
    const { shortId } = req.params;
    try{
        const url = await URL.findOne({ shortId });
        if(url){
            const currentTime = new Date();

            if(currentTime > url.expiresAt){
                return res.status(410).send('This URL is expired');
            }
            url.clicks += 1;
            await url.save();

            res.redirect(url.originalUrl);
        }else{
            res.status(404).send('URL not found');
        }
    }catch(err){
        res.status(500).send('Error retrieving URL');
    }
  })

  app.get('/clicks/:shortId', async(req,res)=>{
    const { shortId } = req.params;

    try{
        const url = await URL.findOne({shortId});
        if(url){
            res.status(200).json({
                shortUrl: `https://url-shortener-mcxyab9et-moyseds-projects.vercel.app/${shortId}`, clicks: url.clicks
              });
        } else {
            res.status(404).send('URL not found');
        }
    }catch(err){
        res.status(500).send('Error retrieving click data');
    }
  })
  
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
