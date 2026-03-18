const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const log = require('electron-log');

const JRE_VERSION = '21';
const JRE_API_URL = 'https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jre/hotspot/normal/eclipse';
const JRE_INSTALL_DIR = path.join(process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE, 'AppData', 'Local'), 'BlessedScripts', 'jre');

async function checkJavaInstallation() {
    return new Promise((resolve) => {
        const javaProcess = spawn('java', ['-version'], { 
            stdio: ['ignore', 'pipe', 'pipe'],
            shell: true 
        });
        
        let output = '';
        javaProcess.stderr.on('data', (data) => {
            output += data.toString();
        });
        
        javaProcess.on('close', (code) => {
            if (code === 0) {
                const versionMatch = output.match(/version "([^"]+)"/);
                if (versionMatch) {
                    const version = versionMatch[1];
                    const majorVersion = parseInt(version.split('.')[0].replace(/^1\./, ''));
                    if (majorVersion >= JRE_VERSION) {
                        log.info(`Java ${majorVersion} found, meets requirement (>= ${JRE_VERSION})`);
                        resolve(true);
                        return;
                    }
                }
            }
            log.info('Java not found or version too old');
            resolve(false);
        });
        
        javaProcess.on('error', () => {
            log.info('Java not found');
            resolve(false);
        });
    });
}

async function downloadAndInstallJRE() {
    return new Promise(async (resolve, reject) => {
        try {
            log.info('Downloading JRE 21 from Adoptium...');
            
            // Create install directory
            if (!fs.existsSync(JRE_INSTALL_DIR)) {
                fs.mkdirSync(JRE_INSTALL_DIR, { recursive: true });
            }
            
            // Get download URL from Adoptium API
            const apiResponse = await axios.get(JRE_API_URL);
            const downloadUrl = apiResponse.data.binary.package.link;
            const fileName = `${apiResponse.data.binary.name}.zip`;
            const zipPath = path.join(JRE_INSTALL_DIR, fileName);
            
            // Download JRE
            const response = await axios({
                method: 'GET',
                url: downloadUrl,
                responseType: 'stream',
                timeout: 300000 // 5 minutes
            });
            
            const writer = fs.createWriteStream(zipPath);
            response.data.pipe(writer);
            
            writer.on('finish', async () => {
                try {
                    log.info('Extracting JRE...');
                    
                    // Extract using built-in Windows tar (Windows 10+)
                    const extractCommand = `tar -xf "${zipPath}" -C "${JRE_INSTALL_DIR}"`;
                    execSync(extractCommand, { stdio: 'pipe' });
                    
                    // Find the extracted JRE folder and rename to jre
                    const files = fs.readdirSync(JRE_INSTALL_DIR);
                    const jreFolder = files.find(f => f.includes('jre-') && fs.statSync(path.join(JRE_INSTALL_DIR, f)).isDirectory());
                    
                    if (jreFolder && jreFolder !== 'jre') {
                        const jdkPath = path.join(JRE_INSTALL_DIR, jreFolder);
                        const jrePath = path.join(JRE_INSTALL_DIR, 'jre');
                        
                        if (fs.existsSync(jrePath)) {
                            fs.rmSync(jrePath, { recursive: true, force: true });
                        }
                        
                        fs.renameSync(jdkPath, jrePath);
                    }
                    
                    // Clean up zip file
                    fs.unlinkSync(zipPath);
                    
                    log.info('JRE installation completed successfully');
                    resolve(true);
                } catch (extractError) {
                    log.error('Failed to extract JRE:', extractError.message);
                    reject(extractError);
                }
            });
            
            writer.on('error', (error) => {
                log.error('Failed to download JRE:', error.message);
                reject(error);
            });
            
        } catch (error) {
            log.error('JRE installation failed:', error.message);
            reject(error);
        }
    });
}

async function ensureJavaInstallation() {
    const javaExists = await checkJavaInstallation();
    
    if (!javaExists) {
        log.info('Java not found or version too old, installing JRE 21...');
        try {
            await downloadAndInstallJRE();
            return true;
        } catch (error) {
            log.error('Failed to install JRE:', error.message);
            return false;
        }
    }
    
    return true;
}

function getJavaExecutablePath() {
    // Check if bundled JRE exists
    const bundledJavaExe = path.join(JRE_INSTALL_DIR, 'jre', 'bin', 'java.exe');
    
    if (fs.existsSync(bundledJavaExe)) {
        log.info('Using bundled JRE:', bundledJavaExe);
        return bundledJavaExe;
    }
    
    // Fallback to system Java
    return 'java';
}

module.exports = {
    checkJavaInstallation,
    downloadAndInstallJRE,
    ensureJavaInstallation,
    getJavaExecutablePath,
    JRE_INSTALL_DIR
};
