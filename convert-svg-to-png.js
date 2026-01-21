// Script to convert SVG to PNG using canvas in Node.js
// Run: node convert-svg-to-png.js

import fs from 'fs';
import { createCanvas, loadImage } from 'canvas';

async function convertSVGtoPNG() {
  try {
    // Read SVG file
    const svgBuffer = fs.readFileSync('public/bbq-group-management.svg');
    const svgString = svgBuffer.toString();
    
    // Create canvas
    const canvas = createCanvas(1200, 630);
    const ctx = canvas.getContext('2d');
    
    // Load SVG as image
    const img = await loadImage('data:image/svg+xml;base64,' + Buffer.from(svgString).toString('base64'));
    
    // Draw on canvas
    ctx.drawImage(img, 0, 0);
    
    // Save as PNG
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync('public/bbq-group-management.png', buffer);
    
    console.log('✅ ה-SVG הומר ל-PNG בהצלחה!');
    console.log('📁 הקובץ נשמר ב: public/bbq-group-management.png');
  } catch (error) {
    console.error('❌ שגיאה בהמרה:', error.message);
    console.log('\n💡 נסה להריץ: npm install canvas');
  }
}

convertSVGtoPNG();
