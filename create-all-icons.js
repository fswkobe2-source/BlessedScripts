


r













dconst fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

async function createIcons() {
    // Load the Blessed Scripts logo
    const logoPath = path.join(__dirname, 'img.png');
    const logo = await loadImage(logoPath);
    
    // Create 16x16 icon
    const canvas16 = createCanvas(16, 16);
    const ctx16 = canvas16.getContext('2d');
    ctx16.drawImage(logo, 0, 0, 16, 16);
    const buffer16 = canvas16.toBuffer('image/png');
    fs.writeFileSync(path.join(__dirname, 'runelite-client/src/main/resources/net/runelite/client/ui/runelite_16.png'), buffer16);
    console.log('Created runelite_16.png (16x16)');
    
    // Create 128x128 icon
    const canvas128 = createCanvas(128, 128);
    const ctx128 = canvas128.getContext('2d');
    ctx128.drawImage(logo, 0, 0, 128, 128);
    const buffer128 = canvas128.toBuffer('image/png');
    fs.writeFileSync(path.join(__dirname, 'runelite-client/src/main/resources/net/runelite/client/ui/runelite_128.png'), buffer128);
    console.log('Created runelite_128.png (128x128)');
    
    // Create open.png (16x16, typical size for open icons)
    const canvasOpen = createCanvas(16, 16);
    const ctxOpen = canvasOpen.getContext('2d');
    ctxOpen.drawImage(logo, 0, 0, 16, 16);
    const bufferOpen = canvasOpen.toBuffer('image/png');
    fs.writeFileSync(path.join(__dirname, 'runelite-client/src/main/resources/net/runelite/client/ui/open.png'), bufferOpen);
    console.log('Created open.png (16x16)');
    
    // Create open_rs.png (32x32, typical size for runescape icons)
    const canvasOpenRs = createCanvas(32, 32);
    const ctxOpenRs = canvasOpenRs.getContext('2d');
    ctxOpenRs.drawImage(logo, 0, 0, 32, 32);
    const bufferOpenRs = canvasOpenRs.toBuffer('image/png');
    fs.writeFileSync(path.join(__dirname, 'runelite-client/src/main/resources/net/runelite/client/ui/open_rs.png'), bufferOpenRs);
    console.log('Created open_rs.png (32x32)');
    
    // Create build directory if it doesn't exist
    const buildDir = path.join(__dirname, 'blessedlauncher/build');
    if (!fs.existsSync(buildDir)) {
        fs.mkdirSync(buildDir);
    }
    
    // Create multi-size ICO file (256x256 as base)
    const canvas256 = createCanvas(256, 256);
    const ctx256 = canvas256.getContext('2d');
    ctx256.drawImage(logo, 0, 0, 256, 256);
    const buffer256 = canvas256.toBuffer('image/png');
    fs.writeFileSync(path.join(__dirname, 'blessedlauncher/build/icon.ico'), buffer256);
    console.log('Created icon.ico (256x256 PNG format)');
    
    console.log('All icons created successfully!');
}

createIcons().catch(console.error);
