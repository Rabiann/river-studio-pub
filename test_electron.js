let electron;
try {
  electron = require('electron/main');
} catch {
  console.log('electron/main failed, trying electron');
  electron = require('electron');
}
console.log('Type:', typeof electron);
console.log('Value:', electron);
console.log('Versions:', process.versions);
try {
  const { app } = electron;
  console.log('App:', app);
} catch (e) {
  console.log('Error accessing app:', e);
}
