const getBackgroundByLength = (length) => {
  if (length <= 3) {
    return './backgrounds/legendary.png'
  }

  if (length <= 6) {
    return './backgrounds/super_rare.png'
  }

  if (length <= 9) {
    return './backgrounds/rare.png'
  }

  return './backgrounds/common.png'
}

const getTier = (length) => {
  if (length <= 3) {
    return 'Legendary'
  }

  if (length <= 6) {
    return 'Super Rare'
  }

  if (length <= 9) {
    return 'Rare'
  }

  return 'Common'
}

// "1-3 legendary.png"
// "4-6 super_rare.png"
// "7-9 rare.png"
// "10+ common.png"

const splitTextToLines = (text, ctx, maxWidth) => {
  const chars = text.split('')
  const linesArray = []

  chars.reverse()

  let i = 1
  let lastPoint = 0

  do {
    const lineWidth = ctx.measureText(chars.slice(lastPoint, i).join('')).width

    if (lineWidth > maxWidth) {
      const line = chars.slice(lastPoint, i - 1)
      line.reverse()

      linesArray.push(line.join(''))
      lastPoint = i - 1
      // maxWidth = lineWidth;
    }
  } while (chars[i++])

  const line = chars.slice(lastPoint)
  line.reverse()
  linesArray.push(line.join(''))

  linesArray.reverse()

  return linesArray
}

module.exports = {
  getBackgroundByLength,
  splitTextToLines,
  getTier
}
