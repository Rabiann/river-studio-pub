const { ipcMain, dialog, shell, app, desktopCapturer } = require('electron');
const fs = require('fs');
const path = require('path');
const streamingService = require('../services/streaming/ffmpeg');
const recordingsService = require('../services/database/recordings');
const mediaService = require('../services/media');
const telemetryService = require('../services/telemetry');

let recordingStream = null;
let currentRecordingPath = null;

module.exports = function registerIpcHandlers() {
  /**
   * Initialize services and register all IPC handlers for process communication.
   */
  telemetryService.init();

  // Telemetry tracking handler (legacy)
  ipcMain.on('telemetry:track', (_, { type, name, data }) => {
    // Logic removed to reduce overhead
  });

  ipcMain.handle('desktop:get-sources', async () => {
    const sources = await desktopCapturer.getSources({
      types: ['window', 'screen'],
    });
    return sources.map((source) => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL(),
    }));
  });

  /**
   * Start the streaming process.
   * Initializes FFmpeg with the provided RTMP URL.
   */
  ipcMain.on('streaming:start', (event, { rtmpUrl }) => {
    try {
      const command = streamingService.startStream(null, rtmpUrl);
      if (command) {
        command.on('error', (err) => {
          // Suppress errors from manual termination
          if (err.message && err.message.includes('SIGKILL')) {
            return;
          }
          // Notify renderer of streaming errors
          event.sender.send('streaming:error', err.message);
        });
        command.on('progress', (progress) => {
          // Send real-time bitrate updates to renderer
          event.sender.send('streaming:bitrate', progress.currentKbps);
        });
        command.run();
      }
    } catch (e) {
      event.sender.send('streaming:error', e.message);
    }
  });

  ipcMain.on('streaming:data', (_, chunk) => {
    streamingService.write(Buffer.from(chunk));
  });

  ipcMain.on('streaming:stop', () => {
    streamingService.stopStream();
  });

  /**
   * Start a new recording session.
   * If no path is provided, shows a system save dialog.
   * Validates directory existence before starting.
   */
  ipcMain.handle('recording:start', async (_, providedPath) => {
    let filePath = providedPath;

    if (!filePath) {
      const { filePath: selectedPath } = await dialog.showSaveDialog({
        buttonLabel: 'Save video',
        defaultPath: `recording-${Date.now()}.webm`,
        filters: [{ name: 'WebM Video', extensions: ['webm'] }],
      });
      filePath = selectedPath;
    }

    if (filePath) {
      try {
        const directory = path.dirname(filePath);
        if (!fs.existsSync(directory)) {
          return { error: 'DIRECTORY_NOT_FOUND', path: directory };
        }

        currentRecordingPath = filePath;
        recordingStream = fs.createWriteStream(filePath);
        return { filePath };
      } catch (err) {
        return { error: 'FILE_CREATE_FAILED', message: err.message };
      }
    }
    return null;
  });

  ipcMain.on('recording:data', (_, chunk) => {
    if (recordingStream) {
      recordingStream.write(Buffer.from(chunk));
    }
  });

  /**
   * Stop the current recording session.
   * Finalizes the file and saves metadata to the database.
   */
  ipcMain.handle('recording:stop', async () => {
    if (recordingStream) {
      recordingStream.end();
      recordingStream = null;

      if (currentRecordingPath) {
        try {
          // Brief delay to ensure file lock is released
          await new Promise((resolve) => setTimeout(resolve, 500));

          const metadata = await mediaService.getMetadata(currentRecordingPath);
          const filename = path.basename(currentRecordingPath);
          const date = new Date().toLocaleString();

          recordingsService.createRecording({
            path: currentRecordingPath,
            filename,
            date,
            duration: metadata.duration,
            size: metadata.size,
            thumbnail: metadata.thumbnail,
          });
        } catch (err) {
          // Metadata extraction failed, but file is saved
        }
        currentRecordingPath = null;
      }
    }
  });
  ipcMain.handle('app:quit', () => {
    telemetryService.stop();
    app.quit();
  });

  // Token management handlers
  const tokenService = require('../services/database/tokens');

  ipcMain.handle('tokens:create', async (event, { platform, token }) => {
    try {
      const id = tokenService.createToken(platform, token);
      return { success: true, id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('tokens:list', async () => {
    try {
      const tokens = tokenService.getTokens();
      return { success: true, tokens };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('tokens:get', async (event, platform) => {
    try {
      const token = tokenService.getTokenByPlatform(platform);
      return { success: true, token };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('tokens:update', async (event, { platform, token }) => {
    try {
      const updated = tokenService.updateToken(platform, token);
      return { success: true, updated };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('tokens:delete', async (event, platform) => {
    try {
      const deleted = tokenService.deleteToken(platform);
      return { success: true, deleted };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('dialog:openFile', async (event, { filters }) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters,
    });
    if (canceled) {
      return null;
    } else {
      return filePaths[0];
    }
  });

  ipcMain.handle('dialog:openDirectory', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
    });
    if (canceled) {
      return null;
    } else {
      return filePaths[0];
    }
  });

  // Recordings handlers
  ipcMain.handle('recordings:list', async () => {
    return recordingsService.getRecordings();
  });

  ipcMain.handle('recordings:delete', async (event, id) => {
    const recording = recordingsService.getRecording(id);
    if (recording) {
      // Delete file
      if (fs.existsSync(recording.path)) {
        try {
          fs.unlinkSync(recording.path);
        } catch (e) {
          console.error('Failed to delete file:', e);
        }
      }
      return recordingsService.deleteRecording(id);
    }
    return false;
  });

  ipcMain.handle('recordings:open', async (event, id) => {
    const recording = recordingsService.getRecording(id);
    if (recording && fs.existsSync(recording.path)) {
      shell.openPath(recording.path);
      return true;
    }
    return false;
  });

  ipcMain.handle('recordings:open-folder', async (event, id) => {
    if (id) {
      const recording = recordingsService.getRecording(id);
      if (recording && fs.existsSync(recording.path)) {
        shell.showItemInFolder(recording.path);
        return true;
      }
    } else {
      // Open default videos folder or home
      try {
        const videosPath = app.getPath('videos');
        await shell.openPath(videosPath);
        return true;
      } catch (e) {
        console.error('Failed to open videos folder:', e);
        await shell.openPath(app.getPath('home'));
        return true;
      }
    }
    return false;
  });

  ipcMain.handle('shell:open-external', async (event, url) => {
    await shell.openExternal(url);
    return true;
  });

  // Settings handlers
  const settingsService = require('../services/database/settings');

  /**
   * Retrieve all settings from the database.
   */
  ipcMain.handle('settings:get', async () => {
    try {
      const settings = settingsService.getAllSettings();
      return { success: true, settings };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('settings:set', async (event, { key, value }) => {
    try {
      const result = settingsService.setSetting(key, value);
      return { success: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('settings:get-single', async (event, key) => {
    try {
      const value = settingsService.getSetting(key);
      return { success: true, value };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  /**
   * Update multiple settings simultaneously.
   */
  ipcMain.handle('settings:set-multiple', async (event, settings) => {
    try {
      const result = settingsService.setMultipleSettings(settings);
      return { success: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
};
