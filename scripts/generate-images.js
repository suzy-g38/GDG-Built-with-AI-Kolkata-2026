#!/usr/bin/env node
/**
 * Generates 10 large JPEG product images using sharp
 * Creates gradient images that are realistically large (~300-500KB each)
 * Usage: npm run generate-images
 */

import { mkdirSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outputDir = path.join(__dirname, '..', 'public', 'images')

const c = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m', red: '\x1b[31m',
}
const col  = (color, text) => `${c[color]}${text}${c.reset}`
const bold = text => `${c.bold}${text}${c.reset}`

const PALETTES = [
  { from: [99, 102, 241], to: [139, 92, 246] },   // indigo → violet
  { from: [236, 72, 153], to: [239, 68, 68] },     // pink → red
  { from: [16, 185, 129], to: [59, 130, 246] },    // emerald → blue
  { from: [245, 158, 11], to: [249, 115, 22] },    // amber → orange
  { from: [139, 92, 246], to: [236, 72, 153] },    // violet → pink
  { from: [59, 130, 246], to: [16, 185, 129] },    // blue → emerald
  { from: [249, 115, 22], to: [234, 179, 8] },     // orange → yellow
  { from: [239, 68, 68], to: [245, 158, 11] },     // red → amber
  { from: [20, 184, 166], to: [99, 102, 241] },    // teal → indigo
  { from: [168, 85, 247], to: [20, 184, 166] },    // purple → teal
]

const W = 1200
const H = 1200

function lerp(a, b, t) { return Math.round(a + (b - a) * t) }

function generatePixels(palette, imageIndex) {
  const pixels = Buffer.alloc(W * H * 3)
  const { from, to } = palette

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const t = (x / W + y / H) / 2

      // Add fine noise to prevent JPEG from compressing too aggressively
      const noise = ((x * 7 + y * 13 + imageIndex * 31) % 17) - 8

      const idx = (y * W + x) * 3
      pixels[idx]     = Math.min(255, Math.max(0, lerp(from[0], to[0], t) + noise))
      pixels[idx + 1] = Math.min(255, Math.max(0, lerp(from[1], to[1], t) + noise))
      pixels[idx + 2] = Math.min(255, Math.max(0, lerp(from[2], to[2], t) + noise))
    }
  }
  return pixels
}

async function main() {
  console.log('\n' + col('dim', '─'.repeat(62)))
  console.log(`  ${bold(col('cyan', '🎨 IMAGE GENERATOR'))}  ${col('dim', '·')}  creating 10 large JPEGs`)
  console.log(col('dim', '─'.repeat(62)) + '\n')

  let sharp
  try {
    ;({ default: sharp } = await import('sharp'))
  } catch {
    console.log(col('yellow', '  ⚠  sharp not installed. Run: npm install sharp\n'))
    process.exit(1)
  }

  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true })

  for (let i = 1; i <= 10; i++) {
    const outPath = path.join(outputDir, `product-${i}.jpg`)
    process.stdout.write(`  Generating product-${i}.jpg ... `)

    const pixels = generatePixels(PALETTES[i - 1], i)

    await sharp(pixels, { raw: { width: W, height: H, channels: 3 } })
      .jpeg({ quality: 92, mozjpeg: false })
      .toFile(outPath)

    const { size } = await import('fs').then(fs => ({ size: fs.statSync(outPath).size }))
    console.log(`${col('green', '✓')}  ${col('dim', `${Math.round(size / 1024)}KB`)}`)
  }

  console.log(`\n  ${col('green', '✓')}  10 images generated in public/images/`)
  console.log(`  ${col('dim', 'These are intentionally large (1200×1200px) to demonstrate the perf issue.')}`)
  console.log(`  ${col('dim', 'Run optimize-images.js after the demo to see the savings.')}`)
  console.log(col('dim', '\n' + '─'.repeat(62) + '\n'))
}

main().catch(console.error)
