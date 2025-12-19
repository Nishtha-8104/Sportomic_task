export default function Filters({ filters, setFilters }) {

  function handleChange(e) {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  }

  return (
    <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
      <input
        type="date"
        name="startDate"
        value={filters.startDate}
        onChange={handleChange}
      />

      <input
        type="date"
        name="endDate"
        value={filters.endDate}
        onChange={handleChange}
      />

      <select name="venueId" value={filters.venueId} onChange={handleChange}>
        <option value="">All Venues</option>
        <option value="1">Grand Slam Arena</option>
        <option value="2">City Kickers Turf</option>
        <option value="3">AquaBlue Pool</option>
      </select>
    </div>
  );
}
