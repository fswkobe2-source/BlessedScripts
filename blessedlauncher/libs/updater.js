const { autoUpdater } = require('electron-updater');
const { app, dialog, BrowserWindow } = require('electron');
const log = require('electron-log');
const axios = require('axios');
const path = require('path');

// Configure logging
log.transports.file.level = 'info';
autoUpdater.logger = log;

class Updater {
    constructor(mainWindow) {
        this.mainWindow = mainWindow;
        this.updateAvailable = false;
        this.userInitiated = false;
        
        // Configure updater settings
        autoUpdater.autoDownload = false;
        autoUpdater.autoInstallOnAppQuit = false;
        autoUpdater.checkForUpdatesAndNotify = false;
        
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        // When update is found
        autoUpdater.on('update-available', (info) => {
            log.info('Update available:', info);
            this.updateAvailable = true;
            this.showUpdateDialog(info);
        });

        // When no update is available
        autoUpdater.on('update-not-available', (info) => {
            log.info('Update not available:', info);
            this.updateAvailable = false;
        });

        // When update is downloaded
        autoUpdater.on('update-downloaded', (info) => {
            log.info('Update downloaded:', info);
            this.showRestartDialog();
        });

        // Error handling
        autoUpdater.on('error', (err) => {
            log.error('Update error:', err);
            // Fail silently - don't interrupt user experience
        });

        // Download progress
        autoUpdater.on('download-progress', (progressObj) => {
            let log_message = "Download speed: " + progressObj.bytesPerSecond;
            log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
            log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
            log.info(log_message);
        });
    }

    async checkForUpdates() {
        try {
            // First check GitHub releases manually for more control
            const currentVersion = app.getVersion();
            const githubRelease = await this.checkGitHubRelease(currentVersion);
            
            if (githubRelease && githubRelease.isNewer) {
                this.showUpdateDialog({
                    version: githubRelease.version,
                    releaseNotes: githubRelease.releaseNotes,
                    downloadUrl: githubRelease.downloadUrl
                });
                return true;
            }
            
            // Fallback to electron-updater
            await autoUpdater.checkForUpdates();
            return false;
        } catch (error) {
            log.error('Failed to check for updates:', error);
            return false;
        }
    }

    async checkGitHubRelease(currentVersion) {
        try {
            const response = await axios.get('https://api.github.com/repos/fswkobe2-source/BlessedScripts/releases/latest', {
                timeout: 5000,
                headers: {
                    'User-Agent': 'Blessed-Scripts-Launcher'
                }
            });

            const release = response.data;
            const latestVersion = release.tag_name.replace('v', '');
            
            log.info(`Current version: ${currentVersion}, Latest version: ${latestVersion}`);

            if (this.isVersionNewer(latestVersion, currentVersion)) {
                // Find Windows executable asset
                const asset = release.assets.find(asset => 
                    asset.name.endsWith('.exe') && asset.name.includes('Setup')
                );

                return {
                    isNewer: true,
                    version: latestVersion,
                    releaseNotes: release.body,
                    downloadUrl: asset ? asset.browser_download_url : null,
                    releaseDate: release.published_at
                };
            }

            return null;
        } catch (error) {
            log.error('GitHub check failed:', error.message);
            return null;
        }
    }

    isVersionNewer(latest, current) {
        const parseVersion = (version) => {
            return version.split('.').map(num => parseInt(num) || 0);
        };

        const latestParts = parseVersion(latest);
        const currentParts = parseVersion(current);

        for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
            const latestPart = latestParts[i] || 0;
            const currentPart = currentParts[i] || 0;

            if (latestPart > currentPart) return true;
            if (latestPart < currentPart) return false;
        }

        return false;
    }

    showUpdateDialog(updateInfo) {
        if (this.userInitiated) {
            // User manually checked for updates
            this.showManualUpdateDialog(updateInfo);
        } else {
            // Automatic check on startup
            this.showAutoUpdateDialog(updateInfo);
        }
    }

    showAutoUpdateDialog(updateInfo) {
        dialog.showMessageBox(this.mainWindow, {
            type: 'info',
            title: 'Update Available',
            message: 'A new update is available',
            detail: `Version ${updateInfo.version} is ready to install.\n\nCurrent version: ${app.getVersion()}\nNew version: ${updateInfo.version}`,
            buttons: ['Update Now', 'Later'],
            defaultId: 0,
            cancelId: 1
        }).then((result) => {
            if (result.response === 0) {
                // Update Now
                this.startUpdate(updateInfo);
            } else {
                // Later - continue normally
                log.info('User chose to update later');
            }
        });
    }

    showManualUpdateDialog(updateInfo) {
        const message = updateInfo.isNewer 
            ? `A new version is available!\n\nCurrent: ${app.getVersion()}\nLatest: ${updateInfo.version}`
            : `You're running the latest version!\n\nCurrent version: ${app.getVersion()}`;

        const buttons = updateInfo.isNewer 
            ? ['Update Now', 'Later'] 
            : ['OK'];

        dialog.showMessageBox(this.mainWindow, {
            type: updateInfo.isNewer ? 'info' : 'info',
            title: updateInfo.isNewer ? 'Update Available' : 'Up to Date',
            message: updateInfo.isNewer ? 'A new update is available' : 'You\'re up to date',
            detail: message,
            buttons: buttons,
            defaultId: 0
        }).then((result) => {
            if (result.response === 0 && updateInfo.isNewer) {
                // User chose to update - automatically download and install
                this.startUpdate(updateInfo);
            }
        });
    }

    async startUpdate(updateInfo) {
        try {
            if (updateInfo.downloadUrl) {
                // Direct download from GitHub
                await this.downloadAndInstall(updateInfo);
            } else {
                // Use electron-updater
                await autoUpdater.downloadUpdate();
            }
        } catch (error) {
            log.error('Failed to start update:', error);
            dialog.showMessageBox(this.mainWindow, {
                type: 'error',
                title: 'Update Failed',
                message: 'Failed to download update',
                detail: 'Please check your internet connection and try again later.',
                buttons: ['OK']
            });
        }
    }

    async downloadAndInstall(updateInfo) {
        const { shell } = require('electron');
        
        // Show progress dialog
        const progressWindow = new BrowserWindow({
            width: 400,
            height: 200,
            parent: this.mainWindow,
            modal: true,
            show: false,
            frame: false,
            alwaysOnTop: true
        });

        progressWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
            <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background: #1a1a1a; color: white; height: 100vh; display: flex; flex-direction: column; justify-content: center;">
                    <h2>Downloading Update...</h2>
                    <p>Version ${updateInfo.version}</p>
                    <div style="width: 80%; height: 20px; background: #333; border-radius: 10px; margin: 20px auto; overflow: hidden;">
                        <div id="progress" style="width: 0%; height: 100%; background: linear-gradient(90deg, #4a00e0, #8e2de2); transition: width 0.3s; border-radius: 10px;"></div>
                    </div>
                    <p id="status">Preparing download...</p>
                </body>
            </html>
        `));

        progressWindow.show();

        try {
            // For now, open the download page in browser
            // In a production environment, you'd want to implement proper download and extraction
            await shell.openExternal(updateInfo.downloadUrl);
            
            progressWindow.close();
            
            dialog.showMessageBox(this.mainWindow, {
                type: 'info',
                title: 'Update Downloaded',
                message: 'Update download started',
                detail: 'Please run the downloaded installer to complete the update.',
                buttons: ['OK']
            });
        } catch (error) {
            progressWindow.close();
            throw error;
        }
    }

    showRestartDialog() {
        dialog.showMessageBox(this.mainWindow, {
            type: 'info',
            title: 'Update Ready',
            message: 'Update downloaded successfully',
            detail: 'The launcher will restart to complete the update.',
            buttons: ['Restart Now', 'Later']
        }).then((result) => {
            if (result.response === 0) {
                autoUpdater.quitAndInstall();
            }
        });
    }

    // Manual check for updates (user initiated)
    async checkForUpdatesManually() {
        this.userInitiated = true;
        
        try {
            const result = await this.checkForUpdates();
            this.userInitiated = false;
            
            if (!result && !this.updateAvailable) {
                // No update found - show the specific message requested
                dialog.showMessageBox(this.mainWindow, {
                    type: 'info',
                    title: 'Up to Date',
                    message: 'You are up to date!',
                    detail: `Version ${app.getVersion()}`,
                    buttons: ['OK']
                });
            }
            
            return result;
        } catch (error) {
            this.userInitiated = false;
            log.error('Manual update check failed:', error);
            
            // Check if it's a network connectivity issue
            if (error.message && (
                error.message.includes('ENOTFOUND') || 
                error.message.includes('ECONNREFUSED') ||
                error.message.includes('network') ||
                error.message.includes('timeout') ||
                error.code === 'ENOTFOUND' ||
                error.code === 'ECONNREFUSED'
            )) {
                // Show the specific network error message requested
                dialog.showMessageBox(this.mainWindow, {
                    type: 'warning',
                    title: 'Connection Error',
                    message: 'Could not check for updates.',
                    detail: 'Please check your connection.',
                    buttons: ['OK']
                });
            } else {
                // Generic error
                dialog.showMessageBox(this.mainWindow, {
                    type: 'error',
                    title: 'Update Check Failed',
                    message: 'Failed to check for updates',
                    detail: error.message || 'An unknown error occurred',
                    buttons: ['OK']
                });
            }
            
            return false;
        }
    }
}

module.exports = Updater;
