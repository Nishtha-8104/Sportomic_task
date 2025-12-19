import { useEffect, useState } from "react";
import { fetchSummary, fetchRevenue } from "../components/dashboard";
import StatCard from "../components/StatCard";
import Filters from "../components/Filters";
import RevenueChart from "../components/RevenueChart";

function getLast7Days() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 7);

  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0]
  };
}

export default function Dashboard() {
  const defaultDates = getLast7Days();

  const [filters, setFilters] = useState({
    startDate: defaultDates.startDate,
    endDate: defaultDates.endDate,
    venueId: ""
  });

  const [summary, setSummary] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");

    fetchSummary(filters)
      .then(setSummary)
      .catch(() => setError("Failed to load summary"));

    fetchRevenue(filters)
      .then(setRevenue)
      .catch(() => setError("Failed to load revenue"));

  }, [filters]);

  if (error) return <p>{error}</p>;
  if (!summary) return <p>Loading dashboard...</p>;

  return (
    <div style={{ padding: "24px", background: "#f5f5f5" }}>
      <h1>Dashboard</h1>

      <p style={{ color: "#666" }}>
        Showing data for last 7 days
      </p>

      <Filters filters={filters} setFilters={setFilters} />

      <div style={{ display: "flex", gap: "16px", marginBottom: "40px" }}>
        <StatCard title="Active Members" value={summary.activeMembers} />
        <StatCard title="Inactive Members" value={summary.inactiveMembers} />
        <StatCard title="Total Revenue" value={`₹${summary.totalRevenue}`} />
      </div>

      <h3>Revenue Over Time</h3>
      <RevenueChart data={revenue} />
    </div>
  );
}
