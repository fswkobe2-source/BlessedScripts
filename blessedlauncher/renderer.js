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
    updateClientStatus('Checking for BlessedScripts client...');
    
    // Check for bundled client via electron API first
    try {
        console.log('Checking for bundled client...');
        const bundledClientPath = await window.electron.getBundledClientPath();
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
        if (devClientPath) {
            clientPath = devClientPath;
            updateClientStatus(`Found: BlessedScripts-2.1.25.jar (development)`, true);
            console.log('Found development client at:', devClientPath);
            return;
        }
    } catch (error) {
        console.error('Error checking development client:', error);
    }
    
    updateClientStatus('BlessedScripts client not found. Please ensure the client is built and bundled correctly.');
}

function updateAccountList() {
    const accountListEl = $('account-list');
    const loadingEl = $('accounts-loading');
    const noAccountsEl = $('no-accounts');
    
    loadingEl.classList.add('hidden');
    noAccountsEl.classList.add('hidden');
    
    if (accounts.length === 0) {
        noAccountsEl.classList.remove('hidden');
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
    
    accountListEl.innerHTML = accountsHtml;
}

function selectAccount(accountId) {
    selectedAccount = accounts.find(acc => acc.accountId === accountId);
    
    // Update UI selection
    document.querySelectorAll('.account-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    const selectedItem = document.querySelector(`[data-account-id="${accountId}"]`);
    if (selectedItem) {
        selectedItem.classList.add('selected');
    }
    
    // Update selected account display
    const selectedAccountEl = $('selected-account');
    if (selectedAccount) {
        selectedAccountEl.value = selectedAccount.displayName || selectedAccount.accountId;
        // Only enable launch if both account and client are ready
        $('launch-btn').disabled = !clientFound;
    } else {
        selectedAccountEl.value = '';
        $('launch-btn').disabled = true;
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
    showStatus('Starting authentication...', 'info');
    
    try {
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
    if (!confirm('Are you sure you want to remove all Jagex accounts?')) {
        return;
    }
    
    try {
        const result = await window.electron.removeAccounts();
        if (result.error) {
            showStatus(`Error removing accounts: ${result.error}`, 'error');
        } else {
            showStatus('All accounts removed successfully', 'success');
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
    console.log('Discord button clicked!');
    try {
        window.electron.openExternal('https://discord.gg/SjSukZkfxh');
        console.log('Discord link opened successfully');
    } catch (error) {
        console.error('Failed to open Discord link:', error);
    }
}

// Check for updates
async function checkForUpdates() {
    console.log('Update button clicked!');
    const updateBtn = $('update-btn');
    const originalText = updateBtn.innerHTML;
    
    try {
        // Show checking state
        updateBtn.innerHTML = '⏳ Checking for updates...';
        updateBtn.classList.add('checking');
        updateBtn.style.pointerEvents = 'none';
        
        console.log('Starting update check...');
        const result = await window.electron.checkForUpdates();
        console.log('Update check result:', result);
        
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
    loadAccounts();
    findBlessedScriptsClient();
});
