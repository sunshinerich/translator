import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    translate: (text: string, source: string, target: string) => ipcRenderer.invoke('translate', text, source, target),
    setAlwaysOnTop: (flag: boolean) => ipcRenderer.invoke('set-always-on-top', flag),
    readClipboard: () => ipcRenderer.invoke('read-clipboard'),
    getSettings: () => ipcRenderer.invoke('get-settings'),
    saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
    on: (channel: string, callback: (...args: any[]) => void) => {
        ipcRenderer.on(channel, (event, ...args) => callback(...args));
    },
    minimize: () => ipcRenderer.invoke('minimize-window'),
    close: () => ipcRenderer.invoke('close-window'),
    showContextMenu: (text: string) => ipcRenderer.invoke('show-context-menu', text),
    resizeWindow: (x: number, y: number) => ipcRenderer.invoke('resize-window', x, y),
    moveWindow: (dx: number, dy: number) => ipcRenderer.invoke('move-window', dx, dy)
});
