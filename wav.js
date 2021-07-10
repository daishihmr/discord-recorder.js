const fs = require('fs');
const header = require('waveheader');

const wav = (folderName) => {
  const pcmFiles = fs
    .readdirSync(`${folderName}`)
    .filter((_) => _.endsWith('.pcm'));
  
  pcmFiles.forEach((pcmFile) => {
    console.log(`${pcmFile} start`)
    const b = pcmFile.split(".")[0];
    const outputStream = fs.createWriteStream(`${folderName}/${b}.wav`);
    const stat = fs.statSync(`${folderName}/${pcmFile}`);
    const len = stat.size;
    outputStream.write(header(len, {
      sampleRate: 48000,
      channels: 2,
      bitDepth: 16,
    }));

    const pcmData = fs.readFileSync(`${folderName}/${pcmFile}`);
    outputStream.write(pcmData);
    outputStream.end();
    console.log(`${pcmFile} end`)
  });
};

module.exports = wav;
