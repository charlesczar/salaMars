export type Medicine = {
  id: string
  name: string
  genericName: string
  brandNames: string[]
  category: string
  activeIngredients: string[]
  searchKeys: string[]
  uses: string[]
  sideEffects: string[]
  warnings: string[]
  allergyTriggers: string[]
  contraindications: string[]
  otc: boolean
}

function buildApiUrl(path: string): string {
  const base = import.meta.env.VITE_BACKEND_URL
  if (!base) {
    return path
  }

  return new URL(path, base).toString()
}

export async function searchMedicines(query: string, language: string = 'english'): Promise<any> {
  try {
    const url = new URL(buildApiUrl('/api/medicines'), window.location.origin)
    url.searchParams.set('medicine', query)
    url.searchParams.set('language', language)
    const response = await fetch(url)
    const data = await response.json()

    console.log('Search response:', data)

    if (!response.ok) {
      return { error: data.error || `Error ${response.status}: ${data.message || 'Unknown error'}` }
    }

    return data
  } catch (err) {
    console.error('Medicine search error:', err)
    return { error: 'Network error or failed to connect to backend.' }
  }
}

export async function getAllMedicines(): Promise<Medicine[]> {
  try {
    const response = await fetch(buildApiUrl('/api/medicines/all'))
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
  } catch (err) {
    console.error('Get medicines error:', err)
    return []
  }
}

export { buildApiUrl }
