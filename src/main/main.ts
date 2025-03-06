import {app, BrowserWindow, ipcMain, session, powerSaveBlocker} from 'electron';
import {join} from 'path';

// Prevent system sleep when metronome is running
let preventSleepId: number|null = null;

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  if (process.env.NODE_ENV === 'development') {
    const rendererPort = process.argv[2];
    mainWindow.loadURL(`http://localhost:${rendererPort}`);
    mainWindow.webContents.openDevTools();
  }
  else {
    mainWindow.loadFile(join(app.getAppPath(), 'renderer', 'index.html'));
  }

   // Stop preventing sleep if active when window closes
  if (preventSleepId !== null) {
    powerSaveBlocker.stop(preventSleepId);
    preventSleepId = null;
  }
}

app.whenReady().then(() => {
  createWindow();

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ['script-src \'self\'']
      }
    })
  })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
});

ipcMain.on('message', (event, message) => {
  console.log(message);
})

// IPC Handlers

// Handle metronome start
ipcMain.on('metronome:start', () => {
  console.log('Metronome started, preventing system sleep');
  
  // Prevent system from sleeping while metronome is running
  if (preventSleepId === null) {
    preventSleepId = powerSaveBlocker.start('prevent-app-suspension');
  }
});

// Handle metronome stop
ipcMain.on('metronome:stop', () => {
  console.log('Metronome stopped, allowing system sleep');
  
  // Allow system to sleep when metronome stops
  if (preventSleepId !== null) {
    powerSaveBlocker.stop(preventSleepId);
    preventSleepId = null;
  }
});