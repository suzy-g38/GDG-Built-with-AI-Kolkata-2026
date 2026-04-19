#!/usr/bin/env node
/**
 * Demo reset — restores the broken state instantly
 * Usage: node reset.js
 *
 * Run this between demo attempts or if something goes wrong on stage.
 */

import { copyFileSync, existsSync, readdirSync, unlinkSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const c = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m',
}
const col  = (color, text) => `${c[color]}${text}${c.reset}`
const bold = text => `${c.bold}${text}${c.reset}`

const RESTORES = [
  { from: '_broken/ProductCard.tsx', to: 'src/components/ProductCard.tsx' },
  { from: '_broken/ProductList.tsx', to: 'src/components/ProductList.tsx' },
]

function main() {
  console.log('\n' + col('dim', '─'.repeat(62)))
  console.log(`  ${bold(col('yellow', '🔄 DEMO RESET'))}  ${col('dim', '·')}  restoring broken state`)
  console.log(col('dim', '─'.repeat(62)) + '\n')

  let ok = true
  for (const { from, to } of RESTORES) {
    const src = path.join(__dirname, from)
    const dst = path.join(__dirname, to)
    if (!existsSync(src)) {
      console.log(`  ${col('red', '✗')}  Backup not found: ${from}`)
      ok = false
      continue
    }
    copyFileSync(src, dst)
    console.log(`  ${col('green', '✓')}  Restored ${col('cyan', to)}`)
  }

  // Remove optimised WebP files (reset to unoptimised state)
  const imagesDir = path.join(__dirname, 'public', 'images')
  if (existsSync(imagesDir)) {
    const webps = readdirSync(imagesDir).filter(f => f.endsWith('.webp'))
    if (webps.length > 0) {
      webps.forEach(f => unlinkSync(path.join(imagesDir, f)))
      console.log(`  ${col('green', '✓')}  Removed ${webps.length} optimised WebP files`)
    }
  }

  if (ok) {
    console.log(`\n  ${col('green', bold('✓ Reset complete — app is back in broken state'))}`)
    console.log(`  ${col('dim', 'Vite will hot-reload automatically.')}\n`)
  } else {
    console.log(`\n  ${col('yellow', '⚠  Some files could not be restored — check _broken/ directory')}\n`)
  }

  console.log(col('dim', '─'.repeat(62) + '\n'))
}

main()
