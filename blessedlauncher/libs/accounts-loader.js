module.exports = async function (deps) {
    const { fs, path, blessedScriptsDir, ipcMain, log } = deps;

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
};
