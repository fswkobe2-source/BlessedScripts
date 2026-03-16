module.exports = async function (deps) {
    const { ipcMain, fs, path, blessedScriptsDir, log } = deps;
    const { spawn } = require('child_process');

    ipcMain.handle('client-exists', async (event, clientPath) => {
        try {
            return fs.existsSync(clientPath);
        } catch (error) {
            log.error(`Error checking client exists: ${error.message}`);
            return false;
        }
    });

    ipcMain.handle('open-client', async (event, account, clientPath, ramPreference) => {
        try {
            if (!fs.existsSync(clientPath)) {
                return { error: `Client not found at: ${clientPath}` };
            }

            // Debug: Print exact account data
            log.info('Selected account data:', JSON.stringify(account, null, 2));

            // Create session file for the selected account in the correct AccountSession format
            const sessionData = {
                uuid: account.sessionId, // This should be a valid UUID string
                created: new Date().toISOString(),
                username: account.displayName || account.accountId
            };

            // Session file should be in ~/.runelite/session (the default location)
            const runeliteDir = path.join(process.env.USERPROFILE || process.env.HOME, '.runelite');
            const sessionPath = path.join(runeliteDir, 'session');
            
            // Ensure the .runelite directory exists
            if (!fs.existsSync(runeliteDir)) {
                fs.mkdirSync(runeliteDir, { recursive: true });
            }
            fs.writeFileSync(sessionPath, JSON.stringify(sessionData, null, 2));

            // Debug: Print session file contents
            const sessionFileContent = fs.readFileSync(sessionPath, 'utf8');
            log.info('Session file content:', sessionFileContent);
            log.info('Session file path:', sessionPath);

            log.info(`Launching Blessed Scripts with account: ${account.displayName}`);

            // Prepare JVM arguments
            const jvmArgs = [];
            
            // Add RAM preference if specified
            if (ramPreference) {
                switch (ramPreference.toLowerCase()) {
                    case '512m':
                    case '1g':
                    case '2g':
                    case '4g':
                    case '8g':
                        jvmArgs.push(`-Xmx${ramPreference}`);
                        break;
                    default:
                        jvmArgs.push('-Xmx1g'); // Default
                }
            } else {
                jvmArgs.push('-Xmx1g'); // Default
            }

            // Add other JVM optimizations
            jvmArgs.push(
                '-XX:+UseG1GC',
                '-XX:+UseStringDeduplication',
                '-Djava.util.Arrays.useLegacyMergeSort=true',
                '-Duser.language=en',
                '-Duser.country=US'
            );

            // Add session token as JVM argument (remove this - we'll use env vars instead)
            // if (account.sessionId) {
            //     jvmArgs.push(`-Dsession.token=${account.sessionId}`);
            //     log.info(`Added session token JVM argument: -Dsession.token=${account.sessionId}`);
            // }

            // No need to pass --sessionfile since we're using the default location
            const commandArgs = [...jvmArgs, '-jar', clientPath];

            const fullCommand = `java ${commandArgs.join(' ')}`;
            log.info(`Executing: ${fullCommand}`);

            // Launch the client with environment variables for Jagex authentication
            const javaProcess = spawn('java', commandArgs, {
                detached: true,
                stdio: ['ignore', 'pipe', 'pipe'], // Capture stdout and stderr for logging
                cwd: path.dirname(clientPath),
                windowsHide: false, // Ensure the process is visible on Windows
                env: {
                    ...process.env, // Inherit existing environment
                    JX_SESSION_ID: account.sessionId || '',
                    JX_ACCESS_TOKEN: account.accessToken || '',
                    JX_REFRESH_TOKEN: account.refreshToken || '',
                    JX_DISPLAY_NAME: account.displayName || '',
                    JX_CHARACTER_ID: account.accountId || ''
                }
            });

            log.info(`Set Jagex environment variables:`);
            log.info(`  JX_SESSION_ID: ${account.sessionId || ''}`);
            log.info(`  JX_DISPLAY_NAME: ${account.displayName || ''}`);
            log.info(`  JX_CHARACTER_ID: ${account.accountId || ''}`);

            // Log process output for debugging
            if (javaProcess.stdout) {
                javaProcess.stdout.on('data', (data) => {
                    log.info(`[stdout] ${data.toString().trim()}`);
                });
            }

            if (javaProcess.stderr) {
                javaProcess.stderr.on('data', (data) => {
                    log.info(`[stderr] ${data.toString().trim()}`);
                });
            }

            javaProcess.on('error', (error) => {
                log.error(`Failed to start Java process: ${error.message}`);
            });

            javaProcess.on('spawn', () => {
                log.info(`Java process spawned successfully with PID: ${javaProcess.pid}`);
            });

            javaProcess.on('close', (code) => {
                log.info(`Java process exited with code: ${code}`);
            });

            // Don't unref immediately to ensure the process starts properly
            setTimeout(() => {
                try {
                    javaProcess.unref();
                    log.info(`Process ${javaProcess.pid} detached and running independently`);
                } catch (error) {
                    log.error(`Error detaching process: ${error.message}`);
                }
            }, 1000);

            return { 
                success: true, 
                pid: javaProcess.pid,
                command: fullCommand,
                message: `Launched Blessed Scripts with account: ${account.displayName}`
            };

        } catch (error) {
            log.error(`Error launching client: ${error.message}`);
            return { error: error.message };
        }
    });
};
