import type { CaseDefinition, HubDefinition } from './types'

const assetCache = new Map<string, string>()

export function getCachedAssetUrl(url: string): string | null {
  if (!url) return null
  return assetCache.get(url) || null
}

export function clearAssetCache(): void {
  for (const blobUrl of assetCache.values()) {
    try {
      URL.revokeObjectURL(blobUrl)
    } catch (e) {}
  }
  assetCache.clear()
}

export function collectCaseAssetUrls(caseDef: CaseDefinition | HubDefinition): string[] {
  const urls = new Set<string>()
  if (caseDef.audio?.bgm) {
    urls.add(caseDef.audio.bgm)
  }

  const voiceDir = caseDef.audio?.voiceDir || ''
  if (caseDef.dialogue?.lines) {
    for (const id in caseDef.dialogue.lines) {
      if (voiceDir) {
        urls.add(`${ voiceDir }${ id }.ogg`)
      }
    }
  }

  return Array.from(urls)
}

export async function preloadAssetFiles(
  urls: string[],
  onProgress?: (loaded: number, total: number, url: string) => void,
): Promise<void> {
  const pending = urls.filter(u => !assetCache.has(u))
  const total = pending.length
  if (total === 0) {
    if (onProgress) {
      onProgress(urls.length, urls.length, '')
    }
    return
  }

  let loaded = 0
  const concurrency = 6
  let cursor = 0

  async function worker(): Promise<void> {
    while (cursor < pending.length) {
      const idx = cursor++
      const url = pending[idx]
      try {
        const res = await fetch(url)
        if (res.ok) {
          const blob = await res.blob()
          const blobUrl = URL.createObjectURL(blob)
          assetCache.set(url, blobUrl)
        }
      } catch (e) {}
      loaded++
      if (onProgress) {
        onProgress(loaded, total, url)
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, total) }, () => worker())
  await Promise.all(workers)
}
