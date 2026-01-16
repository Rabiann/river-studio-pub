const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getScreenSources: () => ipcRenderer.invoke('desktop:get-sources'),
  startStream: (rtmpUrl) => ipcRenderer.send('streaming:start', { rtmpUrl }),
  sendStreamData: (chunk) => ipcRenderer.send('streaming:data', chunk),
  stopStream: () => ipcRenderer.send('streaming:stop'),
  startRecording: (path) => ipcRenderer.invoke('recording:start', path),
  saveRecordingChunk: (chunk) => ipcRenderer.send('recording:data', chunk),
  stopRecording: () => ipcRenderer.invoke('recording:stop'),
  quitApp: () => ipcRenderer.invoke('app:quit'),
  // Token management
  createToken: (platform, token) =>
    ipcRenderer.invoke('tokens:create', { platform, token }),
  getTokens: () => ipcRenderer.invoke('tokens:list'),
  getToken: (platform) => ipcRenderer.invoke('tokens:get', platform),
  updateToken: (platform, token) =>
    ipcRenderer.invoke('tokens:update', { platform, token }),
  deleteToken: (platform) => ipcRenderer.invoke('tokens:delete', platform),
  selectFile: (filters) => ipcRenderer.invoke('dialog:openFile', { filters }),
  selectDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  // Recordings
  getRecordings: () => ipcRenderer.invoke('recordings:list'),
  deleteRecording: (id) => ipcRenderer.invoke('recordings:delete', id),
  openRecording: (id) => ipcRenderer.invoke('recordings:open', id),
  openRecordingFolder: (id) => ipcRenderer.invoke('recordings:open-folder', id),
  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSetting: (key, value) =>
    ipcRenderer.invoke('settings:set', { key, value }),
  getSetting: (key) => ipcRenderer.invoke('settings:get-single', key),
  setMultipleSettings: (settings) =>
    ipcRenderer.invoke('settings:set-multiple', settings),
  // Telemetry
  track: (type, name, data) => ipcRenderer.send('telemetry:track', { type, name, data }),
  // Shell
  openExternal: (url) => ipcRenderer.invoke('shell:open-external', url),
  // Events
  onStreamingError: (callback) =>
    ipcRenderer.on('streaming:error', (_, err) => callback(err)),
  offStreamingError: () => ipcRenderer.removeAllListeners('streaming:error'),
  onStreamingBitrate: (callback) =>
    ipcRenderer.on('streaming:bitrate', (_, kbps) => callback(kbps)),
  offStreamingBitrate: () => ipcRenderer.removeAllListeners('streaming:bitrate'),
});
