const fs = require("fs");
const tonegenerator = require("tonegenerator");

const writeSlence = (outputStream, msec) => {
  // console.log('write silence ' + msec + 'ms');

  if (msec == 0) return true;
  if (msec < 0) {
    console.log(`time is minus (${msec})`);
    return false;
  }

  // const tonedata = tonegenerator({
  //   freq: 480,
  //   lengthInSecs: msec / 1000,
  //   volume: 0,
  //   rate: 48000,
  //   shape: () => 0,
  // });

  // console.log("create buffer");
  const len = (48000 * 2 * msec) / 1000;
  const buffer = Buffer.allocUnsafe(len * 2);
  for (let i = 0; i < len; i++) {
    buffer.writeInt16LE(0, i * 2);
  }

  // console.log("write buffer to file");
  outputStream.write(buffer);

  return true;
};

const joinPcmFiles = (folderName) => {
  // console.log("join pcm files begin");

  const pcmFiles = fs
    .readdirSync(`${folderName}/temp`)
    .filter((_) => _.endsWith(".pcm"));
  pcmFiles.sort((lhs, rhs) => {
    const l = lhs.split(".")[0];
    const lhsStat = {
      channelId: Number(l.split("-")[0]),
      memberId: Number(l.split("-")[1]),
      timestamp: Number(l.split("-")[2]),
    };
    const r = rhs.split(".")[0];
    const rhsStat = {
      channelId: Number(r.split("-")[0]),
      memberId: Number(r.split("-")[1]),
      timestamp: Number(r.split("-")[2]),
    };
    const c = lhsStat.channelId - rhsStat.channelId;
    const m = lhsStat.memberId - rhsStat.memberId;
    return c ? c : m ? m : lhsStat.timestamp - rhsStat.timestamp;
  });

  let uniq = 0;
  let currentChannelId = null;
  let currentMemberId = null;
  let currentTimestamp = 0;
  let outputStream = null;
  let time = 0;

  pcmFiles.forEach((pcmFile) => {
    // console.log("proc " + pcmFile);

    const fnb = pcmFile.split(".")[0];
    const channelId = fnb.split("-")[0];
    const memberId = fnb.split("-")[1];
    const timestamp = Number(fnb.split("-")[2]);
    // console.log(
      // `channel=${channelId} member=${memberId} timestamp=${timestamp}`
    // );

    if (currentChannelId != channelId || currentMemberId != memberId) {
      if (outputStream != null) {
        outputStream.end();
      }
      time = 0;
      currentTimestamp = 0;
      outputStream = fs.createWriteStream(
        `./${folderName}/${channelId}-${memberId}-${uniq++}.pcm`
      );
    }

    const result = writeSlence(outputStream, timestamp - currentTimestamp - time);
    if (!result) {
      // console.log(`${folderName}/temp/${pcmFile}`);
      // console.log(`write slence ${timestamp} - ${currentTimestamp} - ${time}`);
      outputStream.end();
      time = 0;
      currentTimestamp = 0;
      outputStream = fs.createWriteStream(
        `./${folderName}/${channelId}-${memberId}-${uniq++}.pcm`
      );
      writeSlence(outputStream, timestamp - currentTimestamp - time);
    }

    const pcmData = fs.readFileSync(`${folderName}/temp/${pcmFile}`);

    // console.log("write pcmData");
    outputStream.write(pcmData);

    const stat = fs.statSync(`${folderName}/temp/${pcmFile}`);
    time = (stat.size * 1000) / (2 * 2 * 48000);
    // console.log(`time = ${time}`);

    currentChannelId = channelId;
    currentMemberId = memberId;
    currentTimestamp = timestamp;
    // console.log("proc " + pcmFile + " done");
  });

  console.log("join pcm files end");
};

module.exports = joinPcmFiles;
