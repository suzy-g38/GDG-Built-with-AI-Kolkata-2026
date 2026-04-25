#!/usr/bin/env node
/**
 * Live fix generator — calls Gemini to fix a specific performance issue
 * Usage:
 *   node fix.js productcard-memo   — wrap ProductCard in React.memo + useMemo
 *   node fix.js images             — add lazy loading, srcset, WebP references
 *   node fix.js codesplit          — convert AnalyticsDashboard to React.lazy
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load .env.local if present (Node doesn't auto-load env files)
const envFile = path.join(__dirname, '.env.local')
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const [key, ...rest] = line.split('=')
    if (key && rest.length && !process.env[key.trim()]) {
      process.env[key.trim()] = rest.join('=').trim()
    }
  }
}


const c = {
  reset:  '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  red:    '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue:   '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m',
}
const col  = (color, text) => `${c[color]}${text}${c.reset}`
const bold = text => `${c.bold}${text}${c.reset}`
const dim  = text => `${c.dim}${text}${c.reset}`
function hr(len = 62) { return col('dim', '─'.repeat(len)) }

function spinner(msg, ms = 1400) {
  const frames = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏']
  let i = 0
  const id = setInterval(() => {
    process.stdout.write(`\r  ${col('cyan', frames[i % frames.length])}  ${msg}`)
    i++
  }, 80)
  return new Promise(r => setTimeout(() => { clearInterval(id); r() }, ms))
}

// ── Fix configs ──────────────────────────────────────────────────────────────
const FIX_CONFIGS = {
  'productcard-memo': {
    title: 'ProductCard — React.memo + useMemo',
    target: 'src/components/ProductCard.tsx',
    fallback: 'fixes/ProductCard.fixed.tsx',
    prompt: (code) => `You are a React performance expert.

Here is a React component with performance issues:

\`\`\`tsx
${code}
\`\`\`

Apply these exact fixes:
1. Wrap the component export with React.memo: export const ProductCard = React.memo(function ProductCard...)
2. The getPriceCategory function runs a 100,000-iteration loop. Move it outside the component body entirely (as a standalone function before the component) and wrap the call inside the component with useMemo: const priceInfo = useMemo(() => getPriceCategory(product.price), [product.price])
3. Add import { useMemo } from 'react' (replace the existing react import).
4. Add explicit width={280} height={280} attributes to the <img> tag to prevent CLS.
5. Remove the inline cardStyle object. Use a CSS class or just remove it.
6. Add import React from 'react' if not present (needed for React.memo).

Return ONLY the complete fixed TypeScript file. No markdown code fences. No explanation. No comments about what changed. Start directly with the import statements.`,
    summary: [
      '+ React.memo wrapper (prevents re-render when parent re-renders)',
      '+ useMemo for getPriceCategory (calculation runs once per price change)',
      '+ width/height on <img> (prevents CLS)',
      '- removed inline style object',
    ],
  },

  'images': {
    title: 'Image optimisation — lazy loading + WebP srcset',
    target: 'src/components/ProductCard.tsx',
    fallback: 'fixes/ProductCard.images.fixed.tsx',
    runAfter: async () => {
      console.log('\n' + hr())
      console.log(`  ${bold('Running image optimiser...')}`)
      console.log(hr())
      try {
        execSync('node optimize-images.js', { stdio: 'inherit', cwd: __dirname })
      } catch {
        console.log(col('yellow', '  ⚠  optimize-images.js failed. Make sure sharp is installed: npm install sharp'))
      }
    },
    prompt: (code) => `You are a React performance expert.

Here is a React ProductCard component:

\`\`\`tsx
${code}
\`\`\`

Apply these image optimisation fixes:
1. Add loading="lazy" to the <img> tag.
2. Add explicit width={280} and height={280} to the <img> tag.
3. Add a srcset attribute pointing to WebP versions:
   srcset={\`\${product.image.replace('.jpg', '-300w.webp')} 300w, \${product.image} 1200w\`}
4. Add sizes="(max-width: 600px) 280px, 300px" to the <img> tag.
5. Keep all other logic and structure unchanged.

Return ONLY the complete fixed TypeScript file. No markdown fences. No explanation. Start directly with imports.`,
    summary: [
      '+ loading="lazy" on all product images',
      '+ width/height attributes (prevents CLS)',
      '+ srcset with WebP variants (up to 94% smaller)',
      '+ sizes hint for responsive loading',
    ],
  },

  'codesplit': {
    title: 'Code splitting — React.lazy for AnalyticsDashboard',
    target: 'src/components/ProductList.tsx',
    fallback: 'fixes/ProductList.fixed.tsx',
    prompt: (code) => `You are a React performance expert.

Here is a React component that eagerly imports a heavy dependency:

\`\`\`tsx
${code}
\`\`\`

Apply these code-splitting fixes:
1. Remove the direct import of AnalyticsDashboard at the top.
2. Add: import React, { useState, lazy, Suspense } from 'react'
3. Add this lazy import after the imports: const AnalyticsDashboard = lazy(() => import('./AnalyticsDashboard'))
4. Wrap the {showAnalytics && <AnalyticsDashboard ... />} usage in a Suspense boundary:
   <Suspense fallback={<div className="analytics-loader"><span className="spinner" />Loading analytics...</div>}>
     {showAnalytics && <AnalyticsDashboard products={products} />}
   </Suspense>
5. The handleSearch function should be wrapped in useCallback:
   const handleSearch = useCallback((value: string) => { setSearchTerm(value) }, [])
   Import useCallback from react.
6. Keep all other logic unchanged.

Return ONLY the complete fixed TypeScript file. No markdown fences. No explanation. Start directly with imports.`,
    summary: [
      '+ React.lazy() for AnalyticsDashboard (recharts now in separate chunk)',
      '+ Suspense fallback while chunk loads',
      '+ useCallback on handleSearch (stable reference for all 50 cards)',
      '- recharts removed from main bundle (~182 KB)',
    ],
  },
}

// ── Clean Gemini output ──────────────────────────────────────────────────────
function cleanCode(raw) {
  const fenced = raw.match(/```(?:tsx?|jsx?|typescript)?\n?([\s\S]*?)```/)
  return (fenced ? fenced[1] : raw).trim()
}

// ── Apply pre-baked fallback ─────────────────────────────────────────────────
function applyFallback(config) {
  const fallback = path.join(__dirname, config.fallback)
  if (!existsSync(fallback)) {
    console.log(col('red', `  ✗  Fallback file not found: ${config.fallback}`))
    return false
  }
  copyFileSync(fallback, path.join(__dirname, config.target))
  return true
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const fixName = process.argv[2]

  if (!fixName || !FIX_CONFIGS[fixName]) {
    console.log(`\n  Usage: node fix.js <fixname>\n`)
    console.log(`  Available fixes:`)
    Object.entries(FIX_CONFIGS).forEach(([key, cfg]) => {
      console.log(`    ${col('cyan', key.padEnd(22))} ${dim(cfg.title)}`)
    })
    console.log()
    process.exit(1)
  }

  const config = FIX_CONFIGS[fixName]

  console.log('\n' + hr())
  console.log(`  ${bold(col('cyan', '🔧 FIX GENERATOR'))}  ${dim('·')}  ${col('magenta', config.title)}`)
  console.log(hr() + '\n')

  const targetPath = path.join(__dirname, config.target)
  if (!existsSync(targetPath)) {
    console.log(col('red', `  ✗  Target not found: ${config.target}`))
    process.exit(1)
  }

  await spinner(`Reading ${config.target}...`, 600)
  const sourceCode = readFileSync(targetPath, 'utf8')
  const lineCount = sourceCode.split('\n').length
  process.stdout.write(`\r  ${col('green', '✓')}  Component loaded  ${dim(`(${lineCount} lines)`)}`)
  console.log()

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.log(col('yellow', '\n  ⚠  GEMINI_API_KEY not set — applying pre-baked fix\n'))
    if (applyFallback(config)) {
      console.log(`  ${col('green', '✓')}  Applied pre-baked fix to ${col('cyan', config.target)}`)
    }
    showSummary(config)
    return
  }

  let GoogleGenerativeAI
  try {
    ;({ GoogleGenerativeAI } = await import('@google/generative-ai'))
  } catch {
    console.log(col('yellow', '  ⚠  @google/generative-ai not installed — applying pre-baked fix'))
    if (applyFallback(config)) {
      console.log(`  ${col('green', '✓')}  Applied pre-baked fix to ${col('cyan', config.target)}`)
    }
    showSummary(config)
    return
  }

  await spinner('Sending to Gemini 3.1 Flash Lite...', 500)
  process.stdout.write(`\r  ${col('green', '✓')}  Request sent — streaming fix\n`)

  console.log('\n' + hr())
  console.log(`  ${bold('GENERATED FIX')} ${dim('(streaming)')}`)
  console.log(hr() + '\n')

  const genAI = new GoogleGenerativeAI(apiKey)

  const model = genAI.getGenerativeModel({
  model: 'gemini-3.1-flash-lite-preview', 
  generationConfig: { 
    temperature: 0,        
    topP: 0.1, 
    maxOutputTokens: 5000, 
    responseMimeType: "text/plain" 
  },
})

  let fullResponse = ''
  try {
    const result = await model.generateContentStream(config.prompt(sourceCode))
    for await (const chunk of result.stream) {
      const text = chunk.text()
      process.stdout.write(text)
      fullResponse += text
    }
  } catch (err) {
    console.log('\n' + col('red', `  ✗  Gemini error: ${err.message}`))
    console.log(col('yellow', '  → Applying pre-baked fallback\n'))
    if (applyFallback(config)) {
      console.log(`  ${col('green', '✓')}  Applied pre-baked fix to ${col('cyan', config.target)}`)
    }
    showSummary(config)
    return
  }

  const cleanedCode = cleanCode(fullResponse)
  if (!cleanedCode.includes('import') || !cleanedCode.includes('export')) {
    console.log('\n' + col('yellow', '  ⚠  Response looks incomplete — applying pre-baked fallback'))
    if (applyFallback(config)) {
      console.log(`  ${col('green', '✓')}  Applied pre-baked fix to ${col('cyan', config.target)}`)
    }
  } else {
    writeFileSync(targetPath, cleanedCode + '\n', 'utf8')
    console.log()
  }

  console.log('\n' + hr())
  console.log(`  ${col('green', '✓')}  File updated: ${col('cyan', config.target)}`)

  showSummary(config)

  if (config.runAfter) {
    await config.runAfter()
  }

  console.log(`\n  ${col('green', '🔥 Vite will hot-reload automatically')}\n`)
  console.log(hr() + '\n')
}

function showSummary(config) {
  console.log('\n  Changes:')
  config.summary.forEach(line => {
    const color = line.startsWith('+') ? 'green' : line.startsWith('-') ? 'red' : 'yellow'
    console.log(`    ${col(color, line)}`)
  })
}

main().catch(console.error)
