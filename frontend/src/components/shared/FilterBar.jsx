/**
 * PRAGMA — FilterBar
 * Owner: Ashwin — M3
 * Generic dropdown row. Each filter: { label, value, options, onChange }.
 */

export default function FilterBar({ filters, onClear, showClear }) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      {filters.map(({ label, value, options, onChange }) => (
        <div key={label} className="flex flex-col">
          <label className="mb-1 text-xs font-medium text-gray-500">{label}</label>
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">All</option>
            {options.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
      ))}
      {showClear && (
        <button
          onClick={onClear}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
