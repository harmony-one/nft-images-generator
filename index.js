require('./env');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { Storage } = require('@google-cloud/storage');
const { createCanvas, loadImage } = require('canvas');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const GOOGLE_CLOUD_STORAGE_BUCKET_NAME = process.env.GOOGLE_CLOUD_STORAGE_BUCKET_NAME;

const storage = new Storage({
  keyFilename: './keys.json',
});

// Define the route to handle the API request
app.get('/generate-nft-image', async (req, res) => {
  try {
    // Extract the text from the request body
    // const { text } = req.body;
    const text = req.query.text;

    if (!text) {
      throw new Error('Text is missing in the request body');
    }

    // Load the background image from the file system or URL
    const backgroundImagePath = './background.png';
    const backgroundImage = await loadImage(backgroundImagePath);

    // Create a new canvas and draw the background image on it
    const canvas = createCanvas(backgroundImage.width, backgroundImage.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(backgroundImage, 0, 0, backgroundImage.width, backgroundImage.height);

    // Set the text font and size
    const fontSize = text.length < 20 ? 50: 30;
    const font = `bold ${fontSize}px Arial`;

    // Draw the text on the canvas
    ctx.font = font;
    ctx.fillStyle = '#070e6d';
    ctx.textAlign = 'center';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + + fontSize / 2);

    // Create a PNG buffer from the canvas data
    const buffer = canvas.toBuffer('image/png');

    // Upload the buffer to the Google Storage bucket
    const bucket = storage.bucket(GOOGLE_CLOUD_STORAGE_BUCKET_NAME);
    const timestamp = new Date().getTime();
    const filename = `nft-${text}-${timestamp}.png`;
    const file = bucket.file(filename);
    await new Promise((resolve, reject) => {
      const stream = file.createWriteStream({ resumable: false });
      stream.on('error', reject);
      stream.on('finish', resolve);
      stream.end(buffer);
    });

    // Get the public link to the uploaded file
    const url = `https://storage.googleapis.com/${GOOGLE_CLOUD_STORAGE_BUCKET_NAME}/${filename}`;

    // Send the URL back as a response
    res.json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
