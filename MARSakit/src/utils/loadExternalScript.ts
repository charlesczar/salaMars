let pending: Record<string, Promise<void>> = {}

export function loadExternalScript(src: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (
    (document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null)?.dataset.loaded ===
    'true'
  ) {
    return Promise.resolve()
  }
  if (pending[src]) return pending[src]

  pending[src] = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), {
        once: true,
      })
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = () => {
      script.dataset.loaded = 'true'
      resolve()
    }
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(script)
  })

  return pending[src]
}
