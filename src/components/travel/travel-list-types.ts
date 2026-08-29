export interface TravelEntry {
  id: string
  startDate: string
  endDate: string
  startKm: number
  endKm: number
  amount: number
  liters: number
  description?: string
}

export interface DerivedData {
  kmTraveled: number
  pricePerLiter: number
  efficiency: number
  costPerKm: number
  days: number
  cumulativeKm: number
  cumulativeAmount: number
}

export interface TravelListProps {
  travelEntries: TravelEntry[]
  selectedEntries: Set<string>
  handleSelectEntry: (id: string) => void
  handleSelectAll: () => void
  handleDelete: (id: string) => void
  expandedEntryId: string | null
  setExpandedEntryId: (id: string | null) => void
  calculateDerivedData: (entry: TravelEntry, index: number) => DerivedData
  pagination: {
    totalPages: number
    totalCount: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
  currentPage: number
  fetchTravelEntries: (page: number) => void
  sortBy: string
  setSortBy: (sortBy: string) => void
  loading: boolean
  tableRef: React.RefObject<HTMLDivElement | null>
}
