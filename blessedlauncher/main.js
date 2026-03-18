const { app, BrowserWindow, dialog, shell, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const log = require('electron-log');
const { ipcMain } = require('electron');
const { spawn, execSync } = require('child_process');
const os = require('os');

// Import updater
const Updater = require('./libs/updater');

process.on('uncaughtException', (error) => {
    log.error('Uncaught Exception:', error);
});

let mainWindow = null;
let updater = null;

// Ensure .blessedscripts directory exists
const blessedScriptsDir = path.join(process.env.HOME || process.env.USERPROFILE, '.blessedscripts');
if (!fs.existsSync(blessedScriptsDir)) {
    fs.mkdirSync(blessedScriptsDir);
}

// Function to check if Java is installed
function checkJavaInstallation() {
    try {
        const javaVersion = execSync('java -version 2>&1', { 
            encoding: 'utf8',
            timeout: 10000 
        });
        
        if (javaVersion.includes('java version') || javaVersion.includes('openjdk')) {
            log.info(`Java is installed: ${javaVersion.split('\n')[0]}`);
            return true;
        }
        return false;
    } catch (error) {
        log.error('Java not found or not accessible:', error.message);
        return false;
    }
}

// Function to install Java silently (simplified - would need proper Java installer)
async function installJava() {
    log.info('Java not found, prompting user to install Java...');
    
    const result = await dialog.showMessageBox(mainWindow, {
        type: 'warning',
        title: 'Java Required',
        message: 'Java is required to run Blessed Scripts but was not found on your system.\n\nPlease install Java (JRE 8 or higher) from https://www.java.com/en/download/ and restart the launcher.',
        buttons: ['Download Java', 'Cancel'],
        defaultId: 0
    });
    
    if (result.response === 0) {
        await shell.openExternal('https://www.java.com/en/download/');
    }
    
    return result.response === 1;
}

// Function to check if Patchright browsers are installed
async function checkPatchrightBrowsers() {
    try {
        log.info('Checking for Patchright browsers...');
        const { chromium } = require('patchright');
        
        // Try to get executable path to verify browsers are installed
        const executablePath = chromium.executablePath();
        if (!executablePath) {
            log.error('Patchright executable path is null or undefined');
            return false;
        }
        
        // Check if the executable actually exists
        if (!fs.existsSync(executablePath)) {
            log.error(`Patchright executable not found at: ${executablePath}`);
            return false;
        }
        
        log.info(`Patchright browsers are installed at: ${executablePath}`);
        return true;
    } catch (error) {
        log.error('Patchright browsers not found:', error.message);
        log.error('Full error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        return false;
    }
}

// Function to install Patchright browsers
async function installPatchrightBrowsers() {
    return new Promise((resolve, reject) => {
        log.info('Installing Patchright browsers...');
        
        // Try different methods to install Patchright browsers
        const installMethods = [
            // Method 1: Use npx patchright install
            () => {
                return new Promise((resolveMethod, rejectMethod) => {
                    const npxProcess = spawn('npx', ['patchright', 'install'], {
                        stdio: ['pipe', 'pipe', 'pipe'],
                        shell: true,
                        cwd: __dirname
                    });

                    let stdout = '';
                    let stderr = '';

                    npxProcess.stdout.on('data', (data) => {
                        stdout += data.toString();
                        log.info(`[patchright-install] ${data.toString().trim()}`);
                    });

                    npxProcess.stderr.on('data', (data) => {
                        stderr += data.toString();
                        log.error(`[patchright-install] ${data.toString().trim()}`);
                    });

                    npxProcess.on('close', (code) => {
                        if (code === 0) {
                            log.info('Patchright browsers installed successfully via npx');
                            resolveMethod(true);
                        } else {
                            log.error(`Patchright installation via npx failed with code ${code}`);
                            rejectMethod(new Error(`npx install failed with code ${code}`));
                        }
                    });

                    npxProcess.on('error', (error) => {
                        log.error('Failed to start npx Patchright installation:', error.message);
                        rejectMethod(error);
                    });
                });
            },
            // Method 2: Try using node_modules/.bin/patchright directly
            () => {
                return new Promise((resolveMethod, rejectMethod) => {
                    const patchrightBin = path.join(__dirname, 'node_modules', '.bin', 'patchright');
                    const npxProcess = spawn(patchrightBin, ['install'], {
                        stdio: ['pipe', 'pipe', 'pipe'],
                        shell: true,
                        cwd: __dirname
                    });

                    let stdout = '';
                    let stderr = '';

                    npxProcess.stdout.on('data', (data) => {
                        stdout += data.toString();
                        log.info(`[patchright-install-local] ${data.toString().trim()}`);
                    });

                    npxProcess.stderr.on('data', (data) => {
                        stderr += data.toString();
                        log.error(`[patchright-install-local] ${data.toString().trim()}`);
                    });

                    npxProcess.on('close', (code) => {
                        if (code === 0) {
                            log.info('Patchright browsers installed successfully via local binary');
                            resolveMethod(true);
                        } else {
                            log.error(`Patchright installation via local binary failed with code ${code}`);
                            rejectMethod(new Error(`local binary install failed with code ${code}`));
                        }
                    });

                    npxProcess.on('error', (error) => {
                        log.error('Failed to start local Patchright installation:', error.message);
                        rejectMethod(error);
                    });
                });
            }
        ];

        // Try each installation method in sequence
        (async () => {
            for (const installMethod of installMethods) {
                try {
                    const result = await installMethod();
                    if (result) {
                        resolve(result);
                        return;
                    }
                } catch (error) {
                    log.warn(`Installation method failed: ${error.message}`);
                    continue;
                }
            }
            reject(new Error('All Patchright installation methods failed'));
        })();
    });
}

// Function to ensure Patchright browsers are available
async function ensurePatchrightBrowsers() {
    const browsersInstalled = await checkPatchrightBrowsers();
    if (!browsersInstalled) {
        // Show loading modal before installing
        showLoadingModal('Setting up browser for first time login... Please wait.');
        try {
            await installPatchrightBrowsers();
            log.info('Patchright browsers are now ready');
            hideLoadingModal();
        } catch (error) {
            log.error('Failed to install Patchright browsers:', error.message);
            hideLoadingModal();
            showErrorModal('Browser setup failed. Please run: npx patchright install chromium');
            // Don't throw - let the launcher continue but show error
        }
    }
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
            log.info('IPC handlers loaded successfully');
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
        width: 1400,
        height: 900,
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
        
        // Load scripts list from catalog and local files
        function loadScriptsList() {
            const scriptsList = document.getElementById('scripts-list');
            const loadingElement = document.getElementById('scripts-loading');
            const noScriptsElement = document.getElementById('no-scripts');
            
            // Show loading
            scriptsList.style.display = 'none';
            loadingElement.style.display = 'block';
            noScriptsElement.style.display = 'none';
            
            // Fetch scripts from catalog
            axios.get('https://raw.githubusercontent.com/fswkobe2-source/BlessedScripts/master/scripts/catalog.json')
                .then(response => {
                    const catalogScripts = response.data.scripts || [];
                    
                    // Scan local scripts folder for .jar and .ahk files
                    const localScripts = scanLocalScripts();
                    
                    // Combine catalog and local scripts
                    const allScripts = [...catalogScripts, ...localScripts];
                    
                    loadingElement.style.display = 'none';
                    
                    if (allScripts.length > 0) {
                        scriptsList.innerHTML = '';
                        allScripts.forEach(script => {
                            const scriptItem = document.createElement('div');
                            scriptItem.className = 'script-item';
                            
                            // Check if user owns script (simplified check)
                            const ownsScript = Math.random() > 0.5; // Random simulation - replace with actual ownership check
                            
                            // Create type badge
                            const typeBadge = script.type === 'ahk' 
                                ? '<span class="type-badge ahk">AHK</span>'
                                : '<span class="type-badge jar">BOT</span>';
                            
                            scriptItem.innerHTML = `
                                <div>
                                    <strong>${script.name}</strong>
                                    <span>${script.description}</span>
                                    <small>[${script.category}]</small>
                                    ${typeBadge}
                                    ${ownsScript ? '<span class="owned-badge">Added ✓</span>' : '<span class="price-badge">$' + script.price + '</span>'}
                                </div>
                                <div>
                                    ${ownsScript 
                                        ? '<button class="btn btn-primary" onclick="addToClient(\'' + script.id + '\')">Add to Client</button>'
                                        : '<button class="btn btn-secondary" onclick="buyScript(\'' + script.downloadUrl + '\')">Buy</button>'}
                                    <button class="btn btn-danger" onclick="deleteScript(\'' + script.name + '\')">🗑</button>
                                </div>
                            `;
                            scriptsList.appendChild(scriptItem);
                        });
                    } else {
                        loadingElement.style.display = 'none';
                        noScriptsElement.style.display = 'block';
                        noScriptsElement.innerHTML = '<p>No scripts found</p>';
                    }
                })
                .catch(error => {
                    console.error('Failed to load scripts:', error);
                    loadingElement.style.display = 'none';
                    noScriptsElement.style.display = 'block';
                    noScriptsElement.innerHTML = '<p>Failed to load scripts catalog</p>';
                });
        }
        
        // Scan local scripts folder
        function scanLocalScripts() {
            const scriptsPath = path.join(process.env.HOME || process.env.USERPROFILE, '.blessedscripts', 'scripts');
            
            if (!fs.existsSync(scriptsPath)) {
                return [];
            }
            
            try {
                const files = fs.readdirSync(scriptsPath);
                const scripts = [];
                
                files.forEach(file => {
                    const filePath = path.join(scriptsPath, file);
                    const stat = fs.statSync(filePath);
                    
                    if (stat.isFile()) {
                        const ext = path.extname(file).toLowerCase();
                        if (ext === '.jar' || ext === '.ahk') {
                            const script = {
                                id: 'local-' + file.replace(ext, ''),
                                name: file.replace(ext, ''),
                                type: ext === '.ahk' ? 'ahk' : 'jar',
                                description: ext === '.ahk' ? 'Local AHK script' : 'Local bot script',
                                category: 'Misc',
                                price: 0,
                                version: '1.0.0',
                                downloadUrl: '',
                                imageUrl: ''
                            };
                            scripts.push(script);
                        }
                    }
                });
                
                return scripts;
            } catch (error) {
                console.error('Failed to scan local scripts:', error);
                return [];
            }
        }

        // Script actions
        function runScript(scriptName) {
            alert(`Running script: ${scriptName}\n\nScript runner will be implemented in next version!`);
        }

        function deleteScript(scriptName) {
            if (confirm(`Delete script '${scriptName}'?`)) {
                alert(`Script deleted: ${scriptName}\n\nDelete functionality will be implemented in next version!`);
                loadScriptsList();
            }
        }
        
        function addToClient(scriptId) {
            alert(`Adding script ${scriptId} to client...\n\nThis will download and install the script to ${path.join(process.env.HOME || process.env.USERPROFILE, '.blessedscripts', 'scripts')}`);
        }
        
        function buyScript(downloadUrl) {
            // Open website in browser for script purchase
            require('electron').shell.openExternal(downloadUrl);
        }
        
        function openScriptsFolder() {
            const scriptsPath = path.join(process.env.HOME || process.env.USERPROFILE, '.blessedscripts', 'scripts');
            require('electron').shell.showItemInFolder(scriptsPath);
        }
        
        // Modal functions
        function showLoadingModal(message) {
            const modal = document.getElementById('loading-modal');
            const messageElement = document.getElementById('loading-message');
            messageElement.textContent = message;
            modal.classList.add('show');
        }
        
        function hideLoadingModal() {
            const modal = document.getElementById('loading-modal');
            modal.classList.remove('show');
        }
        
        function showErrorModal(message) {
            const modal = document.getElementById('confirm-dialog');
            const titleElement = modal.querySelector('.confirm-title');
            const messageElement = modal.querySelector('.confirm-message');
            const buttonsElement = modal.querySelector('.confirm-buttons');
            
            titleElement.textContent = 'Error';
            messageElement.textContent = message;
            buttonsElement.innerHTML = '<button class="btn-cancel" onclick="hideErrorModal()">OK</button>';
            modal.classList.add('show');
        }
        
        function hideErrorModal() {
            const modal = document.getElementById('confirm-dialog');
            modal.classList.remove('show');
        }
        
        // Script Key Redemption Modal
        function showRedeemKeyModal() {
            const modal = document.getElementById('confirm-dialog');
            const titleElement = modal.querySelector('.confirm-title');
            const messageElement = modal.querySelector('.confirm-message');
            const buttonsElement = modal.querySelector('.confirm-buttons');
            
            titleElement.textContent = 'Activate Script';
            messageElement.innerHTML = 'Enter your script key:<input type="text" id="script-key" placeholder="XXXX-XXXX-XXXX-XXXX" style="width: 100%; padding: 0.75rem; margin: 1rem 0; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; color: white; font-size: 1rem;"><br><small style="color: rgba(255, 255, 255, 0.6);">Script keys are provided after purchase on our Discord: discord.gg/SjSukZkfxh</small>';
            buttonsElement.innerHTML = '<button class="btn btn-primary" onclick="redeemScriptKey()" style="background: linear-gradient(135deg, #9333ea 0%, #722f91 100%);">Activate</button><button class="btn-cancel" onclick="hideRedeemKeyModal()">Cancel</button>';
            modal.classList.add('show');
        }
        
        function hideRedeemKeyModal() {
            const modal = document.getElementById('confirm-dialog');
            modal.classList.remove('show');
        }
        
        async function redeemScriptKey() {
            const keyInput = document.getElementById('script-key');
            const scriptKey = keyInput.value.trim();
            
            if (!scriptKey) {
                showErrorModal('Please enter a valid script key.');
                return;
            }
            
            try {
                showLoadingModal('Activating script...');
                
                const response = await axios.post('https://blessedscripts.com/api/scripts/redeem', {
                    key: scriptKey
                });
                
                hideLoadingModal();
                
                if (response.data && response.data.success) {
                    const script = response.data.script;
                    
                    // Download and install script
                    const scriptPath = path.join(process.env.HOME || process.env.USERPROFILE, '.blessedscripts', 'scripts', script.id + '.jar');
                    
                    // For now, show success message (in real implementation, would download here)
                    alert(`Script activated! ${script.name} has been added to your client.`);
                    
                    // Refresh scripts list
                    loadScriptsList();
                    hideRedeemKeyModal();
                } else {
                    showErrorModal('Invalid or already used key. Contact support on Discord.');
                }
            } catch (error) {
                hideLoadingModal();
                showErrorModal('Failed to activate script. Please try again.');
            }
        }
        
        // Jagex Authentication Handler
        async function authenticateJagexAccount() {
            try {
                showLoadingModal('Setting up browser for first time login... Please wait, this may take 1-2 minutes.');
                
                const result = await window.electronAPI.invoke('start-auth-flow');
                
                hideLoadingModal();
                
                if (result && result.error) {
                    // Show error modal with try again button
                    const modal = document.getElementById('confirm-dialog');
                    const titleElement = modal.querySelector('.confirm-title');
                    const messageElement = modal.querySelector('.confirm-message');
                    const buttonsElement = modal.querySelector('.confirm-buttons');
                    
                    titleElement.textContent = 'Authentication Failed';
                    messageElement.textContent = result.error;
                    buttonsElement.innerHTML = '<button class="btn btn-primary" onclick="authenticateJagexAccount()">Try Again</button><button class="btn-cancel" onclick="hideErrorModal()">Cancel</button>';
                    modal.classList.add('show');
                } else {
                    // Success - refresh accounts list
                    loadAccounts();
                    alert('Jagex account authenticated successfully!');
                }
            } catch (error) {
                hideLoadingModal();
                showErrorModal('Failed to start authentication. Please try again.');
            }
        }
        
        // Account Management System
let accounts = [];
let selectedAccount = null;

// Load accounts from storage
function loadAccounts() {
    const accountList = document.getElementById('account-list');
    const loadingElement = document.getElementById('accounts-loading');
    const noAccountsElement = document.getElementById('no-accounts');
    
    // Check if elements exist before accessing them
    if (!accountList || !loadingElement || !noAccountsElement) {
        console.error('Account loading elements not found in DOM');
        return;
    }
    
    // Show loading
    accountList.style.display = 'none';
    loadingElement.style.display = 'block';
    noAccountsElement.style.display = 'none';
    
    try {
        const accountsPath = path.join(process.env.HOME || process.env.USERPROFILE, '.blessedscripts', 'accounts.json');
        console.log('Loading accounts from:', accountsPath);
        
        if (fs.existsSync(accountsPath)) {
            const accountsData = fs.readFileSync(accountsPath, 'utf8');
            accounts = JSON.parse(accountsData);
            console.log('Parsed accounts:', accounts);
        } else {
            console.log('Accounts file does not exist');
            accounts = [];
        }
        
        const statusEl = document.getElementById('status-message');
        if (statusEl) {
            statusEl.textContent = 'Accounts loaded successfully';
            statusEl.className = 'status success';
            statusEl.classList.remove('hidden');
        }
        
        const loadingEl = document.getElementById('accounts-loading');
        const noAccountsEl = document.getElementById('no-accounts');
        if (loadingEl) {
            loadingEl.classList.add('hidden');
        }
        if (noAccountsEl) {
            noAccountsEl.classList.add('hidden');
        }
        
        if (accounts.length === 0) {
            if (noAccountsEl) {
                noAccountsEl.classList.remove('hidden');
            }
            return;
        }
        
        // Update UI
        accountList.innerHTML = '';
        if (accountList) {
            accountList.style.display = 'block';
            
            accounts.forEach((account, index) => {
                const accountItem = document.createElement('div');
                if (accountItem) {
                    accountItem.className = 'account-item';
                    if (selectedAccount && selectedAccount.id === account.id) {
                        accountItem.classList.add('selected');
                    }
                    
                    // Use multiple possible fields for display name
                    const displayName = account.displayName || account.username || account.name || account.accountId || 'Unknown Account';
                    const accountId = account.accountId || account.id || 'Unknown ID';
                    
                    accountItem.innerHTML = `
                        <div onclick="selectAccount('${account.id}')" style="flex: 1; cursor: pointer;">
                            <div class="account-name">${displayName}</div>
                            <div class="account-id">${accountId}</div>
                        </div>
                        <button class="btn btn-danger" onclick="showRemoveAccountConfirmation('${account.id}', '${displayName}')" style="margin-left: 1rem;">🗑</button>
                    `;
                    accountList.appendChild(accountItem);
                }
            });
        }
        
        // Update UI selection
        const selectedItem = document.querySelector(`[data-account-id="${selectedAccount && selectedAccount.id}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }
        
        updateSelectedAccountDisplay();
    } catch (error) {
        console.error('Failed to load accounts:', error);
        const statusEl = document.getElementById('status-message');
        if (statusEl) {
            statusEl.textContent = 'Failed to load accounts';
            statusEl.className = 'status error';
            statusEl.classList.remove('hidden');
        }
        loadingElement.style.display = 'none';
        noAccountsElement.style.display = 'block';
        accountList.style.display = 'none';
    }
}

// Save accounts to storage
function saveAccounts() {
    try {
        const accountsPath = path.join(process.env.HOME || process.env.USERPROFILE, '.blessedscripts', 'accounts.json');
        const accountsData = JSON.stringify(accounts, null, 2);
        fs.writeFileSync(accountsPath, accountsData, 'utf8');
    } catch (error) {
        console.error('Failed to save accounts:', error);
    }
}

// Select account
function selectAccount(accountId) {
    selectedAccount = accounts.find(acc => acc.id === accountId);
    updateSelectedAccountDisplay();
    
    // Update UI selection
    document.querySelectorAll('.account-item').forEach(item => {
        item.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
}

// Update selected account display
function updateSelectedAccountDisplay() {
    const selectedAccountInput = document.getElementById('selected-account');
    const launchBtn = document.getElementById('launch-btn');
    
    // Check if elements exist before accessing them
    if (!selectedAccountInput || !launchBtn) {
        console.error('Selected account display elements not found in DOM');
        return;
    }
    
    if (selectedAccount) {
        selectedAccountInput.value = selectedAccount.displayName || selectedAccount.username;
        launchBtn.disabled = false;
    } else {
        selectedAccountInput.value = '';
        launchBtn.disabled = true;
    }
}

// Remove All confirmation functions
function showRemoveAllConfirmation() {
    const modal = document.getElementById('confirm-dialog');
    const titleElement = modal.querySelector('.confirm-title');
    const messageElement = modal.querySelector('.confirm-message');
    const buttonsElement = modal.querySelector('.confirm-buttons');
    
    titleElement.textContent = 'Remove All Accounts';
    messageElement.textContent = 'Are you sure you want to remove ALL accounts? This cannot be undone.';
    buttonsElement.innerHTML = '<button class="btn-confirm-danger" onclick="confirmRemoveAll()">Yes, Remove All</button><button class="btn-cancel" onclick="cancelRemoveAll()">Cancel</button>';
    modal.classList.add('show');
}

function confirmRemoveAll() {
    // Clear accounts array
    accounts = [];
    selectedAccount = null;
    
    // Save to storage
    saveAccounts();
    
    // Refresh UI immediately
    loadAccounts();
    hideRemoveAllModal();
}

function cancelRemoveAll() {
    hideRemoveAllModal();
}

function hideRemoveAllModal() {
    const modal = document.getElementById('confirm-dialog');
    modal.classList.remove('show');
}

// Individual account removal
function showRemoveAccountConfirmation(accountId, accountName) {
    const modal = document.getElementById('confirm-dialog');
    const titleElement = modal.querySelector('.confirm-title');
    const messageElement = modal.querySelector('.confirm-message');
    const buttonsElement = modal.querySelector('.confirm-buttons');
    
    titleElement.textContent = 'Remove Account';
    messageElement.textContent = `Remove ${accountName} from the launcher?`;
    buttonsElement.innerHTML = `<button class="btn-confirm-danger" onclick="confirmRemoveAccount('${accountId}')">Yes, Remove</button><button class="btn-cancel" onclick="cancelRemoveAccount()">Cancel</button>`;
    modal.classList.add('show');
}

function confirmRemoveAccount(accountId) {
    // Remove account from array
    accounts = accounts.filter(acc => acc.id !== accountId);
    
    // If removed account was selected, clear selection
    if (selectedAccount && selectedAccount.id === accountId) {
        selectedAccount = null;
    }
    
    // Save to storage
    saveAccounts();
    
    // Refresh UI immediately
    loadAccounts();
    hideRemoveAccountModal();
}

function cancelRemoveAccount() {
    hideRemoveAccountModal();
}

function hideRemoveAccountModal() {
    const modal = document.getElementById('confirm-dialog');
    modal.classList.remove('show');
}

// Refresh accounts
function refreshAccounts() {
    loadAccounts();
}
        
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
    
    // Check system requirements first
    log.info('Checking system requirements...');
    const javaInstalled = checkJavaInstallation();
    if (!javaInstalled) {
        log.error('Java not found - user needs to install Java');
        const javaResult = await installJava();
        if (!javaResult) {
            log.error('User cancelled Java installation');
            app.quit();
            return;
        }
    }
    
    console.log('Creating window...');
    // Create window first
    await createWindow();
    console.log('Window creation completed');
    
    console.log('Loading libraries...');
    // Then load IPC handlers with the window available
    await loadLibraries();
    console.log('Libraries loaded successfully');
    
    console.log('Ensuring Patchright browsers are installed...');
    // Finally, ensure Patchright browsers are available
    await ensurePatchrightBrowsers();
    console.log('Patchright browser check completed');
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
