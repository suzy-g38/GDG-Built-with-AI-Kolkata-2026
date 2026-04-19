import { useState, useEffect } from 'react'
import { NetworkQuality, NetworkSource } from '../types'

interface NetworkConnection {
  effectiveType?: '2g' | '3g' | '4g' | 'slow-2g'
  downlink?: number
  rtt?: number
  addEventListener: (type: string, listener: () => void) => void
  removeEventListener: (type: string, listener: () => void) => void
}

function heuristicClassify(conn: NetworkConnection | null): NetworkQuality {
  if (!conn) return 'fast'
  const { effectiveType = '4g', downlink = 10, rtt = 50 } = conn
  if (effectiveType === 'slow-2g' || effectiveType === '2g' || downlink < 0.5 || rtt > 600) return 'slow'
  if (effectiveType === '3g' || downlink < 4 || rtt > 200) return 'medium'
  return 'fast'
}

export function useNetworkQuality(override: 'auto' | NetworkQuality = 'auto') {
  const [quality, setQuality] = useState<NetworkQuality>('fast')
  const [source, setSource] = useState<NetworkSource>('heuristic')

  useEffect(() => {
    if (override !== 'auto') {
      setQuality(override)
      return
    }

    const nav = navigator as typeof navigator & { connection?: NetworkConnection }
    const conn = nav.connection ?? null

    async function detect() {
      // Attempt Chrome built-in AI (Gemini Nano)
      const win = window as typeof window & {
        ai?: { languageModel?: { create: () => Promise<{ prompt: (p: string) => Promise<string> }> } }
      }

      if (win.ai?.languageModel) {
        try {
          const session = await win.ai.languageModel.create()
          const metrics = {
            effectiveType: conn?.effectiveType ?? '4g',
            downlink: conn?.downlink ?? 10,
            rtt: conn?.rtt ?? 50,
          }
          const response = await session.prompt(
            `Network: effectiveType=${metrics.effectiveType}, downlink=${metrics.downlink}Mbps, rtt=${metrics.rtt}ms.\n` +
            `Classify as exactly one word — "fast", "medium", or "slow" — with no punctuation.`
          )
          const classified = response.trim().toLowerCase()
          if (classified === 'fast' || classified === 'medium' || classified === 'slow') {
            setQuality(classified)
            setSource('chrome-ai')
            return
          }
        } catch {
          // Chrome AI unavailable — fall through
        }
      }

      setQuality(heuristicClassify(conn))
      setSource('heuristic')
    }

    detect()

    if (conn) {
      conn.addEventListener('change', detect)
      return () => conn.removeEventListener('change', detect)
    }
  }, [override])

  return { quality, source }
}
