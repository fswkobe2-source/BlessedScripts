let accounts = [];
let selectedAccount = null;
let clientPath = '';
let clientFound = false;

function $(id) {
    return document.getElementById(id);
}

function showStatus(message, type = 'info') {
    const statusEl = $('status-message');
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
    statusEl.classList.remove('hidden');
    
    setTimeout(() => {
        statusEl.classList.add('hidden');
    }, 5000);
}

function updateClientStatus(status, found = false) {
    const clientStatusEl = $('client-status');
    const clientInfoEl = $('client-info');
    
    clientStatusEl.textContent = status;
    clientFound = found;
    
    if (found) {
        clientInfoEl.style.borderColor = '#238636';
        clientInfoEl.style.color = '#e6edf3';
        $('launch-btn').disabled = !selectedAccount;
    } else {
        clientInfoEl.style.borderColor = '#30363d';
        clientInfoEl.style.color = '#8b949e';
        $('launch-btn').disabled = true;
    }
}

async function findBlessedScriptsClient() {
    console.log('findBlessedScriptsClient() called');
    updateClientStatus('Checking for BlessedScripts client...');
    
    // Check for bundled client via electron API first
    try {
        console.log('Checking for bundled client...');
        const bundledClientPath = await window.electron.getBundledClientPath();
        console.log('Bundled client path result:', bundledClientPath);
        if (bundledClientPath) {
            clientPath = bundledClientPath;
            updateClientStatus(`Found: BlessedScripts-2.1.25.jar (bundled)`, true);
            console.log('Found bundled client at:', bundledClientPath);
            return;
        }
    } catch (error) {
        console.error('Error checking bundled client:', error);
    }
    
    // Check for development client
    try {
        console.log('Checking for development client...');
        const devClientPath = await window.electron.getDevClientPath();
        console.log('Dev client path result:', devClientPath);
        if (devClientPath) {
            clientPath = devClientPath;
            updateClientStatus(`Found: BlessedScripts-2.1.25.jar (development)`, true);
            console.log('Found development client at:', devClientPath);
            return;
        }
    } catch (error) {
        console.error('Error checking development client:', error);
    }
    
    console.log('No client found, showing not found message');
    updateClientStatus('BlessedScripts client not found. Please ensure the client is built and bundled correctly.');
}

function updateAccountList() {
    const accountListEl = $('account-list');
    const loadingEl = $('accounts-loading');
    const noAccountsEl = $('no-accounts');
    
    if (loadingEl) {
        loadingEl.classList.add('hidden');
    }
    if (noAccountsEl) {
        noAccountsEl.classList.add('hidden');
    }
    
    // Update the dropdown in the main panel
    const selectedAccountEl = $('selected-account');
    if (selectedAccountEl) {
        selectedAccountEl.innerHTML = '<option value="">No account selected</option>';
        
        accounts.forEach(account => {
            const option = document.createElement('option');
            option.value = account.accountId;
            option.textContent = account.displayName || account.accountId;
            if (selectedAccount && selectedAccount.accountId === account.accountId) {
                option.selected = true;
            }
            selectedAccountEl.appendChild(option);
        });
    }
    
    if (accounts.length === 0) {
        if (noAccountsEl) {
            noAccountsEl.classList.remove('hidden');
        }
        return;
    }
    
    const accountsHtml = accounts.map(account => `
        <div class="account-item ${selectedAccount?.accountId === account.accountId ? 'selected' : ''}" 
             onclick="selectAccount('${account.accountId}')"
             data-account-id="${account.accountId}">
            <div class="account-name">${account.displayName || account.accountId}</div>
            <div class="account-id">${account.accountId}</div>
        </div>
    `).join('');
    
    if (accountListEl) {
        accountListEl.innerHTML = accountsHtml;
    }
}

function selectAccount(accountId) {
    selectedAccount = accounts.find(acc => acc.accountId === accountId);
    
    // Update UI selection
    const allAccountItems = document.querySelectorAll('.account-item');
    if (allAccountItems) {
        allAccountItems.forEach(item => {
            if (item) {
                item.classList.remove('selected');
            }
        });
    }
    
    const selectedItem = document.querySelector(`[data-account-id="${accountId}"]`);
    if (selectedItem) {
        selectedItem.classList.add('selected');
    }
    
    // Update the dropdown selection
    const selectedAccountEl = $('selected-account');
    if (selectedAccountEl) {
        selectedAccountEl.value = accountId || '';
    }
    
    // Update launch button
    const launchBtn = $('launch-btn');
    if (launchBtn) {
        launchBtn.disabled = !selectedAccount || !clientFound;
    }
}

async function loadAccounts() {
    try {
        const result = await window.electron.readAccounts();
        if (Array.isArray(result)) {
            accounts = result;
        } else if (result.error) {
            showStatus(`Error loading accounts: ${result.error}`, 'error');
        }
        updateAccountList();
    } catch (error) {
        showStatus(`Error loading accounts: ${error.message}`, 'error');
    }
}

async function startAuthFlow() {
    showStatus('Checking browser availability...', 'info');
    
    try {
        // First check if browsers are installed via IPC
        const browsersInstalled = await window.electron.checkPatchrightBrowsers();
        
        if (!browsersInstalled) {
            // Show loading modal and install browsers
            await window.electron.showLoadingModal('Setting up browser for first time login... Please wait, this may take a minute.');
            
            try {
                const installResult = await window.electron.installBrowsersWithFeedback();
                await window.electron.hideLoadingModal();
                
                if (!installResult.success) {
                    showStatus(`Browser setup failed. Please run: npx patchright install chromium in your terminal and try again.`, 'error');
                    return;
                }
                
                showStatus('Browser setup complete! Starting authentication...', 'success');
            } catch (installError) {
                await window.electron.hideLoadingModal();
                showStatus(`Browser setup failed. Please run: npx patchright install chromium in your terminal and try again.`, 'error');
                return;
            }
        }
        
        showStatus('Starting authentication...', 'info');
        
        const result = await window.electron.startAuthFlow();
        if (result.error) {
            showStatus(`Authentication failed: ${result.error}`, 'error');
        } else {
            showStatus('Authentication successful! Loading accounts...', 'success');
            // Wait a moment for the accounts file to be updated
            setTimeout(loadAccounts, 2000);
        }
    } catch (error) {
        showStatus(`Authentication failed: ${error.message}`, 'error');
    }
}

async function refreshAccounts() {
    showStatus('Refreshing accounts...', 'info');
    await loadAccounts();
}

async function removeAllAccounts() {
    showConfirmDialog();
}

async function performRemoveAll() {
    try {
        const result = await window.electron.removeAccounts();
        if (result.error) {
            showStatus(`Error removing accounts: ${result.error}`, 'error');
        } else {
            showStatus('All accounts removed successfully', 'success');
            // Immediately update the UI
            accounts = [];
            selectedAccount = null;
            updateAccountList();
            $('selected-account').value = '';
            $('launch-btn').disabled = true;
        }
    } catch (error) {
        showStatus(`Error removing accounts: ${error.message}`, 'error');
    }
}

async function launchClient() {
    if (!selectedAccount) {
        showStatus('Please select a Jagex account', 'error');
        return;
    }
    
    if (!clientFound || !clientPath) {
        showStatus('BlessedScripts client not found. Please build the project first.', 'error');
        return;
    }
    
    const ramPreference = $('ram-allocation').value;
    
    showStatus(`Launching Blessed Scripts with ${selectedAccount.displayName}...`, 'info');
    $('launch-btn').disabled = true;
    
    try {
        console.log('Attempting to launch client with:', {
            account: selectedAccount.displayName,
            clientPath: clientPath,
            ramPreference: ramPreference,
            sessionId: selectedAccount.sessionId
        });
        
        const result = await window.electron.openClient(selectedAccount, clientPath, ramPreference);
        if (result.error) {
            showStatus(`Launch failed: ${result.error}`, 'error');
            console.error('Launch failed:', result.error);
        } else {
            showStatus(`Blessed Scripts launched successfully! PID: ${result.pid}`, 'success');
            console.log('Launch successful:', result);
            // Keep launcher open - don't auto-close
        }
    } catch (error) {
        showStatus(`Launch failed: ${error.message}`, 'error');
        console.error('Launch error:', error);
    } finally {
        $('launch-btn').disabled = false;
    }
}

// Open Discord link
function openDiscord() {
    try {
        window.electron.openExternal('https://discord.gg/SjSukZkfxh');
    } catch (error) {
        console.error('Failed to open Discord link:', error);
    }
}

// Check for updates
async function checkForUpdates() {
    const updateBtn = document.querySelector('#update-btn');
    const originalText = updateBtn.innerHTML;
    
    try {
        // Show checking state
        updateBtn.innerHTML = '⏳ Checking for updates...';
        updateBtn.classList.add('checking');
        updateBtn.style.pointerEvents = 'none';
        
        const result = await window.electron.checkForUpdates();
        
        // Reset button state
        updateBtn.innerHTML = originalText;
        updateBtn.classList.remove('checking');
        updateBtn.style.pointerEvents = 'auto';
        
        // The update dialog will be handled by the main process
        // If we get here, it means no update was found or there was an error
        if (result === false) {
            // No update found case is handled by the main process dialog
            console.log('Update check completed');
        }
    } catch (error) {
        console.error('Failed to check for updates:', error);
        
        // Reset button state
        updateBtn.innerHTML = originalText;
        updateBtn.classList.remove('checking');
        updateBtn.style.pointerEvents = 'auto';
        
        // Check if it's a network error
        if (error.message && error.message.includes('network') || 
            error.message && error.message.includes('ENOTFOUND') ||
            error.message && error.message.includes('ECONNREFUSED')) {
            showStatus('Could not check for updates. Please check your connection.', 'error');
        } else {
            showStatus('Failed to check for updates. Please try again.', 'error');
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded fired');
    
    // Wait for IPC handlers to be ready before loading accounts
    setTimeout(() => {
        console.log('Loading accounts after delay...');
        loadAccounts();
    }, 1000);
    
    // Call client detection immediately and also after delay
    console.log('Calling findBlessedScriptsClient immediately...');
    findBlessedScriptsClient();
    
    // Also try after a delay in case there are timing issues
    setTimeout(() => {
        console.log('Calling findBlessedScriptsClient after delay...');
        findBlessedScriptsClient();
    }, 2000);
    
    showTab('scripts'); // Show scripts tab by default
    
    // Set up modal listeners
    window.electron.ipcRenderer.receive('show-loading-modal', (event, message) => {
        showLoadingModal(message);
    });
    
    window.electron.ipcRenderer.receive('hide-loading-modal', () => {
        hideLoadingModal();
    });
});

// Modal functions
function showLoadingModal(message) {
    const modal = document.getElementById('loading-modal');
    const messageEl = document.getElementById('loading-message');
    messageEl.textContent = message;
    modal.classList.add('show');
}

function hideLoadingModal() {
    const modal = document.getElementById('loading-modal');
    modal.classList.remove('show');
}

function showConfirmDialog() {
    const dialog = document.getElementById('confirm-dialog');
    dialog.classList.add('show');
}

function hideConfirmDialog() {
    const dialog = document.getElementById('confirm-dialog');
    dialog.classList.remove('show');
}

function confirmRemoveAll() {
    hideConfirmDialog();
    performRemoveAll();
}

function cancelRemoveAll() {
    hideConfirmDialog();
}
