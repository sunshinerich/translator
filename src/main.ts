import { app, BrowserWindow, ipcMain, globalShortcut, clipboard, Tray, Menu, nativeImage } from 'electron';
import * as path from 'path';
import { translate, getSettings, saveSettings } from './services/translator';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

let isQuitting = false;

function createWindow() {
    const iconPath = path.join(__dirname, '../icon.png');
    const icon = nativeImage.createFromPath(iconPath);

    mainWindow = new BrowserWindow({
        width: 350,
        height: 650,
        minWidth: 350,
        minHeight: 500,
        icon: icon,
        frame: false, // Frameless for custom UI
        transparent: true, // Transparent for rounded corners
        hasShadow: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        autoHideMenuBar: true,
        show: false,
        backgroundColor: '#00000000' // Transparent background
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });
    // mainWindow.webContents.openDevTools();

    // Create Tray
    const trayIconPath = path.join(__dirname, '../tray-icon.png');
    const trayIcon = nativeImage.createFromPath(trayIconPath);

    // On macOS, template images are used for dark/light mode support
    // On some Linux DEs, this also helps
    trayIcon.setTemplateImage(true);

    tray = new Tray(trayIcon);

    const updateContextMenu = () => {
        const isVisible = mainWindow?.isVisible();
        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Translator Pro',
                enabled: false
            },
            { type: 'separator' },
            {
                label: isVisible ? '隐藏窗口' : '显示窗口',
                click: () => {
                    if (isVisible) {
                        mainWindow?.hide();
                    } else {
                        mainWindow?.show();
                        mainWindow?.focus();
                    }
                }
            },
            {
                label: '设置',
                click: () => {
                    mainWindow?.show();
                    mainWindow?.focus();
                    mainWindow?.webContents.send('go-to-settings');
                }
            },
            { type: 'separator' },
            {
                label: '退出',
                click: () => {
                    isQuitting = true;
                    app.quit();
                }
            }
        ]);
        tray?.setContextMenu(contextMenu);
    };

    const settings = getSettings();
    const providerName = settings.provider.charAt(0).toUpperCase() + settings.provider.slice(1);
    tray.setToolTip(`Translator Pro (${providerName}) - Alt+Space`);
    updateContextMenu();

    tray.on('click', () => {
        if (mainWindow?.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow?.show();
            mainWindow?.focus();
        }
    });

    // Update menu when window visibility changes
    mainWindow.on('show', updateContextMenu);
    mainWindow.on('hide', updateContextMenu);

    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow?.hide();
        }
        return false;
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();

    // Global Hotkey: Alt+Space to toggle visibility
    globalShortcut.register('Alt+Space', () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            } else {
                mainWindow.show();
                mainWindow.focus();
            }
        }
    });

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});



ipcMain.handle('translate', async (event: Electron.IpcMainInvokeEvent, text: string, sourceLang: string, targetLang: string) => {
    try {
        const result = await translate(text, sourceLang, targetLang);
        return { success: true, text: result };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('set-always-on-top', (event: Electron.IpcMainInvokeEvent, flag: boolean) => {
    if (mainWindow) {
        mainWindow.setAlwaysOnTop(flag);
    }
});

ipcMain.handle('minimize-window', () => {
    mainWindow?.minimize();
});

ipcMain.handle('close-window', () => {
    mainWindow?.hide(); // Hide instead of close to keep running in tray
});

ipcMain.handle('show-context-menu', (event, text: string) => {
    const menu = Menu.buildFromTemplate([
        {
            label: 'Copy Result',
            click: () => { clipboard.writeText(text); }
        }
    ]);
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        menu.popup({ window: win });
    }
});

ipcMain.handle('resize-window', (event, x: number, y: number) => {
    if (mainWindow) {
        const bounds = mainWindow.getBounds();
        const newWidth = x - bounds.x;
        const newHeight = y - bounds.y;
        if (newWidth > 350 && newHeight > 500) {
            mainWindow.setSize(newWidth, newHeight);
        }
    }
});

ipcMain.handle('move-window', (event, dx: number, dy: number) => {
    if (mainWindow) {
        const [x, y] = mainWindow.getPosition();
        mainWindow.setPosition(x + dx, y + dy);
    }
});

ipcMain.handle('read-clipboard', () => {
    return clipboard.readText();
});

ipcMain.handle('get-settings', () => {
    return getSettings();
});

ipcMain.handle('save-settings', (event: Electron.IpcMainInvokeEvent, settings: any) => {
    saveSettings(settings);
    if (tray) {
        const providerName = settings.provider.charAt(0).toUpperCase() + settings.provider.slice(1);
        tray.setToolTip(`Translator Pro (${providerName}) - Alt+Space`);
    }
});
