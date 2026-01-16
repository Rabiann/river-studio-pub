const ffmpeg = require('fluent-ffmpeg');
const { PassThrough } = require('stream');
// Telemetry disabled

let command = null;
let inputStream = null;

function startStream(sourceId, rtmpUrl) {
  if (command) {
    throw new Error('Stream already running');
  }

  inputStream = new PassThrough();

  command = ffmpeg()
    .input(inputStream)
    .inputFormat('webm')
    .outputOptions([
      '-c:v libx264',
      '-preset ultrafast',
      '-tune zerolatency',
      '-g 60', // Keyframe every 60 frames (2 sec at 30fps)
      '-keyint_min 60',
      '-sc_threshold 0', // Disable scene change detection for consistent GOP
      '-b:v 2500k',
      '-maxrate 2500k',
      '-minrate 2500k', // Enforce CBR
      '-bufsize 2500k',
      '-nal-hrd cbr', // CBR hint for x264
      '-c:a aac',
      '-b:a 128k', // Explicit audio bitrate
      '-ar 44100',
      '-f flv',
      '-flvflags no_duration_filesize',
    ])
    .output(rtmpUrl)
    .on('start', (cmdLine) => {
      // Logic for stream start
    })
    .on('error', (err) => {
      stopStream(); // Ensure cleanup on error
    })
    .on('end', () => {
      stopStream();
    })
    .on('progress', (progress) => {
      // Progress tracking logic removed
    });

  return command;
}

function write(chunk) {
  if (inputStream) {
    inputStream.write(chunk);
  }
}

function stopStream() {
  if (command) {
    command.kill('SIGKILL');
    command = null;
  }
  if (inputStream) {
    inputStream.end();
    inputStream = null;
  }
}

function getCommand() {
  return command;
}

module.exports = {
  startStream,
  stopStream,
  write,
  getCommand,
};
