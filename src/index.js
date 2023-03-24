require('./env')
const express = require('express')
const { resolve } = require('path')
const app = express()
const bodyParser = require('body-parser')
const { Storage } = require('@google-cloud/storage')
const Canvas = require('canvas')
const { isArray } = require('lodash')
const { getBackgroundByLength, splitTextToLines, getTier } = require('./helpers')
const ethers = require('ethers')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const GOOGLE_CLOUD_STORAGE_BUCKET_NAME_IMAGE = process.env.GOOGLE_CLOUD_STORAGE_BUCKET_NAME_IMAGE
const GOOGLE_CLOUD_STORAGE_BUCKET_NAME_METADATA = process.env.GOOGLE_CLOUD_STORAGE_BUCKET_NAME_METADATA

const storage = new Storage({
  keyFilename: 'keys.json',
})

Canvas.registerFont(resolve('./fonts/Nunito-Bold.ttf'), { family: 'Nunito' })

const uploadFile = async (buffer, filename, bucketName = GOOGLE_CLOUD_STORAGE_BUCKET_NAME_IMAGE) => {
  // Upload the buffer to the Google Storage bucket
  const bucket = storage.bucket(bucketName)
  const file = bucket.file(filename)
  return new Promise((resolve, reject) => {
    const stream = file.createWriteStream({ resumable: false })
    stream.on('error', reject)
    stream.on('finish', resolve)
    stream.end(buffer)
  })
}

const generateImage = async (text, maxFontSize = 80, minFontSize = 40) => {
  let fontSize = Number(maxFontSize)
  const fontSizeLowerBound = Number(minFontSize)

  // Load the background image from the file system or URL
  const name = text.split('.country')[0]
  const backgroundImagePath = getBackgroundByLength(name.length)

  const backgroundImage = await Canvas.loadImage(backgroundImagePath)

  // Create a new canvas and draw the background image on it
  const canvas = Canvas.createCanvas(backgroundImage.width, backgroundImage.height)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(backgroundImage, 0, 0, backgroundImage.width, backgroundImage.height)

  let textMetrcis

  do {
    ctx.font = `bold ${fontSize}px Nunito`

    if (fontSize > fontSizeLowerBound) {
      fontSize = fontSize - 5
    } else {
      text = splitTextToLines(text, ctx, canvas.width - 200)
    }

    textMetrcis = ctx.measureText(isArray(text) ? text[0] : text)
  } while (textMetrcis.width >= canvas.width - 100)

  // Draw the text on the canvas
  ctx.fillStyle = 'white'
  ctx.textAlign = 'right'

  if (isArray(text)) {
    text.reverse()
    text.forEach((t, idx) => {
      ctx.fillText(t, canvas.width - 50, canvas.height - 50 - textMetrcis.emHeightAscent * idx)
    })
  } else {
    ctx.fillText(text, canvas.width - 50, canvas.height - 50)
  }

  // Create a PNG buffer from the canvas data
  return canvas.toBuffer('image/png')
}

const generateMetadata = async (domain, image, registrationTimestamp, expirationTimestamp) => {
  const name = domain.split('.country')[0]
  const metadata = {
    name: domain,
    description: `${domain}, an NFT that links a traditional top-level domain (TLD) with a decentralized web3 name`,
    image,
    attributes: [
      {
        trait_type: 'Length',
        display_type: 'number',
        value: name.length
      },
      {
        trait_type: 'Tier',
        value: getTier(name.length)
      },
      {
        trait_type: 'Registration Date',
        display_type: 'date',
        value: registrationTimestamp
      },
      {
        trait_type: 'Expiration Date',
        display_type: 'date',
        value: expirationTimestamp
      }
    ]
  }
  const erc721Id = BigInt(ethers.id(name)).toString()
  const erc1155Id = BigInt(ethers.namehash(domain)).toString()
  const buffer = Buffer.from(JSON.stringify(metadata))
  const erc721Filename = `erc721/${erc721Id}`
  const erc1155Filename = `erc1155/${erc1155Id}`
  await uploadFile(buffer, erc721Filename, GOOGLE_CLOUD_STORAGE_BUCKET_NAME_METADATA)
  await uploadFile(buffer, erc1155Filename, GOOGLE_CLOUD_STORAGE_BUCKET_NAME_METADATA)
  return {
    erc721Metadata: `https://storage.googleapis.com/${GOOGLE_CLOUD_STORAGE_BUCKET_NAME_METADATA}/${erc721Filename}`,
    erc1155Metadata: `https://storage.googleapis.com/${GOOGLE_CLOUD_STORAGE_BUCKET_NAME_METADATA}/${erc1155Filename}`,
  }
}

// Define the route to handle the API request
app.get('/generate-nft-image', async (req, res) => {
  try {
    // Extract the text from the request body
    const { text, maxFont, minFont } = req.query
    if (!text) {
      res.status(400).json({ error: 'Text is missing in the request body' })
      return
    }
    const buffer = await generateImage(text, maxFont, minFont)
    const filename = `${text}.png`
    await uploadFile(buffer, filename, GOOGLE_CLOUD_STORAGE_BUCKET_NAME_IMAGE)
    // Get the public link to the uploaded file
    const url = `https://storage.googleapis.com/${GOOGLE_CLOUD_STORAGE_BUCKET_NAME_IMAGE}/${filename}`
    // Send the URL back as a response
    res.json({ url })
  } catch (ex) {
    console.error(ex)
    res.status(500).json({ error: ex.message })
  }
})

app.get('/generate-nft-data', async (req, res) => {
  try {
    const { domain, registrationTs, expirationTs } = req.query
    if (!domain || !registrationTs || !expirationTs) {
      return res.status(400).json({ error: 'missing parameters', domain, registrationTs, expirationTs })
    }
    const buffer = await generateImage(domain)
    await uploadFile(buffer, `${domain}.png`, GOOGLE_CLOUD_STORAGE_BUCKET_NAME_IMAGE)
    const image = `https://storage.googleapis.com/${GOOGLE_CLOUD_STORAGE_BUCKET_NAME_IMAGE}/${domain}.png`
    const { erc721Metadata, erc1155Metadata } = await generateMetadata(domain, image, registrationTs, expirationTs)
    res.json({ metadata: { erc721Metadata, erc1155Metadata }, image })
  } catch (ex) {
    console.error(ex)
    res.status(500).json({ error: ex.message })
  }
})

// Start the server
const port = process.env.PORT || 8080
app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
