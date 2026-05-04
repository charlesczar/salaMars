const API_BASE = 'http://localhost:5000/api'

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

export async function searchMedicines(query: string): Promise<Medicine[]> {
  try {
    const response = await fetch(`${API_BASE}/medicines?search=${encodeURIComponent(query)}`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
  } catch (err) {
    console.error('Medicine search error:', err)
    return []
  }
}

export async function getAllMedicines(): Promise<Medicine[]> {
  try {
    const response = await fetch(`${API_BASE}/medicines`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
  } catch (err) {
    console.error('Get medicines error:', err)
    return []
  }
}
