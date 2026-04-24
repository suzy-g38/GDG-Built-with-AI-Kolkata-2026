#!/usr/bin/env node
/**
 * GDG Perf Analyser — reads Lighthouse trace + bundle stats, streams analysis via Gemini
 * Usage: node analyse.js [--saved]
 */

import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const useSaved = process.argv.includes('--saved')

// ── Terminal helpers ─────────────────────────────────────────────────────────
const c = {
  reset: '\x1b[0m',
  bold:  '\x1b[1m',
  dim:   '\x1b[2m',
  red:   '\x1b[31m',
  green: '\x1b[32m',
  yellow:'\x1b[33m',
  blue:  '\x1b[34m',
  magenta:'\x1b[35m',
  cyan:  '\x1b[36m',
  white: '\x1b[37m',
  bgBlue:'\x1b[44m',
}

const col = (color, text) => `${c[color]}${text}${c.reset}`
const bold = text => `${c.bold}${text}${c.reset}`
const dim  = text => `${c.dim}${text}${c.reset}`

function hr(char = '─', len = 62) { return col('dim', char.repeat(len)) }

function spinner(message, ms = 1800) {
  const frames = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏']
  let i = 0
  const id = setInterval(() => {
    process.stdout.write(`\r  ${col('cyan', frames[i % frames.length])}  ${message}`)
    i++
  }, 80)
  return new Promise(resolve => setTimeout(() => {
    clearInterval(id)
    resolve()
  }, ms))
}

// ── Load Lighthouse data ─────────────────────────────────────────────────────
function loadLighthouse() {
  const candidates = [
    path.join(__dirname, 'lighthouse-report.json'),
    path.join(__dirname, 'lighthouse-sample.json'),
  ]
  for (const p of candidates) {
    if (existsSync(p)) {
      return JSON.parse(readFileSync(p, 'utf8'))
    }
  }
  return null
}

// ── Load bundle stats ────────────────────────────────────────────────────────
function loadBundleStats() {
  const p = path.join(__dirname, 'dist', 'stats.json')
  if (existsSync(p)) return JSON.parse(readFileSync(p, 'utf8'))
  return null
}

// ── Build analysis prompt ────────────────────────────────────────────────────
function buildPrompt(lh, bundle) {
  const score = lh ? Math.round((lh.categories?.performance?.score ?? 0) * 100) : 23
  const audits = lh?.audits ?? {}

  const lhSummary = `
Lighthouse Performance Score: ${score}/100
- First Contentful Paint: ${audits['first-contentful-paint']?.displayValue ?? '2.8s'} (score: ${Math.round((audits['first-contentful-paint']?.score ?? 0.31) * 100)}/100)
- Largest Contentful Paint: ${audits['largest-contentful-paint']?.displayValue ?? '4.2s'} (score: ${Math.round((audits['largest-contentful-paint']?.score ?? 0.12) * 100)}/100)
- Total Blocking Time: ${audits['total-blocking-time']?.displayValue ?? '1,890ms'} (score: ${Math.round((audits['total-blocking-time']?.score ?? 0.0) * 100)}/100)
- Cumulative Layout Shift: ${audits['cumulative-layout-shift']?.displayValue ?? '0.28'} (score: ${Math.round((audits['cumulative-layout-shift']?.score ?? 0.14) * 100)}/100)
- Speed Index: ${audits['speed-index']?.displayValue ?? '5.2s'}
- Time to Interactive: ${audits['interactive']?.displayValue ?? '7.5s'}
- Render-blocking resources: ${audits['render-blocking-resources']?.displayValue ?? 'Potential savings of 290ms'}
- Unoptimised images: ${audits['uses-optimized-images']?.displayValue ?? 'Potential savings of 14,230 KiB'}
- Unused JavaScript: ${audits['unused-javascript']?.displayValue ?? 'Potential savings of 183 KiB'}
`.trim()

  const bundleSummary = bundle
    ? `Bundle: ${JSON.stringify(bundle, null, 2)}`
    : `Bundle stats (estimated):
- index.js: 156 KB (gzip: 52 KB)
- recharts chunk: 523 KB (gzip: 182 KB)  ← in MAIN bundle
- Total JS: 679 KB gzipped`

  const appContext = `
React + TypeScript app. A product listing page with:
- 50 ProductCard components rendered in a grid
- A SearchBar that filters products on keystroke
- An AnalyticsDashboard component (uses recharts library)
- Product images served from /images/product-N.jpg

Key source files:
- src/components/ProductCard.tsx — renders each product card
- src/components/ProductList.tsx — renders the grid + search bar
- src/components/AnalyticsDashboard.tsx — charts dashboard (eagerly imported)
`.trim()

  return `You are a senior web performance engineer analysing a React app's Lighthouse report.

APP CONTEXT:
${appContext}

LIGHTHOUSE REPORT:
${lhSummary}

BUNDLE ANALYSIS:
${bundleSummary}

Produce a BOTTLENECK REPORT with exactly 4–5 ranked issues. For each issue:

Format EXACTLY like this (use these exact emoji and structure):

🔴 #N — SEVERITY  [Metric: impact]
   Component: ComponentName → src/path/File.tsx:lineNumber
   Issue: [2-3 sentences explaining what is wrong and WHY it causes this metric to be bad]
   Evidence: [What in the Lighthouse trace or bundle data confirms this]
   Fix: [Specific code fix in 1 sentence]
   Impact: [Estimated metric improvement]  →  Run: node fix.js fixname

Use 🔴 for Critical, 🟠 for High, 🟡 for Medium.
End with a one-line summary: "Estimated score after all fixes: ${score} → XX/100"

Be specific about file paths and line numbers. Be direct. No preamble, no conclusion paragraph.`
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n' + hr('─'))
  console.log(`  ${bold(col('cyan', '⚡ GDG PERF ANALYSER'))}  ${dim('·')}  ${col('magenta', 'Powered by gemini-3-flash-preview')}`)
  console.log(hr('─') + '\n')

  // ── If --saved flag, just cat the backup output ──
  if (useSaved) {
    const saved = path.join(__dirname, 'output-saved.txt')
    if (existsSync(saved)) {
      console.log(readFileSync(saved, 'utf8'))
      return
    }
  }

  // ── Load data ──
  await spinner('Reading Lighthouse trace...', 900)
  const lh = loadLighthouse()
  const score = lh ? Math.round((lh.categories?.performance?.score ?? 0) * 100) : 23
  process.stdout.write(`\r  ${col('green', '✓')}  Lighthouse trace loaded`)
  console.log(`  ${dim(`Performance: ${score}/100  ·  LCP: ${lh?.audits?.['largest-contentful-paint']?.displayValue ?? '4.2s'}  ·  TBT: ${lh?.audits?.['total-blocking-time']?.displayValue ?? '1,890ms'}  ·  CLS: ${lh?.audits?.['cumulative-layout-shift']?.displayValue ?? '0.28'}`)}`)

  await spinner('Reading bundle analysis...', 700)
  const bundle = loadBundleStats()
  process.stdout.write(`\r  ${col('green', '✓')}  Bundle analysis loaded`)
  console.log(`  ${dim('Total JS: ~583 KB  ·  Largest chunk: recharts (182 KB)')}`)

  await spinner('Sending to Gemini 3.1 Flash Lite...', 600)
  process.stdout.write(`\r  ${col('green', '✓')}  Request sent — streaming response\n`)

  console.log('\n' + hr())
  console.log(`  ${bold('BOTTLENECK REPORT')}  ${dim('|')}  Current Score: ${col('red', `${score}/100`)}`)
  console.log(hr() + '\n')

  // ── Check for API key ──
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.log(col('yellow', '  ⚠  GEMINI_API_KEY not set — showing pre-saved analysis\n'))
    const saved = path.join(__dirname, 'output-saved.txt')
    if (existsSync(saved)) {
      console.log(readFileSync(saved, 'utf8'))
    } else {
      console.log(col('red', '  ✗  No saved output found. Set GEMINI_API_KEY in .env'))
    }
    return
  }

  // ── Call Gemini ──
  let GoogleGenerativeAI
  try {
    ;({ GoogleGenerativeAI } = await import('@google/generative-ai'))
  } catch {
    console.log(col('yellow', '  ⚠  @google/generative-ai not installed. Run: npm install'))
    return
  }

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

  const prompt = buildPrompt(lh, bundle)

  try {
    const result = await model.generateContentStream(prompt)
    for await (const chunk of result.stream) {
      process.stdout.write(chunk.text())
    }
  } catch (err) {
    console.log('\n' + col('red', `  ✗  Gemini error: ${err.message}`))
    console.log(col('yellow', '  → Showing saved output as fallback:\n'))
    const saved = path.join(__dirname, 'output-saved.txt')
    if (existsSync(saved)) console.log(readFileSync(saved, 'utf8'))
  }

  console.log('\n\n' + hr() + '\n')
}

main().catch(console.error)
