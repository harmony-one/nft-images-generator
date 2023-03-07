NFT Image Generator API
=======================

This project is an API that generates an NFT image by overlaying text on a background image and uploads it to a designated Google Storage bucket location. After uploading the image, the API returns the public link to the image.

Setup
-----

To use this API, you'll need the following:

*   A Google Cloud Storage bucket
*   A `keys.json` file with your Google Cloud Storage credentials
*   Node.js installed on your machine

To set up the project, follow these steps:

1.  Clone the repository
2.  Install dependencies with `npm install`
3.  Create a `.env` file with the following environment variables:

``
GOOGLE_CLOUD_STORAGE_BUCKET_NAME=your-bucket-name
``

4.  Update the `backgroundImagePath` variable in the `generate-nft-image` route to point to your background image
5.  Update the `font` and `fontSize` variables in the `generate-nft-image` route to customize the text font and size

Usage
-----

To use the API, start the server with `npm start`. The API will listen on port 3000 by default, or the `PORT` environment variable if set.

The API has a single route:

``
GET /generate-nft-image?text=your-text
``

Replace `your-text` with the text you want to overlay on the background image. The API will return a JSON object with a single property, `url`, which contains the public link to the uploaded image.

License
-------

This project is licensed under the MIT license.