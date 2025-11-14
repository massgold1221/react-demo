import express from 'express';
import cors from 'cors';
import { createCanvas } from 'canvas';
import { writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Create images directory
const imagesDir = join(__dirname, '../generated-images');
if (!existsSync(imagesDir)) {
  mkdirSync(imagesDir, { recursive: true });
}

// Serve static files
app.use('/images', express.static(imagesDir));

// AI Image Templates
const aiTemplates = {
  abstract: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
  nature: ['#2E8B57', '#3CB371', '#98FB98', '#8FBC8F', '#00FA9A'],
  tech: ['#4169E1', '#1E90FF', '#00BFFF', '#87CEEB', '#4682B4'],
  sunset: ['#FF6B6B', '#FFA726', '#FFEAA7', '#FD79A8', '#E17055'],
  ocean: ['#0077B6', '#00B4D8', '#90E0EF', '#CAF0F8', '#03045E']
};

// Generate AI Image Function
function generateAIImage(prompt, style = 'abstract') {
  const canvas = createCanvas(800, 600);
  const ctx = canvas.getContext('2d');
  const colors = aiTemplates[style] || aiTemplates.abstract;

  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, 800, 600);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(1, colors[1]);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 800, 600);

  // Add AI-generated shapes
  generateAIShapes(ctx, colors);
  
  // Add prompt text
  addAIText(ctx, prompt, colors);
  
  // Add AI signature
  addAISignature(ctx);

  return canvas;
}

function generateAIShapes(ctx, colors) {
  // Generate random AI patterns
  for (let i = 0; i < 20; i++) {
    const shapeType = Math.floor(Math.random() * 4);
    const x = Math.random() * 800;
    const y = Math.random() * 600;
    const size = 10 + Math.random() * 100;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const alpha = 0.2 + Math.random() * 0.5;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;

    switch (shapeType) {
      case 0: // Circles
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 1: // Rectangles
        ctx.fillRect(x, y, size, size * 0.6);
        break;
      case 2: // Triangles
        ctx.beginPath();
        ctx.moveTo(x, y - size / 2);
        ctx.lineTo(x - size / 2, y + size / 2);
        ctx.lineTo(x + size / 2, y + size / 2);
        ctx.closePath();
        ctx.fill();
        break;
      case 3: // Lines
        ctx.lineWidth = 2 + Math.random() * 8;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + size, y + (Math.random() - 0.5) * 100);
        ctx.stroke();
        break;
    }
    ctx.restore();
  }
}

function addAIText(ctx, prompt, colors) {
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Wrap text
  const words = prompt.split(' ');
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const testLine = currentLine + ' ' + words[i];
    if (ctx.measureText(testLine).width < 700) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = words[i];
    }
  }
  lines.push(currentLine);

  // Draw text with shadow
  const lineHeight = 40;
  const startY = 300 - (lines.length * lineHeight) / 2;

  lines.forEach((line, index) => {
    // Text shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillText(line, 402, startY + (index * lineHeight) + 2);
    
    // Main text
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(line, 400, startY + (index * lineHeight));
  });
}

function addAISignature(ctx) {
  ctx.font = '16px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.textAlign = 'center';
  ctx.fillText(`AI Generated • ${new Date().toLocaleDateString()} • Dynamic Art`, 400, 580);
}

// Generate dynamic filename
function generateFilename(prompt, style) {
  const timestamp = new Date();
  const dateStr = timestamp.toISOString().split('T')[0];
  const timeStr = timestamp.toTimeString().split(' ')[0].replace(/:/g, '-');
  const promptShort = prompt.split(' ').slice(0, 3).join('-').toLowerCase();
  const randomId = uuidv4().slice(0, 6);
  
  return `ai-${style}-${dateStr}-${timeStr}-${promptShort}-${randomId}.png`;
}

// API Routes
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, style = 'abstract' } = req.body;
    
    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Prompt is required' 
      });
    }

    // Generate dynamic filename
    const filename = generateFilename(prompt, style);
    const filePath = join(imagesDir, filename);

    // Create AI image
    const canvas = generateAIImage(prompt, style);
    const buffer = canvas.toBuffer('image/png');
    writeFileSync(filePath, buffer);

    res.json({
      success: true,
      filename: filename,
      prompt: prompt,
      style: style,
      url: `http://localhost:${PORT}/images/${filename}`,
      timestamp: new Date().toISOString(),
      message: 'AI image generated successfully!'
    });

  } catch (error) {
    console.error('AI Generation Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'AI failed to generate image' 
    });
  }
});

app.get('/api/images', (req, res) => {
  try {
    const files = readdirSync(imagesDir)
      .filter(file => file.endsWith('.png'))
      .map(file => {
        const filePath = join(imagesDir, file);
        return {
          filename: file,
          url: `http://localhost:${PORT}/images/${file}`,
          created: new Date().toISOString(),
          size: `${(require('fs').statSync(filePath).size / 1024).toFixed(1)} KB`
        };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created));

    res.json({
      success: true,
      count: files.length,
      images: files
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load images' 
    });
  }
});

app.get('/api/styles', (req, res) => {
  res.json({
    success: true,
    styles: Object.keys(aiTemplates).map(style => ({
      name: style,
      colors: aiTemplates[style],
      displayName: style.charAt(0).toUpperCase() + style.slice(1)
    }))
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'AI Image Generator',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 AI Image Generator Backend running on http://localhost:${PORT}`);
  console.log(`📁 Images saved to: ${imagesDir}`);
  console.log(`🎨 Available styles: ${Object.keys(aiTemplates).join(', ')}`);
});