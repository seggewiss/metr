import {contextBridge, ipcRenderer} from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (message: string) => ipcRenderer.send('message', message)
})

// Expose a limited API to the renderer process through a 'metronome' global
contextBridge.exposeInMainWorld('metronome', {
  // Methods to control metronome state via IPC
  start: () => ipcRenderer.send('metronome:start'),
  stop: () => ipcRenderer.send('metronome:stop'),
});
