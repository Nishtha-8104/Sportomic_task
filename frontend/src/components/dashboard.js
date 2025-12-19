// import { useEffect, useState } from "react";
import StatCard from "./StatCard";
import RevenueChart from "./RevenueChart";

// export default function Dashboard() {
//   const [data, setData] = useState(null);

//   useEffect(() => {
//     fetch("http://localhost:3001/api/dashboard")
//       .then(res => res.json())
//       .then(setData);
//   }, []);

//   //if (!data) return <p>Loading...</p>;

//   return (
//     <>
//       <div className="grid">
//         <StatCard title="Active Members" value={data.activeMembers[0].count} />
//         <StatCard title="Inactive Members" value={data.inactiveMembers[0].count} />
//         <StatCard title="Trial Conversion Rate" value={`${data.trialConversion[0].rate}%`} />
//         <StatCard title="Booking Revenue" value={`₹${data.bookingRevenue[0].coalesce}`} />
//         <StatCard title="Coaching Revenue" value={`₹${data.coachingRevenue[0].coalesce}`} />
//         <StatCard title="Total Revenue" value={`₹${data.totalRevenue[0].coalesce}`} />
//         <StatCard title="Refunds & Disputes" value={data.refunds[0].count} />
//       </div>

//       <RevenueChart data={data.revenueByVenue} />
//     </>
//   );
// }

import { useState, useEffect } from "react";

export default function Dashboard() {
  const [filters, setFilters] = useState({ venues: [], sports: [] });
  const [selectedFilters, setSelectedFilters] = useState({
    venue_id: "all",
    sport_id: "all",
    month: "all",
  });
  const [data, setData] = useState(null);

  // Fetch dropdown options on mount
  useEffect(() => {
    fetch("http://localhost:3001/api/filters")
      .then((res) => res.json())
      .then(setFilters);
  }, []);


  function handleFilterChange(e) {
    setSelectedFilters({
      ...selectedFilters,
      [e.target.name]: e.target.value,
    });
  }

 

useEffect(() => {
  const params = new URLSearchParams();

  if (selectedFilters.venue_id !== "all")
    params.append("venue_id", selectedFilters.venue_id);

  if (selectedFilters.sport_id !== "all")
    params.append("sport_id", selectedFilters.sport_id);

  if (selectedFilters.month !== "all")
    params.append("month", selectedFilters.month);

  fetch(`http://localhost:3001/api/dashboard?${params.toString()}`)
    .then(res => res.json())
    .then(setData);

}, [selectedFilters]);


  console.log(data);

  return (
    <div>
      <h2>Dashboard</h2>

      {/* Filters */}
      <div className="filters">
  <select name="venue_id" onChange={handleFilterChange} value={selectedFilters.venue_id}>
    <option value="all">All Venues</option>
    {filters.venues.map((v) => (
      <option key={v.venue_id} value={v.venue_id}>{v.name}</option>
    ))}
  </select>

  <select name="sport_id" onChange={handleFilterChange} value={selectedFilters.sport_id}>
    <option value="all">All Sports</option>
    {filters.sports.map((s) => (
      <option key={s.sport_id} value={s.sport_id}>Sport {s.sport_id}</option>
    ))}
  </select>

  <select name="month" onChange={handleFilterChange} value={selectedFilters.month}>
    <option value="all">All Months</option>
    <option value="2025-12">December 2025</option>
    <option value="2025-11">November 2025</option>
  </select>
</div>

      {data ? (
        <>
          <div className="grid">
        <StatCard title="Active Members" value={data.activeMembers} />
         <StatCard title="Inactive Members" value={data.inactiveMembers} />
         <StatCard title="Trial Conversion Rate" value={`${data.trialConversion}%`} />
         <StatCard title="Booking Revenue" value={`₹${data.bookingRevenue}`} />
         <StatCard title="Coaching Revenue" value={`₹${data.coachingRevenue}`} />
         <StatCard title="Total Revenue" value={`₹${data.totalRevenue}`} />
         <StatCard title="Refunds & Disputes" value={data.refunds} />
         <StatCard title="Bookings" value={data.bookings} />
          <StatCard title="Slots Utilization" value={`${data.slotUtilization}%`} />
        <StatCard title="Coupon Redemption" value={data.couponRedemption} />
        <StatCard title="Repeat Booking" value={`${data.repeatBooking}%`} />

       </div>
       <RevenueChart data={data.revenueByVenue} />
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

