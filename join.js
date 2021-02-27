const join = require("./util/joinPcmFiles");
const wav = require("./util/pcmToWav");

const folderName = process.argv[2];

join(folderName);
wav(folderName);
