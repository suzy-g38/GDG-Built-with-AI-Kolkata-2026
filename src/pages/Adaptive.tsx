import { useState, useEffect } from 'react'
import { NetworkIndicator } from '../components/NetworkIndicator'
import { useNetworkQuality } from '../hooks/useNetworkQuality'
import { products } from '../data/products'
import { NetworkQuality } from '../types'

const qualityConfig = {
  fast:   { label: 'Full Quality · 1200px JPEG',   bytes: '487 KB', tag: 'FULL RES' },
  medium: { label: 'Optimised · 600px WebP',        bytes: '42 KB',  tag: '600px WebP' },
  slow:   { label: 'Low-bandwidth · 150px WebP',    bytes: '8 KB',   tag: '150px WebP' },
}

function AdaptiveCard({ product, quality }: { product: typeof products[0]; quality: NetworkQuality }) {
  const cfg = qualityConfig[quality]
  return (
    <div className={`adaptive-card quality-${quality}`}>
      <div className="adaptive-image-container">
        <img
          src={product.image}
          alt={product.name}
          className="adaptive-img"
          width={280}
          height={280}
          loading="lazy"
        />
        <span className="img-quality-tag">{cfg.tag} · {cfg.bytes}</span>
      </div>
      <div className="adaptive-body">
        <p className="adaptive-name">{product.name}</p>
        <p className="adaptive-price">${product.price}</p>
      </div>
    </div>
  )
}

// Chrome AI console interaction log
function ChromeAiPanel({ quality, source }: { quality: NetworkQuality; source: string }) {
  const [available, setAvailable] = useState<boolean | null>(null)
  const [log, setLog] = useState<string[]>([])

  useEffect(() => {
    const win = window as typeof window & {
      ai?: { languageModel?: unknown; assistant?: unknown }
      LanguageModel?: unknown
    }
    const hasAI = !!(win.ai?.languageModel ?? win.ai?.assistant ?? win.LanguageModel)
    setAvailable(hasAI)

    const lines = hasAI
      ? [
          '> const session = await window.ai.languageModel.create()',
          '  ✓ session created (Gemini Nano, on-device)',
          '',
          '> await session.prompt("Is slow-3g acceptable for product images?")',
          `  "${quality === 'slow' ? 'No — serve compressed WebP at reduced resolution.' : 'Yes — full quality assets appropriate.'}"`,
          '',
          `  ↳ no network request made  ·  latency: <5ms  ·  source: on-device`,
        ]
      : [
          '> await window.ai?.languageModel?.create()',
          '  undefined  ← Chrome AI not available',
          '',
          '  Enable in chrome://flags:',
          '  • #optimization-guide-on-device-model',
          '  • #prompt-api-for-gemini-nano',
          '',
          '  ↳ falling back to Network Information API heuristic',
        ]

    let i = 0
    const id = setInterval(() => {
      if (i < lines.length) { setLog(prev => [...prev, lines[i]]); i++ }
      else clearInterval(id)
    }, 160)
    return () => clearInterval(id)
  }, [quality])

  return (
    <div className="chrome-ai-panel">
      <div className="chrome-ai-header">
        <span className="chrome-ai-title">
          <span>🌐</span> Chrome DevTools Console
        </span>
        <span className={available ? 'ai-available' : 'ai-unavailable'}>
          {available === null ? '…' : available ? '✓ Chrome AI available' : '⚠ Chrome AI not available'}
        </span>
      </div>
      {log.map((line, i) => (
        <div key={i} className="ai-log-line">
          {!line ? <br /> : line.startsWith('>') ? <span className="prompt">{line}</span>
            : line.startsWith('  ✓') || line.startsWith('  ↳') ? <span className="response">{line}</span>
            : line.startsWith('  "') ? <span className="response">{line}</span>
            : line.startsWith('  Enable') || line.startsWith('  •') ? <span className="comment">{line}</span>
            : <span>{line}</span>}
        </div>
      ))}
    </div>
  )
}

export default function Adaptive() {
  const [override, setOverride] = useState<'auto' | NetworkQuality>('auto')
  const { quality, source } = useNetworkQuality(override)

  const displayProducts = products.slice(0, 12)

  return (
    <div className="adaptive-page">
      <NetworkIndicator quality={quality} source={source} />

      <div className="page-hero">
        <h1>
          <span className="gradient-text">Adaptive Loading</span>
        </h1>
        <p>
          A tiny model running in this tab infers your network quality and adjusts
          asset delivery — no server round-trip, no API key, no privacy trade-off.
        </p>
      </div>

      <ChromeAiPanel quality={quality} source={source} />

      <div className="section-label">Simulate network condition</div>

      <div className="quality-controls">
        {(['auto', 'fast', 'medium', 'slow'] as const).map(q => (
          <button
            key={q}
            className={`quality-btn ${override === q ? 'active' : ''}`}
            onClick={() => setOverride(q)}
          >
            {q === 'auto' ? '⚡ Auto Detect' : q === 'fast' ? '🟢 Fast 4G' : q === 'medium' ? '🟡 Slow 3G' : '🔴 2G / Slow'}
          </button>
        ))}
      </div>

      {quality === 'slow' && (
        <div className="bandwidth-banner">
          ⚠️ Low-bandwidth mode active — serving optimised assets · saving ~23MB of images
        </div>
      )}

      {quality === 'medium' && (
        <div className="bandwidth-banner" style={{ background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)', color: '#fde68a' }}>
          🟡 Medium bandwidth detected — serving WebP at reduced resolution
        </div>
      )}

      <div className="section-label" style={{ marginTop: '1.5rem' }}>
        Product grid · {qualityConfig[quality].label}
      </div>

      <div className="product-grid">
        {displayProducts.map(product => (
          <AdaptiveCard key={product.id} product={product} quality={quality} />
        ))}
      </div>
    </div>
  )
}
