const { chromium } = require('patchright');
const { execSync } = require('child_process');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const { execSync } = require('child_process');
const log = require('electron-log');

const userHome = process.env.HOME || process.env.USERPROFILE;
const ACCOUNTS_DIR = path.join(userHome, '.blessedscripts');
const ACCOUNTS_FILE_PATH = path.join(ACCOUNTS_DIR, 'accounts.json');

// Function to check if Patchright browsers are installed
async function checkPatchrightBrowsers() {
    try {
        const { chromium } = require('patchright');
        // Try to get the executable path to verify browsers are installed
        const executablePath = chromium.executablePath();
        log.info('Patchright browsers are installed');
        return true;
    } catch (error) {
        log.error('Patchright browsers not found:', error.message);
        return false;
    }
}

// Function to install Patchright browsers synchronously
async function installPatchrightBrowsersSync() {
    return new Promise((resolve, reject) => {
        log.info('Installing Patchright browsers synchronously...');
        
        const { spawn } = require('child_process');
        
        const npxProcess = spawn('npx', ['patchright', 'install', 'chromium'], {
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
                log.info('Patchright browsers installed successfully');
                resolve(true);
            } else {
                log.error(`Patchright installation failed with code ${code}`);
                reject(new Error(`Patchright installation failed with code ${code}`));
            }
        });

        npxProcess.on('error', (error) => {
            log.error('Failed to start Patchright installation:', error.message);
            reject(error);
        });
    });
}

// Function to ensure Patchright browsers are available with synchronous install
async function ensurePatchrightBrowsersSync() {
    const browsersInstalled = await checkPatchrightBrowsers();
    if (!browsersInstalled) {
        log.info('Patchright browsers not found, installing synchronously...');
        await installPatchrightBrowsersSync();
        
        // Verify installation was successful
        const verifyInstalled = await checkPatchrightBrowsers();
        if (!verifyInstalled) {
            throw new Error('Patchright installation failed. Please run: npx patchright install chromium');
        }
        
        log.info('Patchright browsers are now ready');
    }
}

// Function to install Patchright browsers
async function installPatchrightBrowsers() {
    return new Promise((resolve, reject) => {
        log.info('Installing Patchright browsers...');
        
        const { spawn } = require('child_process');
        
        // Try different methods to install Patchright browsers
        const installMethods = [
            // Method 1: Use npx patchright install chromium
            () => {
                return new Promise((resolveMethod, rejectMethod) => {
                    const npxProcess = spawn('npx', ['patchright', 'install', 'chromium'], {
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
                    const patchrightBin = path.join(__dirname, '..', 'node_modules', '.bin', 'patchright');
                    const npxProcess = spawn(patchrightBin, ['install', 'chromium'], {
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

const state = generateRandomState(8);
const codeVerifier = generateCodeVerifier(45);
const codeChallenge = getCodeChallenge(codeVerifier);

const AUTH_COMPLETE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>Blessed Scripts - Authentication Complete</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
        html, body {
            height: 100%;
            margin: 0;
            font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
            background: #0d1117;
            color: #e6edf3;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            text-align: center;
            max-width: 760px;
            padding: 2rem;
        }
        h1 {
            font-size: 2.4rem;
            margin: 0 0 1rem;
            letter-spacing: 0.5px;
            color: #2f81f7;
        }
        p {
            font-size: 1.15rem;
            margin: 0;
            opacity: 0.85;
        }
        .spinner {
            width: 54px;
            height: 54px;
            border: 6px solid #2d333b;
            border-top-color: #2f81f7;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 2.25rem auto 0;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .fade-in {
            animation: fade 0.6s ease-in-out;
        }
        @keyframes fade {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body>
    <div class="container fade-in">
        <h1>Blessed Scripts</h1>
        <p>Authentication complete! Returning to launcher...</p>
        <div class="spinner" aria-hidden="true"></div>
    </div>
</body>
</html>`;

function generateCodeVerifier(length) {
    // Generate exactly 128 characters for the code verifier
    let verifier = crypto.randomBytes(length).toString('base64url');
    
    // Ensure it's exactly 128 characters (not bytes)
    if (verifier.length > 128) {
        verifier = verifier.substring(0, 128);
    } else if (verifier.length < 128) {
        // Pad with random characters if needed
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        while (verifier.length < 128) {
            verifier += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    }
    
    log.info('Generated code verifier length:', verifier.length);
    return verifier;
}

function getCodeChallenge(verifier) {
    return crypto.createHash('sha256').update(verifier).digest('base64url');
}

function generateRandomState(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function extractIdTokenFromUrl(url) {
    try {
        const urlObject = new URL(url);
        const fragment = urlObject.hash.substring(1);
        if (fragment) {
            const params = new URLSearchParams(fragment);
            return params.get('id_token');
        }
        return null;
    } catch (error) {
        log.error(`Error parsing URL fragment for id_token: ${error.message}`);
        return null;
    }
}

function extractCodeFromUrl(url) {
    try {
        log.info('Extracting code from URL:', url);
        const urlObject = new URL(url);
        const params = new URLSearchParams(urlObject.search);
        const code = params.get('code');
        
        if (code) {
            log.info('Authorization code extracted successfully, length:', code.length);
            log.info('Code preview:', code.substring(0, 20) + '...');
        } else {
            log.error('No authorization code found in URL parameters');
            log.error('Available parameters:', Array.from(params.keys()));
        }
        
        return code;
    } catch (error) {
        log.error(`Error parsing URL for code: ${error.message}`);
        log.error('URL that caused error:', url);
        return null;
    }
}

async function getToken(code, codeVerifier) {
    log.info('Exchanging authorization code for token...');
    log.info('Authorization code:', code.substring(0, 20) + '...');
    log.info('Code verifier:', codeVerifier.substring(0, 20) + '...');
    
    try {
        const response = await axios.post(
            'https://account.jagex.com/oauth2/token',
            new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: 'com_jagex_auth_desktop_launcher',
                code: code,
                code_verifier: codeVerifier,
                redirect_uri: 'https://secure.runescape.com/m=weblogin/launcher-redirect'
            }),
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }
        );
        
        log.info('Token exchange response status:', response.status);
        log.info('Token exchange response data:', JSON.stringify(response.data, null, 2));
        
        if (response.data && response.data.id_token) {
            log.info('Token exchange successful.');
            return response.data.id_token;
        } else {
            log.error('Token exchange failed - no id_token in response');
            log.error('Response data:', response.data);
            return null;
        }
    } catch (error) {
        log.error('Token exchange error details:');
        log.error('Status:', error.response?.status);
        log.error('Status Text:', error.response?.statusText);
        log.error('Response Data:', error.response?.data);
        log.error('Error Message:', error.message);
        log.error('Full Error:', error);
        return null;
    }
}

async function getSessionId(idToken) {
    log.info('Fetching game session ID...');
    try {
        const response = await axios.post(
            'https://auth.jagex.com/game-session/v1/sessions',
            { idToken },
            { headers: { 'Content-Type': 'application/json' } }
        );
        log.info('Session ID fetched successfully.');
        return response.data.sessionId;
    } catch (error) {
        log.error(`Error getting session ID: ${error.response ? error.response.data : error.message}`);
        return null;
    }
}

async function writeAccountsToFile(sessionId) {
    log.info('Fetching account information...');
    try {
        const response = await axios.get(
            'https://auth.jagex.com/game-session/v1/accounts',
            {
                headers: { Authorization: `Bearer ${sessionId}` }
            }
        );

        log.info('Accounts API response:', JSON.stringify(response.data, null, 2));

        const newAccounts = response.data.map((acc) => ({
            ...acc,
            sessionId,
            createdOn: new Date().toISOString(),
            id: acc.accountId || acc.id || acc.displayName || `account_${Date.now()}`
        }));

        log.info('Processed accounts for saving:', JSON.stringify(newAccounts, null, 2));

        await fs.mkdir(ACCOUNTS_DIR, { recursive: true });

        let existingAccounts = [];
        try {
            const fileContent = await fs.readFile(ACCOUNTS_FILE_PATH, 'utf-8');
            existingAccounts = JSON.parse(fileContent);
            log.info(`Existing accounts loaded: ${existingAccounts.length} accounts`);
        } catch (e) {
            if (e.code !== 'ENOENT') {
                log.error(`Error reading existing accounts file: ${e}`);
            } else {
                log.info('No existing accounts file found, starting fresh');
            }
        }

        const existingAccountIds = new Set(existingAccounts.map((acc) => acc.accountId || acc.id));
        const nonDuplicateNewAccounts = newAccounts.filter((acc) => !existingAccountIds.has(acc.accountId || acc.id));

        if (nonDuplicateNewAccounts.length > 0) {
            const allAccounts = [...existingAccounts, ...nonDuplicateNewAccounts];
            await fs.writeFile(ACCOUNTS_FILE_PATH, JSON.stringify(allAccounts, null, 2));
            log.info(`Successfully wrote ${nonDuplicateNewAccounts.length} new account(s) to ${ACCOUNTS_FILE_PATH}`);
            log.info(`Total accounts in file: ${allAccounts.length}`);
            
            // Force a small delay to ensure file is written before reading
            await new Promise(resolve => setTimeout(resolve, 100));
        } else {
            log.info('No new accounts to add.');
        }
    } catch (error) {
        log.error(`Error writing accounts to file: ${error.message}`);
        log.error(`Full error details:`, error);
    }
}

async function startAuthFlow() {
    return new Promise(async (resolve, reject) => {
        let finished = false;
        let browser = null;
        let timeoutId = null;

        function fail(err) {
            if (finished) return;
            finished = true;
            if (timeoutId) clearTimeout(timeoutId);
            if (browser) {
                browser.close().catch(e => log.error('Error closing browser:', e));
            }
            reject(err);
        }

        function success(message) {
            if (finished) return;
            finished = true;
            if (timeoutId) clearTimeout(timeoutId);
            if (browser) {
                browser.close().catch(e => log.error('Error closing browser:', e));
            }
            resolve(message);
        }

        // Set timeout for 5 minutes (300000 ms)
        timeoutId = setTimeout(() => {
            fail(new Error('Login timed out - please try again'));
        }, 300000);

        try {
            // Check if Patchright Chromium exists and install synchronously if needed
            log.info('Checking for Patchright Chromium installation...');
            
            // Try multiple possible paths for chromium
            const possiblePaths = [
                path.join(os.homedir(), 'AppData', 'Local', 'ms-playwright'),
                path.join(os.homedir(), '.cache', 'ms-playwright'),
                path.join(__dirname, 'node_modules', 'playwright'),
                path.join(os.tmpdir(), 'ms-playwright')
            ];

            let chromiumExists = false;
            let chromiumPath = null;

            for (const checkPath of possiblePaths) {
                try {
                    if (fs.existsSync(checkPath)) {
                        const files = fs.readdirSync(checkPath);
                        const chromiumFile = files.find(f => f.includes('chromium'));
                        if (chromiumFile) {
                            chromiumPath = checkPath;
                            chromiumExists = true;
                            log.info(`Found Chromium at: ${checkPath}`);
                            break;
                        }
                    }
                } catch (error) {
                    log.warn(`Error checking path ${checkPath}:`, error.message);
                }
            }

            if (!chromiumExists) {
                log.info('Patchright Chromium not found in any location, installing synchronously...');
                
                try {
                    // Try multiple installation methods
                    const installCommands = [
                        'npx patchright install chromium',
                        'npx playwright install chromium',
                        'npm install patchright && npx patchright install chromium'
                    ];

                    for (const command of installCommands) {
                        try {
                            log.info(`Trying installation command: ${command}`);
                            execSync(command, { 
                                timeout: 180000, // 3 minutes
                                stdio: 'pipe',
                                cwd: __dirname,
                                env: {
                                    ...process.env,
                                    NODE_ENV: 'production'
                                }
                            });
                            log.info('Patchright Chromium installation completed successfully');
                            break;
                        } catch (installError) {
                            log.warn(`Installation command failed: ${command}`, installError.message);
                            if (command === installCommands[installCommands.length - 1]) {
                                // Last attempt failed
                                throw installError;
                            }
                        }
                    }
                } catch (error) {
                    log.error('Patchright installation failed:', error.message);
                    log.error('Installation error details:', {
                        name: error.name,
                        message: error.message,
                        stack: error.stack,
                        code: error.code,
                        signal: error.signal
                    });
                    fail(new Error(`Browser setup failed. Please manually run: npx patchright install chromium. Error: ${error.message}`));
                    return;
                }
            }

            // Now launch browser - Patchright is guaranteed to be installed
            log.info('Launching Patchright browser...');
            try {
                browser = await chromium.launch({
                    headless: false,
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                });
            } catch (browserError) {
                log.error('Failed to launch browser:', browserError.message);
                fail(new Error('Failed to launch browser. Please ensure your system has sufficient resources and try again.'));
                return;
            }
            
            const context = await browser.newContext();
            const page = await context.newPage();

            // Generate OAuth parameters
            const codeVerifier = generateCodeVerifier(128);
            const codeChallenge = getCodeChallenge(codeVerifier);
            const state = generateRandomState(32);

            const initialUrl = `https://account.jagex.com/oauth2/auth?auth_method=&login_type=&flow=launcher&response_type=code&client_id=com_jagex_auth_desktop_launcher&redirect_uri=https%3A%2F%2Fsecure.runescape.com%2Fm%3Dweblogin%2Flauncher-redirect&code_challenge=${codeChallenge}&code_challenge_method=S256&prompt=login&scope=openid+offline+gamesso.token.create+user.profile.read&state=${state}`;

            log.info('Starting Blessed Scripts authentication flow...');

            page.once('close', () => {
                if (finished) return;
                fail(new Error('Login cancelled - please try again'));
            });

            page.on('framenavigated', async (frame) => {
                if (finished) return;
                const url = frame.url();

                try {
                    log.info('Frame navigated to:', url);
                    
                    // Handle final redirect from Jagex after consent
                    if (url.includes('secure.runescape.com/m=weblogin/launcher-redirect')) {
                        log.info('Detected Jagex redirect URL, waiting for page to fully load...');
                        
                        // Wait a moment to ensure the page is fully loaded
                        await page.waitForTimeout(1000);
                        
                        log.info('Extracting auth code from redirect URL...');
                        
                        // Extract code from redirect URL
                        const code = extractCodeFromUrl(url);
                        if (code) {
                            log.info('Authorization code found, exchanging for token...');
                            const idTokenFromCode = await getToken(code, codeVerifier);
                            if (idTokenFromCode) {
                                log.info('Token received, getting session ID...');
                                const sessionId = await getSessionId(idTokenFromCode);
                                if (sessionId) {
                                    log.info('Session ID received, saving account...');
                                    await writeAccountsToFile(sessionId);
                                    log.info('Account saved successfully.');
                                }

                                log.info('Authentication flow complete. Closing browser.');
                                success('Authentication successful.');
                            } else {
                                log.error('Failed to get ID token from authorization code');
                                fail(new Error('Failed to complete authentication - token exchange failed'));
                            }
                        } else {
                            log.error('No authorization code found in redirect URL');
                            fail(new Error('Failed to complete authentication - no authorization code'));
                        }
                    }
                    // Handle intermediate step with id_token in URL (rare case)
                    else if (url.includes('id_token=')) {
                        log.info('Found URL with id_token query parameter.');
                        const idToken = extractIdTokenFromUrl(url);
                        if (idToken) {
                            const sessionId = await getSessionId(idToken);
                            if (sessionId) {
                                await writeAccountsToFile(sessionId);
                                log.info('Account saved successfully.');
                            }

                            log.info('Authentication flow complete. Closing browser.');
                            success('Authentication successful.');
                        }
                    }
                    // Handle initial authorization step
                    else if (url.includes('code=') && !url.includes('locale?')) {
                        log.info('Found the URL with the code query parameter.');
                        const code = extractCodeFromUrl(url);
                        if (code) {
                            const idTokenFromCode = await getToken(code, codeVerifier);
                            if (idTokenFromCode) {
                                const nonce = generateRandomState(48);
                                const nextAuthUrl = `https://account.jagex.com/oauth2/auth?id_token_hint=${idTokenFromCode}&nonce=${nonce}&prompt=consent&redirect_uri=http%3A%2F%2Flocalhost&response_type=id_token+code&state=${state}&client_id=1fddee4e-b100-4f4e-b2b0-097f9088f9d2&scope=openid+offline`;

                                log.info('Navigating to the next authentication URL.');
                                await page.goto(nextAuthUrl);
                            }
                        }
                    }
                } catch (error) {
                    log.error('Authentication flow error:', error.message);
                    fail(new Error('An error occurred during the authentication flow.'));
                }
            });

            await page.route('http://localhost/', async (route) => {
                if (finished) return;
                log.info('Intercepted navigation to localhost.');
                await page.waitForTimeout(50);
                
                await route.fulfill({
                    status: 200,
                    contentType: 'text/html',
                    body: AUTH_COMPLETE_HTML
                });
            });

            await page.goto(initialUrl);
        } catch (error) {
            fail(error);
        }
    });
}

module.exports = { startAuthFlow, writeAccountsToFile, checkPatchrightBrowsers, installPatchrightBrowsers, installPatchrightBrowsersSync, ensurePatchrightBrowsersSync };
