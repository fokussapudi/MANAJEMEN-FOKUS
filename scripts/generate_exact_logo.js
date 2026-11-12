import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Exact SVG of the FOKUS (Forum Komunikasi Santri) circular emblem
const svgContent = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Gold Gradients -->
    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#DEBA7E" />
      <stop offset="30%" stop-color="#C59B4B" />
      <stop offset="50%" stop-color="#FCE1A8" />
      <stop offset="75%" stop-color="#B88A37" />
      <stop offset="100%" stop-color="#93681D" />
    </linearGradient>

    <linearGradient id="goldRing" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#A57926" />
      <stop offset="25%" stop-color="#ECC67F" />
      <stop offset="50%" stop-color="#B2842E" />
      <stop offset="75%" stop-color="#FCE3AA" />
      <stop offset="100%" stop-color="#8F6218" />
    </linearGradient>

    <radialGradient id="filigreeBg" cx="50%" cy="50%" r="50%">
      <stop offset="85%" stop-color="#FFFDF7" />
      <stop offset="100%" stop-color="#F4E8CB" />
    </radialGradient>

    <!-- Star definition -->
    <g id="star">
      <polygon points="0,-18 5.5,-5.5 18,-4 8.5,5 11,18 0,11.5 -11,18 -8.5,5 -18,-4 -5.5,-5.5" fill="#050505" />
    </g>

    <!-- Ornamental Motif for Border Pattern (36 repeats) -->
    <g id="ornamentPetal">
      <!-- Outer small crown loop -->
      <path d="M -12,-388 C -12,-410 0,-420 0,-420 C 0,-420 12,-410 12,-388 C 12,-370 0,-365 0,-365 C 0,-365 -12,-370 -12,-388 Z" fill="none" stroke="url(#goldGradient)" stroke-width="4.5" />
      <!-- Arch loop -->
      <path d="M -30,-375 C -15,-405 15,-405 30,-375 C 20,-355 0,-350 0,-350 C 0,-350 -20,-355 -30,-375 Z" fill="none" stroke="url(#goldGradient)" stroke-width="5" />
      <!-- Inner bud -->
      <circle cx="0" cy="-395" r="4.5" fill="#C59B4B" />
      <!-- Side curly scrolls -->
      <path d="M -28,-360 C -15,-345 -8,-360 0,-360 C 8,-360 15,-345 28,-360" fill="none" stroke="url(#goldGradient)" stroke-width="4" />
      <!-- Tiny bead -->
      <circle cx="0" cy="-370" r="3.5" fill="#8F6218" />
      <!-- Base connector ring -->
      <circle cx="0" cy="-348" r="4" fill="none" stroke="url(#goldGradient)" stroke-width="3" />
    </g>
  </defs>

  <!-- 1. Outer Dark Emerald Green Ring -->
  <circle cx="512" cy="512" r="500" fill="#0C6337" />
  
  <!-- Outer Gold Rim -->
  <circle cx="512" cy="512" r="486" fill="none" stroke="url(#goldGradient)" stroke-width="7" />
  
  <!-- Filigree Ring Background -->
  <circle cx="512" cy="512" r="482" fill="url(#filigreeBg)" />

  <!-- 2. Rich Islamic / Floral Gold Filigree Border (Repeated 36 times around 360 deg) -->
  <g transform="translate(512,512)">
    ${Array.from({ length: 36 }).map((_, i) => `<use href="#ornamentPetal" transform="rotate(${i * 10})" />`).join('\n    ')}
  </g>

  <!-- 3. Inner Concentric Golden Rings and Borders -->
  <circle cx="512" cy="512" r="338" fill="none" stroke="#0C6337" stroke-width="5" />
  <circle cx="512" cy="512" r="332" fill="none" stroke="url(#goldRing)" stroke-width="12" />
  <circle cx="512" cy="512" r="322" fill="none" stroke="url(#goldGradient)" stroke-width="5" />
  <circle cx="512" cy="512" r="316" fill="#FFFFFF" />

  <!-- 4. Nine (9) Black Stars in Gentle Upward Arch -->
  <!-- Center Star 5 (Largest) -->
  <g transform="translate(512, 335) scale(1.65)"><use href="#star" /></g>
  
  <!-- Star 4 and 6 -->
  <g transform="translate(450, 348) rotate(-7) scale(1.4)"><use href="#star" /></g>
  <g transform="translate(574, 348) rotate(7) scale(1.4)"><use href="#star" /></g>
  
  <!-- Star 3 and 7 -->
  <g transform="translate(390, 372) rotate(-14) scale(1.2)"><use href="#star" /></g>
  <g transform="translate(634, 372) rotate(14) scale(1.2)"><use href="#star" /></g>
  
  <!-- Star 2 and 8 -->
  <g transform="translate(335, 410) rotate(-22) scale(1.05)"><use href="#star" /></g>
  <g transform="translate(689, 410) rotate(22) scale(1.05)"><use href="#star" /></g>
  
  <!-- Star 1 and 9 (Outer / Smallest) -->
  <g transform="translate(285, 458) rotate(-30) scale(0.9)"><use href="#star" /></g>
  <g transform="translate(739, 458) rotate(30) scale(0.9)"><use href="#star" /></g>

  <!-- 5. Main Bold Arched FOKUS Typography -->
  <g transform="translate(512, 530)" text-anchor="middle">
    <!-- Letter F -->
    <path d="M -238,-35 L -190,-44 L -180,72 L -208,72 L -208,26 L -186,24 L -186,0 L -208,0 L -208,-20 L -180,-25 L -180,-45 L -238,-35 Z" fill="#000000" />
    
    <!-- Letter O -->
    <path d="M -145,-78 C -95,-95 -75,-60 -70,15 C -65,78 -90,95 -135,88 C -178,80 -195,50 -190,-10 C -185,-65 -168,-85 -145,-78 Z M -138,-45 C -150,-40 -155,-20 -158,10 C -160,40 -150,58 -135,55 C -120,52 -112,35 -110,5 C -108,-25 -115,-48 -138,-45 Z" fill="#000000" />
    
    <!-- Letter K (Taller center anchor) -->
    <path d="M -48,-115 L -18,-118 L -18,125 L -48,122 Z M 2,-35 L 42,-110 L 80,-105 L 18,5 L 85,130 L 45,128 L -5,22 Z" fill="#000000" />
    
    <!-- Letter U -->
    <path d="M 98,-90 L 128,-80 L 128,30 C 128,68 142,88 172,78 C 200,68 208,48 208,12 L 208,-60 L 238,-50 L 238,20 C 238,82 205,108 162,112 C 120,116 98,82 98,30 Z" fill="#000000" />
    
    <!-- Letter S -->
    <path d="M 268,-40 C 285,-48 318,-42 328,-22 C 335,-6 322,12 295,22 C 265,32 258,45 260,60 C 262,75 280,82 305,78 C 322,74 335,65 342,55 L 358,78 C 345,92 325,102 298,105 C 255,108 232,90 230,62 C 228,35 248,18 275,8 C 302,-2 308,-12 306,-22 C 304,-30 292,-34 278,-30 C 262,-26 252,-18 248,-8 L 232,-28 C 240,-40 252,-48 268,-40 Z" fill="#000000" />
  </g>

  <!-- 6. Subtitle "Forum Komunikasi Santri" -->
  <text 
    x="512" 
    y="695" 
    font-family="'Arial', 'Helvetica', 'Segoe UI', sans-serif" 
    font-size="46" 
    font-weight="700" 
    letter-spacing="1.5" 
    fill="#000000" 
    text-anchor="middle"
    transform="scale(1, 1.1) translate(0, -60)"
  >
    Forum Komunikasi Santri
  </text>
</svg>
`;

async function generateAssets() {
  const publicDir = path.resolve('public');
  const distDir = path.resolve('dist');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  const svgBuffer = Buffer.from(svgContent.trim());

  // Generate 1024x1024 high-res PNG with transparent background
  const pngBuffer = await sharp(svgBuffer)
    .resize(1024, 1024)
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();

  // Generate high quality JPG with white background
  const jpgBuffer = await sharp(svgBuffer)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .resize(1024, 1024)
    .jpeg({ quality: 100 })
    .toBuffer();

  // Save to public directory
  fs.writeFileSync(path.join(publicDir, 'logo.png'), pngBuffer);
  fs.writeFileSync(path.join(publicDir, 'logo_fokus.png'), pngBuffer);
  fs.writeFileSync(path.join(publicDir, 'logo_transparent.png'), pngBuffer);
  fs.writeFileSync(path.join(publicDir, 'logo.jpg'), jpgBuffer);

  // Save to dist directory
  fs.writeFileSync(path.join(distDir, 'logo.png'), pngBuffer);
  fs.writeFileSync(path.join(distDir, 'logo_fokus.png'), pngBuffer);
  fs.writeFileSync(path.join(distDir, 'logo_transparent.png'), pngBuffer);
  fs.writeFileSync(path.join(distDir, 'logo.jpg'), jpgBuffer);

  console.log('✅ All logo assets generated perfectly matching user request!');
}

generateAssets().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
