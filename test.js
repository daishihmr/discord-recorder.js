const fs = require('fs')
const tone = require('tonegenerator')

// New Interface! More options!!
const tonedata = tone({
  freq: 480,
  lengthInSecs: 10.0,
  volume: 0,
  rate: 48000,
  shape: () => 127
})
const stereodata = []
for (let i = 0; i < tonedata.length; i++) {
  stereodata.push(tonedata[i])
  stereodata.push(tonedata[i])
}

const data = Int16Array.from(stereodata)
const buffer = Buffer.allocUnsafe(data.length * 2)
data.forEach((val, index) => {
  buffer.writeInt16LE(0, index * 2)
});

const outputStream = fs.createWriteStream('test.pcm')
outputStream.write(buffer)
outputStream.end()
