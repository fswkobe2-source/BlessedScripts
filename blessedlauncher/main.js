const { app, BrowserWindow, dialog, shell, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const log = require('electron-log');
const { ipcMain } = require('electron');

// Import updater
const Updater = require('./libs/updater');

process.on('uncaughtException', (error) => {
    log.error('Uncaught Exception:', error);
});

let mainWindow = null;
let updater = null;

// Ensure the .blessedscripts directory exists
const blessedScriptsDir = path.join(process.env.HOME || process.env.USERPROFILE, '.blessedscripts');
if (!fs.existsSync(blessedScriptsDir)) {
    fs.mkdirSync(blessedScriptsDir);
}

async function loadLibraries() {
    log.info('Loading libraries...');

    const ipcHandlersPath = path.join(__dirname, 'libs', 'ipc-handlers.js');

    try {
        log.info('Requiring ipc-handlers...');
        const handler = require(ipcHandlersPath);
        const deps = {
            axios: axios,
            ipcMain: ipcMain,
            blessedScriptsDir: blessedScriptsDir,
            path: path,
            log: log,
            dialog: dialog,
            shell: shell,
            fs: fs,
            app: app,
            mainWindow: mainWindow
        };

        if (typeof handler === 'function') {
            await handler(deps);
        } else {
            log.error('ipcHandlers does not export a function');
        }
        log.info('Done requiring ipcHandlers...');
    } catch (error) {
        log.error('Error requiring ipcHandlers:', error);
    }
}

async function createWindow() {
    console.log('Creating window...');
    log.info('Creating Blessed Scripts Launcher window...');
    
    // Create the main window
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        show: false, // Don't show immediately - wait for update check
        title: 'Blessed Scripts Launcher',
        autoHideMenuBar: true,
        icon: path.join(__dirname, 'images', 'microbot_transparent.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: true,
            webviewTag: true
        }
    });

    console.log('Window created, loading HTML...');
    log.info('Window created, loading HTML file...');

    try {
        await mainWindow.loadFile(path.join(__dirname, 'index.html'));
        console.log('HTML loaded successfully');
        log.info('HTML loaded successfully');
        
        // Initialize updater after window is ready
        updater = new Updater(mainWindow);
        
        // Check for updates silently
        setTimeout(async () => {
            try {
                await updater.checkForUpdates();
            } catch (error) {
                log.error('Update check failed:', error);
            }
            
            // Show window regardless of update check result
            mainWindow.show();
            mainWindow.focus();
            console.log('Window shown and focused');
            log.info('Window shown and focused');
        }, 1000); // Wait 1 second before checking updates
        
    } catch (error) {
        console.error('Failed to load HTML:', error);
        log.error('Failed to load HTML:', error);
        // Show window even if HTML loading fails
        mainWindow.show();
        mainWindow.focus();
    }
}

app.whenReady().then(async () => {
    console.log('App is ready, starting launcher...');
    log.info('Blessed Scripts Launcher starting...');
    
    console.log('Loading libraries...');
    // Load all IPC handlers first
    await loadLibraries();
    console.log('Libraries loaded successfully');
    
    console.log('Creating window...');
    // Then create and show the window
    await createWindow();
    console.log('Window creation completed');
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
