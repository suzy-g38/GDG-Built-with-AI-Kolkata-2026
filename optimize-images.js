#!/usr/bin/env node
/**
 * Image optimizer — converts large JPEGs to WebP at multiple sizes
 * Usage: node optimize-images.js
 */

import { existsSync, mkdirSync, readdirSync, statSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const inputDir  = path.join(__dirname, 'public', 'images')
const outputDir = path.join(__dirname, 'public', 'images')

const c = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m',
}
const col  = (color, text) => `${c[color]}${text}${c.reset}`
const bold = text => `${c.bold}${text}${c.reset}`

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

async function main() {
  console.log('\n' + col('dim', '─'.repeat(62)))
  console.log(`  ${bold(col('cyan', '🖼  IMAGE OPTIMISER'))}  ${col('dim', '·')}  ${col('dim', 'sharp + WebP')}`)
  console.log(col('dim', '─'.repeat(62)) + '\n')

  let sharp
  try {
    ;({ default: sharp } = await import('sharp'))
  } catch {
    console.log(col('yellow', '  ⚠  sharp not installed. Run: npm install sharp'))
    console.log(col('dim', '  (Skipping image optimization — app will still work with original JPEGs)\n'))
    return
  }

  if (!existsSync(inputDir)) {
    console.log(col('yellow', `  ⚠  No images directory found at ${inputDir}`))
    console.log(col('dim', '  Run: npm run generate-images\n'))
    return
  }

  const jpegFiles = readdirSync(inputDir).filter(f => f.endsWith('.jpg') && f.startsWith('product-'))

  if (jpegFiles.length === 0) {
    console.log(col('yellow', '  ⚠  No product JPEG files found. Run: npm run generate-images\n'))
    return
  }

  console.log(`  Found ${jpegFiles.length} images to optimise\n`)

  let totalOriginal = 0
  let totalOptimised = 0

  for (const file of jpegFiles) {
    const inputPath = path.join(inputDir, file)
    const baseName  = file.replace('.jpg', '')
    const out300    = path.join(outputDir, `${baseName}-300w.webp`)
    const out600    = path.join(outputDir, `${baseName}-600w.webp`)

    const origSize = statSync(inputPath).size
    totalOriginal += origSize

    process.stdout.write(`  ${col('dim', baseName + '.jpg')}  ${formatBytes(origSize).padStart(8)}  →  `)

    await sharp(inputPath)
      .resize(300, 300, { fit: 'cover', position: 'center' })
      .webp({ quality: 82 })
      .toFile(out300)

    await sharp(inputPath)
      .resize(600, 600, { fit: 'cover', position: 'center' })
      .webp({ quality: 85 })
      .toFile(out600)

    const size300 = statSync(out300).size
    const size600 = statSync(out600).size
    totalOptimised += size300 + size600

    const saving = Math.round((1 - size300 / origSize) * 100)
    console.log(`${col('green', formatBytes(size300))} WebP300  ${col('green', formatBytes(size600))} WebP600  ${col('cyan', `−${saving}%`)}`)
  }

  console.log()
  console.log(`  ${col('dim', 'Total original:  ')} ${formatBytes(totalOriginal)}`)
  console.log(`  ${col('dim', 'Total optimised: ')} ${formatBytes(totalOptimised)}`)
  console.log(`  ${col('green', bold('Savings: ' + Math.round((1 - totalOptimised / totalOriginal) * 100) + '%'))}`)
  console.log()
  console.log(`  ${col('green', '✓')}  WebP files written to public/images/`)
  console.log(col('dim', '\n' + '─'.repeat(62) + '\n'))
}

main().catch(console.error)
