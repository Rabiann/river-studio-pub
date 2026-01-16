const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

function formatDuration(secondsInput) {
  let seconds = parseFloat(secondsInput);
  if (isNaN(seconds)) seconds = 0;

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getMetadata(filePath) {
  return new Promise((resolve) => {
    if (!fs.existsSync(filePath)) {
      return resolve({ duration: '00:00:00', size: '0 B', thumbnail: '' });
    }

    const stats = fs.statSync(filePath);
    const size = formatSize(stats.size);

    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        console.error('Error getting metadata:', err);
        return resolve({ duration: '00:00:00', size, thumbnail: '' });
      }

      let durationSec = metadata.format.duration;
      if (!durationSec || durationSec === 'N/A') {
        // Try to find duration in streams
        if (metadata.streams && metadata.streams.length > 0) {
          for (const stream of metadata.streams) {
            if (stream.duration && stream.duration !== 'N/A') {
              durationSec = stream.duration;
              break;
            }
          }
        }
      }

      const duration = formatDuration(durationSec || 0);
      resolve({ duration, size, thumbnail: '' });
    });
  });
}

module.exports = {
  getMetadata,
  formatDuration,
  formatSize,
};
