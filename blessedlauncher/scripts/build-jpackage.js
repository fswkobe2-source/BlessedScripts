const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const config = {
    name: 'BlessedScriptsLauncher',
    displayName: 'Blessed Scripts Launcher',
    version: '2.1.25',
    description: 'Advanced OSRS Botting Platform',
    vendor: 'Blessed Scripts',
    copyright: '© 2026 Blessed Scripts',
    mainClass: 'net.runelite.client.RuneLite',
    appPath: path.join(__dirname, '..'),
    outputPath: path.join(__dirname, '..', 'dist-jpackage'),
    clientJarPath: path.join(__dirname, '..', '..', 'runelite-client', 'build', 'libs', 'BlessedScripts-2.1.25.jar'),
    iconPath: path.join(__dirname, '..', 'images', 'blessed.ico'),
    tempDir: path.join(__dirname, '..', 'temp-jpackage')
};

async function buildJPackage() {
    console.log('🚀 Building Blessed Scripts Launcher with jpackage...');
    
    try {
        // Clean previous builds
        if (fs.existsSync(config.outputPath)) {
            fs.rmSync(config.outputPath, { recursive: true, force: true });
        }
        if (fs.existsSync(config.tempDir)) {
            fs.rmSync(config.tempDir, { recursive: true, force: true });
        }
        
        // Create temp directory
        fs.mkdirSync(config.tempDir, { recursive: true });
        fs.mkdirSync(config.outputPath, { recursive: true });
        
        // Copy launcher files to temp directory
        console.log('📦 Copying launcher files...');
        copyDir(config.appPath, path.join(config.tempDir, 'launcher'));
        
        // Copy BlessedScripts jar
        if (fs.existsSync(config.clientJarPath)) {
            console.log('📦 Copying BlessedScripts client jar...');
            fs.copyFileSync(config.clientJarPath, path.join(config.tempDir, 'BlessedScripts-2.1.25.jar'));
        } else {
            console.warn('⚠️  BlessedScripts jar not found at:', config.clientJarPath);
        }
        
        // Create app resources directory
        const appResourcesDir = path.join(config.tempDir, 'app-resources');
        fs.mkdirSync(appResourcesDir, { recursive: true });
        
        // Copy launcher files to app-resources
        copyDir(path.join(config.tempDir, 'launcher'), appResourcesDir);
        
        // Copy client jar to app-resources
        if (fs.existsSync(path.join(config.tempDir, 'BlessedScripts-2.1.25.jar'))) {
            fs.copyFileSync(
                path.join(config.tempDir, 'BlessedScripts-2.1.25.jar'),
                path.join(appResourcesDir, 'BlessedScripts-2.1.25.jar')
            );
        }
        
        // Build jpackage command
        const jpackageCmd = [
            'jpackage',
            '--name', config.name,
            '--app-version', config.version,
            '--description', config.description,
            '--vendor', config.vendor,
            '--copyright', config.copyright,
            '--type', 'msi',
            '--dest', config.outputPath,
            '--input', appResourcesDir,
            '--main-jar', 'BlessedScripts-2.1.25.jar',
            '--main-class', config.mainClass,
            '--runtime-image', findJavaRuntime(),
            '--win-dir-chooser',
            '--win-menu',
            '--win-shortcut',
            '--win-per-user-install'
        ];
        
        // Add icon if available
        if (fs.existsSync(config.iconPath)) {
            jpackageCmd.push('--icon', config.iconPath);
        }
        
        console.log('🔨 Running jpackage command...');
        console.log('Command:', jpackageCmd.join(' '));
        
        execSync(jpackageCmd.join(' '), { stdio: 'inherit' });
        
        console.log('✅ Build completed successfully!');
        console.log(`📁 Installer location: ${config.outputPath}`);
        
        // Clean up temp directory
        fs.rmSync(config.tempDir, { recursive: true, force: true });
        
    } catch (error) {
        console.error('❌ Build failed:', error.message);
        process.exit(1);
    }
}

function findJavaRuntime() {
    // Use the current Java runtime
    const javaHome = process.env.JAVA_HOME || path.dirname(process.execPath);
    console.log('🔍 Using Java runtime from:', javaHome);
    return javaHome;
}

function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
            // Skip node_modules and other unnecessary directories
            if (['node_modules', 'dist', 'temp-jpackage', 'scripts'].includes(entry.name)) {
                continue;
            }
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Run the build
buildJPackage();
