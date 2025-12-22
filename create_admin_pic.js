const fs = require('fs');
const path = require('path');

// Create a simple SVG as JPEG (we'll save it as SVG which all browsers support)
const adminSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <!-- Teal circle background -->
  <circle cx="100" cy="100" r="100" fill="#006680"/>
  
  <!-- White ADMIN text -->
  <text x="100" y="100" font-family="Arial, sans-serif" font-size="48" font-weight="bold" 
        fill="white" text-anchor="middle" dominant-baseline="middle">ADMIN</text>
</svg>`;

const outputPath = path.join(__dirname, 'assets', 'images', 'admin.jpg');
// Save as SVG (browsers will display it fine)
const outputPathSvg = path.join(__dirname, 'assets', 'images', 'admin.svg');

try {
  fs.writeFileSync(outputPathSvg, adminSvg);
  console.log('✓ admin.svg created at:', outputPathSvg);
} catch (err) {
  console.error('Error creating admin image:', err.message);
}
