import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function RevenueChart({ data }) {
  return (
    <LineChart width={600} height={300} data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" />  {/* Optional grid for better readability */}
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="revenue" stroke="#2b8a78" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
    </LineChart>
  );
}
