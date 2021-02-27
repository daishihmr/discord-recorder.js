const Discord = require('discord.js');
const fs = require('fs');
const { Readable } = require('stream');
const moment = require('moment');

class Silence extends Readable {
  _read() {
    this.push(Buffer.from([0xf8, 0xff, 0xfe]));
  }
}

const client = new Discord.Client();
const config = require('./auth.json');

client.on('message', (msg) => {
  if (msg.content.startsWith(config.prefix + 'j')) {
    const now = moment().format('yyyy-MM-DD-HH-mm-ss');
    const folderName = `./recordings/${now}`;
    fs.mkdirSync(folderName);
    fs.mkdirSync(`${folderName}/temp`);

    const startTime = Date.now();

    const channels = [];
    const members = [];

    const generateOutputFile = (channel, member) => {
      if (channels.indexOf(channel.id) < 0) {
        channels.push(channel.id);
      }
      if (members.indexOf(member.id) < 0) {
        members.push(member.id);
      }

      const channelId = channels.indexOf(channel.id);
      const memberId = members.indexOf(member.id);
      const timestamp = Date.now() - startTime;
      const fileName = `./${folderName}/temp/${channelId}-${memberId}-${timestamp}.pcm`;

      const stream = fs.createWriteStream(fileName);
      return stream;
    };

    let [command, ...channelName] = msg.content.split(' ');
    if (channelName.length == 0) channelName = ["General"];
    if (!msg.guild) {
      return msg.reply(
        'no private service is available in your area at the moment. Please contact a service representative for more details.'
      );
    }
    const voiceChannel = msg.guild.channels.cache.find(
      (ch) => ch.name === channelName.join(' ')
    );
    //console.log(voiceChannel.id);
    if (!voiceChannel || voiceChannel.type !== 'voice') {
      return msg.reply(
        `I couldn't find the channel ${channelName}. Can you spell?`
      );
    }

    voiceChannel
      .join()
      .then((conn) => {
        conn.play(new Silence(), { type: 'opus' });

        msg.reply('ready!');
        // create our voice receiver
        const receiver = conn.receiver;

        conn.on('speaking', (user, speaking) => {
          if (speaking) {
            // msg.channel.send(`I'm listening to ${user}`);
            // this creates a 16-bit signed PCM, stereo 48KHz PCM stream.
            const audioStream = receiver.createStream(user, {
              mode: 'pcm',
              end: 'silence',
            });
            const data = speaking.toArray();
            if (data.length > 0) {
              console.log('speaking begin ');
              const outputStream = generateOutputFile(voiceChannel, user);
              audioStream.pipe(outputStream);
              audioStream.on('finish', () => {
                console.log('audioStream finish');
                outputStream.end();
              });
            } else {
              console.log('speaking end');
            }
          }
        });
      })
      .catch(console.log);
  }
  if (msg.content.startsWith(config.prefix + 'l')) {
    let [command, ...channelName] = msg.content.split(' ');
    if (channelName.length == 0) channelName = ["General"];
    let voiceChannel = msg.guild.channels.cache.find(
      (ch) => ch.name === channelName.join(' ')
    );
    msg.reply('bye!');
    voiceChannel.leave();
  }
});

client.login(config.token);

client.on('ready', () => {
  console.log('ready!');
});

process.on('SIGINT', () => {
  process.exit(0);
});
process.on('exit', () => {
});
