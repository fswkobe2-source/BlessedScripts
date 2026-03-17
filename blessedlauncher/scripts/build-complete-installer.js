const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Building complete installer with all dependencies...');

// Create a directory for the complete installer
const installerDir = path.join(__dirname, '..', 'complete-installer');
if (!fs.existsSync(installerDir)) {
    fs.mkdirSync(installerDir, { recursive: true });
}

// Copy the main installer
const sourceInstaller = path.join(__dirname, '..', 'dist', 'Blessed-Scripts-Launcher-Setup-1.0.6.exe');
const targetInstaller = path.join(installerDir, 'Blessed-Scripts-Launcher-Complete-Setup-1.0.6.exe');

try {
    fs.copyFileSync(sourceInstaller, targetInstaller);
    console.log(`Complete installer created: ${targetInstaller}`);
    
    // Create a README for the complete installer
    const readmeContent = `# Blessed Scripts Launcher - Complete Installer

This installer includes:
- Blessed Scripts Launcher v1.0.6
- Patchright browser auto-installation
- Java detection and installation prompts
- All required dependencies bundled

## Installation
Simply run \`Blessed-Scripts-Launcher-Complete-Setup-1.0.6.exe\` and follow the prompts.

The launcher will automatically:
1. Check for Java installation
2. Install Patchright browsers if needed
3. Set up all required directories
4. Launch the Blessed Scripts interface

## Requirements
- Windows 10 or higher
- Internet connection for initial setup
- Administrative privileges for browser installation

## Troubleshooting
If you encounter issues:
1. Ensure Windows is up to date
2. Check that .NET Framework 4.5+ is installed
3. Temporarily disable antivirus during installation
4. Run as administrator if needed

For support, visit: https://discord.gg/SjSukZkfxh
Generated on: ${new Date().toISOString()}
`;
    
    fs.writeFileSync(path.join(installerDir, 'README.md'), readmeContent);
    
    console.log('Complete installer build finished successfully!');
    
} catch (error) {
    console.error('Failed to create complete installer:', error);
    process.exit(1);
}
