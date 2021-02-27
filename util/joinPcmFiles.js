const fs = require('fs');
const tonegenerator = require('tonegenerator');

const writeSlence = (outputStream, msec) => {
  // console.log('write silence ' + msec + 'ms');

  if (msec == 0) return;

  const tonedata = tonegenerator({
    freq: 440,
    lengthInSecs: msec / 1000,
    volume: 0,
    rate: 48000,
    shape: () => 0,
  });
  const stereodata = [];
  for (let i = 0; i < tonedata.length; i++) {
    stereodata.push(tonedata[i]);
    stereodata.push(tonedata[i]);
  }

  const data = Int16Array.from(stereodata);
  const buffer = Buffer.allocUnsafe(data.length * 2);
  data.forEach((val, index) => {
    buffer.writeInt16LE(0, index * 2);
  });

  outputStream.write(buffer);
};

const joinPcmFiles = (folderName) => {
  console.log('join pcm files begin');

  const pcmFiles = fs
    .readdirSync(`${folderName}/temp`)
    .filter((_) => _.endsWith('.pcm'));
  pcmFiles.sort((lhs, rhs) => {
    const l = lhs.split('.')[0];
    const lhsStat = {
      channelId: Number(l.split('-')[0]),
      memberId: Number(l.split('-')[1]),
      timestamp: Number(l.split('-')[2]),
    };
    const r = rhs.split('.')[0];
    const rhsStat = {
      channelId: Number(r.split('-')[0]),
      memberId: Number(r.split('-')[1]),
      timestamp: Number(r.split('-')[2]),
    };
    const c = lhsStat.channelId - rhsStat.channelId;
    const m = lhsStat.memberId - rhsStat.memberId;
    return c ? c : m ? m : lhsStat.timestamp - rhsStat.timestamp;
  });

  let currentChannelId = null;
  let currentMemberId = null;
  let outputStream = null;
  let time = 0;

  pcmFiles.forEach((pcmFile) => {
    // console.log('proc ' + pcmFile);

    const fnb = pcmFile.split('.')[0];
    const channelId = fnb.split('-')[0];
    const memberId = fnb.split('-')[1];
    const timestamp = Number(fnb.split('-')[2]);
    // console.log(`channel=${channelId} member=${memberId} timestamp=${timestamp}`);

    if (currentChannelId != channelId || currentMemberId != memberId) {
      if (outputStream != null) {
        outputStream.end();
      }
      currentChannelId = channelId;
      currentMemberId = memberId;
      outputStream = fs.createWriteStream(
        `./${folderName}/${currentChannelId}-${currentMemberId}.pcm`
      );
    }

    writeSlence(outputStream, timestamp - time);

    const pcmData = fs.readFileSync(`${folderName}/temp/${pcmFile}`);
    outputStream.write(pcmData);

    const stat = fs.statSync(`${folderName}/temp/${pcmFile}`);
    time = timestamp + (stat.size / (2 * 2 * 48000)) * 1000;

    // console.log('proc ' + pcmFile + ' done');
  });

  console.log('join pcm files end');
};

module.exports = joinPcmFiles;
