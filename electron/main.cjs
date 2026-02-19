const { app, BrowserWindow } = require('electron');
const serve = require('electron-serve');
const path = require('path');

const loadURL = serve({ directory: 'build' });

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // For simple local apps; consider contextBridge for security in production if loading remote content
            // preload: path.join(__dirname, 'preload.js') 
        },
        icon: path.join(__dirname, '../static/favicon.png') // Ensure icon exists or fallback
    });

    // In dev, load localhost. In prod, load via electron-serve
    // We can detect dev mode via env or arg
    const isDev = !app.isPackaged;

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        loadURL(mainWindow);
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
