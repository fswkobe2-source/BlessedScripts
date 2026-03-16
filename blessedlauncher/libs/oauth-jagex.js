const { chromium } = require('patchright');
const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const log = require('electron-log');

const userHome = process.env.HOME || process.env.USERPROFILE;
const ACCOUNTS_DIR = path.join(userHome, '.blessedscripts');
const ACCOUNTS_FILE_PATH = path.join(ACCOUNTS_DIR, 'accounts.json');

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
    return crypto.randomBytes(length).toString('base64url');
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
        const urlObject = new URL(url);
        const params = new URLSearchParams(urlObject.search);
        return params.get('code');
    } catch (error) {
        log.error(`Error parsing URL for code: ${error.message}`);
        return null;
    }
}

async function getToken(code) {
    log.info('Exchanging authorization code for token...');
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
        log.info('Token exchange successful.');
        return response.data.id_token;
    } catch (error) {
        log.error(`Error getting token: ${error.response ? error.response.data : error.message}`);
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

        const newAccounts = response.data.map((acc) => ({
            ...acc,
            sessionId,
            createdOn: new Date().toISOString()
        }));

        await fs.mkdir(ACCOUNTS_DIR, { recursive: true });

        let existingAccounts = [];
        try {
            const fileContent = await fs.readFile(ACCOUNTS_FILE_PATH, 'utf-8');
            existingAccounts = JSON.parse(fileContent);
        } catch (e) {
            if (e.code !== 'ENOENT') {
                log.error(`Error reading existing accounts file: ${e}`);
            }
        }

        const existingAccountIds = new Set(existingAccounts.map((acc) => acc.accountId));
        const nonDuplicateNewAccounts = newAccounts.filter((acc) => !existingAccountIds.has(acc.accountId));

        if (nonDuplicateNewAccounts.length > 0) {
            const allAccounts = [...existingAccounts, ...nonDuplicateNewAccounts];
            await fs.writeFile(ACCOUNTS_FILE_PATH, JSON.stringify(allAccounts, null, 2));
            log.info(`Successfully wrote ${nonDuplicateNewAccounts.length} new account(s) to ${ACCOUNTS_FILE_PATH}`);
        } else {
            log.info('No new accounts to add.');
        }
    } catch (error) {
        log.error(`Error writing accounts to file: ${error.message}`);
    }
}

async function startAuthFlow() {
    return new Promise(async (resolve, reject) => {
        let finished = false;

        function fail(err) {
            if (finished) return;
            finished = true;
            reject(err);
        }

        try {
            // Check if Patchright browsers are available before launching
            let browser;
            try {
                const executablePath = chromium.executablePath();
                log.info('Using Patchright browser executable:', executablePath);
            } catch (error) {
                log.error('Patchright browsers not available:', error.message);
                fail(new Error('Patchright browsers are not installed. Please restart the launcher to automatically install them, or run "npx patchright install" manually.'));
                return;
            }

            browser = await chromium.launch({
                headless: false,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const context = await browser.newContext();
            const page = await context.newPage();

            const initialUrl = `https://account.jagex.com/oauth2/auth?auth_method=&login_type=&flow=launcher&response_type=code&client_id=com_jagex_auth_desktop_launcher&redirect_uri=https%3A%2F%2Fsecure.runescape.com%2Fm%3Dweblogin%2Flauncher-redirect&code_challenge=${codeChallenge}&code_challenge_method=S256&prompt=login&scope=openid+offline+gamesso.token.create+user.profile.read&state=${state}`;

            log.info('Starting Blessed Scripts authentication flow...');

            page.once('close', () => {
                if (finished) return;
                fail(new Error('Browser was closed before authentication flow completed.'));
                browser.close();
            });

            page.on('framenavigated', async (frame) => {
                if (finished) return;
                const url = frame.url();

                try {
                    if (url.includes('id_token=')) {
                        log.info('Found the URL with the id_token query parameter.');
                        const idToken = extractIdTokenFromUrl(url);
                        if (idToken) {
                            const sessionId = await getSessionId(idToken);
                            if (sessionId) {
                                await writeAccountsToFile(sessionId);
                            }

                            log.info('Authentication flow complete. Closing browser.');
                            finished = true;
                            await browser.close();
                            resolve('Authentication successful.');
                        }
                    } else if (url.includes('code=') && !url.includes('locale?')) {
                        log.info('Found the URL with the code query parameter.');
                        const code = extractCodeFromUrl(url);
                        if (code) {
                            const idTokenFromCode = await getToken(code);
                            if (idTokenFromCode) {
                                const nonce = generateRandomState(48);
                                const nextAuthUrl = `https://account.jagex.com/oauth2/auth?id_token_hint=${idTokenFromCode}&nonce=${nonce}&prompt=consent&redirect_uri=http%3A%2F%2Flocalhost&response_type=id_token+code&state=${state}&client_id=1fddee4e-b100-4f4e-b2b0-097f9088f9d2&scope=openid+offline`;

                                log.info('Navigating to the next authentication URL.');
                                await page.goto(nextAuthUrl);
                            }
                        }
                    }
                } catch (error) {
                    fail(new Error('An error occurred during the authentication flow.'));
                    await browser.close();
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

module.exports = { startAuthFlow, writeAccountsToFile };
