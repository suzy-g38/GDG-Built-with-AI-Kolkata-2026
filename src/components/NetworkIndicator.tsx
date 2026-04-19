import { NetworkQuality, NetworkSource } from '../types'

interface Props {
  quality: NetworkQuality
  source: NetworkSource
}

const labels: Record<NetworkQuality, string> = {
  fast: 'Fast 4G',
  medium: 'Slow 3G',
  slow: '2G / Offline',
}

export function NetworkIndicator({ quality, source }: Props) {
  return (
    <div className="network-indicator">
      <div className={`quality-badge ${quality}`}>
        <span className="quality-dot" />
        {labels[quality]}
      </div>
      <span className="source-label">
        via {source === 'chrome-ai' ? '✨ Chrome AI' : 'heuristic'}
      </span>
    </div>
  )
}
