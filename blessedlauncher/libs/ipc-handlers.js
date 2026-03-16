module.exports = async function (deps) {
    const { ipcMain, axios, blessedScriptsDir, path, log, dialog, fs, app, shell } = deps;

    // OAuth Authentication Handler
    const { startAuthFlow } = require(path.join(__dirname, 'oauth-jagex.js'));
    ipcMain.handle('start-auth-flow', async () => {
        try {
            return await startAuthFlow();
        } catch (error) {
            log.error(`Error during authentication flow: ${error.message}`);
            return { error: error.message };
        }
    });

    // Account Management Handlers
    const filePath = path.resolve(blessedScriptsDir, 'accounts.json');

    ipcMain.handle('read-accounts', async () => {
        try {
            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf8');
                let accounts = JSON.parse(data);
                accounts.sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn));
                
                const uniqueDisplayNames = new Set();
                return accounts.filter((account) => {
                    if (uniqueDisplayNames.has(account.displayName)) {
                        return false;
                    } else {
                        if (!account.displayName) {
                            account.displayName = 'Not set';
                            return true;
                        } else {
                            uniqueDisplayNames.add(account.displayName);
                            return true;
                        }
                    }
                });
            } else {
                log.info('Accounts file does not exist, returning empty array');
                return [];
            }
        } catch (error) {
            log.error(error.message);
            return { error: error.message };
        }
    });

    ipcMain.handle('remove-accounts', async () => {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                log.info('All accounts removed successfully');
            }
            return { success: true };
        } catch (error) {
            log.error(error.message);
            return { error: error.message };
        }
    });

    ipcMain.handle('delete-account', async (event, accountId) => {
        try {
            if (!accountId) {
                return { error: 'Invalid account id' };
            }

            if (!fs.existsSync(filePath)) {
                return { error: 'Accounts file does not exist' };
            }

            const data = fs.readFileSync(filePath, 'utf8');
            let accounts = [];

            try {
                accounts = JSON.parse(data);
            } catch (parseError) {
                log.error(parseError.message);
                return { error: 'Accounts file is corrupted or unreadable' };
            }

            const updatedAccounts = accounts.filter((account) => account.accountId !== accountId);

            if (updatedAccounts.length === accounts.length) {
                return { error: 'Account not found' };
            }

            fs.writeFileSync(filePath, JSON.stringify(updatedAccounts, null, 2));
            log.info(`Account ${accountId} deleted successfully`);
            return { success: true };
        } catch (error) {
            log.error(error.message);
            return { error: error.message };
        }
    });

    // File Change Monitoring Handler
    let lastModifiedTime = null;
    let fileExistedLastCheck = fs.existsSync(filePath);

    ipcMain.handle('check-file-change', async () => {
        try {
            let val = false;
            const fileExistsNow = fs.existsSync(filePath);

            if (fileExistedLastCheck && !fileExistsNow) {
                log.info('Accounts file was deleted!');
                lastModifiedTime = null;
                fileExistedLastCheck = false;
                return true;
            }

            if (!fileExistedLastCheck && fileExistsNow) {
                log.info('Accounts file was created!');
                const stats = fs.statSync(filePath);
                lastModifiedTime = stats.mtime;
                fileExistedLastCheck = true;
                return true;
            }

            if (fileExistsNow) {
                const stats = fs.statSync(filePath);
                const modifiedTime = stats.mtime;

                if (!lastModifiedTime || modifiedTime > lastModifiedTime) {
                    log.info('Accounts file has been modified!');
                    lastModifiedTime = modifiedTime;
                    val = true;
                }
            }

            return val;
        } catch (error) {
            log.error(`Error checking file change: ${error.message}`);
            return false;
        }
    });

    // Refresh Accounts Handler
    ipcMain.handle('refresh-accounts', async () => {
        try {
            const { writeAccountsToFile } = require(path.join(__dirname, 'oauth-jagex.js'));

            if (!fs.existsSync(filePath)) {
                return { error: 'accounts.json does not exist' };
            }

            let accountsData = [];
            try {
                const raw = fs.readFileSync(filePath, 'utf8');
                accountsData = JSON.parse(raw);
            } catch (err) {
                log.error('Failed to read accounts.json for refresh:', err.message);
                return { error: 'Failed to read accounts.json' };
            }

            if (!Array.isArray(accountsData) || accountsData.length === 0) {
                return { error: 'No accounts found to refresh' };
            }

            const firstAccount = accountsData[0];
            const sessionId = firstAccount && firstAccount.sessionId;
            if (!sessionId) {
                return { error: 'No sessionId found in accounts.json' };
            }

            await writeAccountsToFile(sessionId);

            try {
                const updatedRaw = fs.readFileSync(filePath, 'utf8');
                const updatedAccounts = JSON.parse(updatedRaw);
                return { success: true, accounts: updatedAccounts };
            } catch (err) {
                log.error('Failed to read updated accounts.json after refresh:', err.message);
                return { success: true };
            }
        } catch (error) {
            log.error('Error refreshing accounts:', error.message);
            return { error: error.message };
        }
    });

    // Client Management Handlers
    const clientExecutorHandler = require(path.join(__dirname, 'client-executor.js'));
    await clientExecutorHandler(deps);

    // Window Management Handlers
    ipcMain.handle('close-launcher', async () => {
        app.quit();
    });

    ipcMain.handle('minimize-window', async () => {
        const window = require('electron').BrowserWindow.getFocusedWindow();
        if (window) {
            window.minimize();
        }
    });

    // Utility Handlers
    ipcMain.handle('error-alert', async (message) => {
        dialog.showErrorBox('Error', message);
    });

    ipcMain.handle('log-error', async (message) => {
        log.error(message);
    });

    ipcMain.handle('open-location', async (locationPath) => {
        try {
            if (fs.existsSync(locationPath)) {
                shell.openPath(locationPath);
            } else {
                log.error(`Location does not exist: ${locationPath}`);
            }
        } catch (error) {
            log.error(`Error opening location: ${error.message}`);
        }
    });

    ipcMain.handle('open-external', async (event, url) => {
        try {
            await shell.openExternal(url);
            log.info(`Opened external URL: ${url}`);
        } catch (error) {
            log.error(`Error opening external URL: ${error.message}`);
        }
    });

    ipcMain.handle('get-bundled-client-path', async () => {
        try {
            // Check for bundled client in resources
            const resourcePath = process.resourcesPath;
            const bundledClientPath = path.join(resourcePath, 'BlessedScripts-2.1.25.jar');
            
            log.info(`Checking for bundled client at: ${bundledClientPath}`);
            log.info(`Resources path: ${resourcePath}`);
            
            if (fs.existsSync(bundledClientPath)) {
                log.info(`Found bundled client at: ${bundledClientPath}`);
                return bundledClientPath;
            }
            
            // Check alternative path
            const altPath = path.join(process.execPath, '..', 'resources', 'BlessedScripts-2.1.25.jar');
            log.info(`Checking alternative path: ${altPath}`);
            
            if (fs.existsSync(altPath)) {
                log.info(`Found bundled client at alternative path: ${altPath}`);
                return altPath;
            }
            
            log.info('No bundled client found');
            return null;
        } catch (error) {
            log.error(`Error checking bundled client path: ${error.message}`);
            return null;
        }
    });

    ipcMain.handle('get-dev-client-path', async () => {
        try {
            // Check for development client using dynamic path
            const userHome = process.env.USERPROFILE || process.env.HOME;
            const devClientPath = path.join(userHome, 'IdeaProjects', 'BlessedScripts-v2', 'runelite-client', 'build', 'libs', 'BlessedScripts-2.1.25.jar');
            
            if (fs.existsSync(devClientPath)) {
                log.info(`Found development client at: ${devClientPath}`);
                return devClientPath;
            }
            
            log.info('No development client found');
            return null;
        } catch (error) {
            log.error(`Error checking development client path: ${error.message}`);
            return null;
        }
    });

    ipcMain.handle('check-for-updates', async () => {
        try {
            const { BrowserWindow } = require('electron');
            const mainWindow = BrowserWindow.getAllWindows()[0];
            const Updater = require('./updater');
            const updater = new Updater(mainWindow);
            
            log.info('Manual update check requested');
            const result = await updater.checkForUpdatesManually();
            return result;
        } catch (error) {
            log.error(`Error checking for updates: ${error.message}`);
            return false;
        }
    });

    // Modal Management Handlers
    ipcMain.handle('show-loading-modal', async (event, message) => {
        try {
            const { BrowserWindow } = require('electron');
            const mainWindow = BrowserWindow.getAllWindows()[0];
            if (mainWindow) {
                mainWindow.webContents.send('show-loading-modal', message);
            }
        } catch (error) {
            log.error(`Error showing loading modal: ${error.message}`);
        }
    });

    ipcMain.handle('hide-loading-modal', async () => {
        try {
            const { BrowserWindow } = require('electron');
            const mainWindow = BrowserWindow.getAllWindows()[0];
            if (mainWindow) {
                mainWindow.webContents.send('hide-loading-modal');
            }
        } catch (error) {
            log.error(`Error hiding loading modal: ${error.message}`);
        }
    });

    // Enhanced browser installation with UI feedback
    ipcMain.handle('install-browsers-with-feedback', async () => {
        try {
            const { installPatchrightBrowsers } = require('./oauth-jagex');
            log.info('Starting browser installation with UI feedback...');
            const result = await installPatchrightBrowsers();
            return { success: true, result };
        } catch (error) {
            log.error(`Browser installation failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    });

    // Check if Patchright browsers are installed
    ipcMain.handle('check-patchright-browsers', async () => {
        try {
            const { checkPatchrightBrowsers } = require('./oauth-jagex');
            const result = await checkPatchrightBrowsers();
            return result;
        } catch (error) {
            log.error(`Error checking Patchright browsers: ${error.message}`);
            return false;
        }
    });
};
