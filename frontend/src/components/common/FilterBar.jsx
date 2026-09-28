import { Search } from 'lucide-react'

export default function FilterBar({ searchValue, onSearchChange, searchPlaceholder = 'Search…', filters = [] }) {
  return (
    <div className="filter-bar">
      <div className="filter-search">
        <Search size={15} />
        <input
          className="input"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      {filters.map((f) => (
        <select key={f.label} className="input filter-select" value={f.value} onChange={(e) => f.onChange(e.target.value)}>
          <option value="">{f.label}</option>
          {f.options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ))}
    </div>
  )
}
