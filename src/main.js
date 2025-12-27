// src/main.js
const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const ActivityMonitor = require('./monitor');
const Database = require('./database');

let mainWindow;
let monitor;
let database;

// Inicialização Global
database = new Database();
monitor = new ActivityMonitor(database);

if (app.isPackaged) {
  app.setLoginItemSettings({
    openAtLogin: true,
    path: app.getPath('exe')
  });
}

function createWindow() {
  // Configuração de Segurança CSP
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; " +
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
          "font-src 'self' https://fonts.gstatic.com; " +
          "img-src 'self' data: https://www.google.com https://t0.gstatic.com https://t1.gstatic.com https://icons.duckduckgo.com https://cdn.jsdelivr.net https://raw.githubusercontent.com; " +
          "connect-src 'self' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net"
        ]
      }
    });
  });

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.resolve(__dirname, 'preload.js')
    },
    autoHideMenuBar: true
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Abre o devtools automaticamente durante o desenvolvimento para debugar
  // mainWindow.webContents.openDevTools();
}

// ========== REGISTRO DE HANDLERS (Busca de dados) ==========

ipcMain.handle('get-stats', async () => {
  return await database.getTodayStats();
});

ipcMain.handle('get-available-dates', async () => {
  return await database.getAvailableDates();
});

ipcMain.handle('get-stats-by-date', async (event, date) => {
  return await database.getStatsByDate(date);
});

// ========== EVENTOS DE MONITORAMENTO ==========

ipcMain.on('start-monitoring', () => {
  monitor.start((data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      // O nome do canal deve bater exatamente com o que o preload.js escuta
      mainWindow.webContents.send('activity-update', data);
    }
  });
});

ipcMain.on('stop-monitoring', () => {
  monitor.stop();
});

// ========== CICLO DE VIDA ==========

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (monitor) monitor.stop();
  if (process.platform !== 'darwin') app.quit();
});