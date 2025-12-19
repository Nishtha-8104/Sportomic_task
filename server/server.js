const express = require("express");
const app = express();
const cors = require("cors");
const http = require("http");
const dotenv = require("dotenv");
const pool = require("./config/db");

dotenv.config();


app.use(
	cors({
		origin: "https://sportomic-task-six.vercel.app/" || "http://localhost:3000",
		methods: ["GET", "POST", "PUT", "DELETE"],
		allowedHeaders: ["Content-Type","Authorization"],
		credentials: true,
	})
);
app.use(express.json());

// app.use((req, res, next) => {
// 	req.io = io;
// 	next();
// });

app.get("/api/filters", async (req, res) => {
  const venues = await pool.query("SELECT venue_id, name FROM venues ORDER BY name");
  const sports = await pool.query("SELECT DISTINCT sport_id FROM bookings ORDER BY sport_id"); // adjust if you have a sports table

  res.json({
    venues: venues.rows,
    sports: sports.rows,
  });
});

app.get("/api/dashboard", async (req, res) => {
  const { venue_id, sport_id, month } = req.query;

  // -------------------------------
  // TRANSACTION FILTERS (t + b)
  // -------------------------------
  const txnConditions = [];
  const txnValues = [];

  if (venue_id && venue_id !== "all") {
    txnValues.push(venue_id);
    txnConditions.push(`b.venue_id = $${txnValues.length}`);
  }

  if (sport_id && sport_id !== "all") {
    txnValues.push(sport_id);
    txnConditions.push(`b.sport_id = $${txnValues.length}`);
  }

  if (month && month !== "all") {
    txnValues.push(`${month}-01`);
    txnConditions.push(`
      t.transaction_date >= $${txnValues.length}
      AND t.transaction_date < ($${txnValues.length}::date + INTERVAL '1 month')
    `);
  }

  const txnWhere =
    txnConditions.length ? "WHERE " + txnConditions.join(" AND ") : "";

  // -------------------------------
  // BOOKING-ONLY FILTERS (b only)
  // -------------------------------
  const bookingConditions = [];
  const bookingValues = [];

  if (venue_id && venue_id !== "all") {
    bookingValues.push(venue_id);
    bookingConditions.push(`b.venue_id = $${bookingValues.length}`);
  }

  if (sport_id && sport_id !== "all") {
    bookingValues.push(sport_id);
    bookingConditions.push(`b.sport_id = $${bookingValues.length}`);
  }

  const bookingWhere =
    bookingConditions.length ? "WHERE " + bookingConditions.join(" AND ") : "";

  try {
    const [
      activeMembers,
      inactiveMembers,
      trialConversion,
      bookingRevenue,
      coachingRevenue,
      totalRevenue,
      refunds,
      revenueByVenue,
      bookingCount,
      couponRedemption,
      repeatBooking,
      slotUtilization
    ] = await Promise.all([

      // Active Members
      pool.query(`SELECT COUNT(*) FROM members WHERE status='Active'`),

      // Inactive Members
      pool.query(`SELECT COUNT(*) FROM members WHERE status='Inactive'`),

      // Trial Conversion
      pool.query(`
        SELECT ROUND(
          COUNT(*) FILTER (WHERE converted_from_trial)::decimal /
          NULLIF(COUNT(*) FILTER (WHERE is_trial_user),0) * 100, 2
        ) AS rate FROM members
      `),

      // Booking Revenue
      pool.query(`
        SELECT COALESCE(SUM(t.amount),0) AS amount
        FROM transactions t
        JOIN bookings b ON t.booking_id = b.booking_id
        ${txnWhere}
        ${txnWhere ? "AND" : "WHERE"} t.status='Success' AND t.type='Booking'
      `, txnValues),

      // Coaching Revenue
      pool.query(`
        SELECT COALESCE(SUM(t.amount),0) AS amount
        FROM transactions t
        JOIN bookings b ON t.booking_id = b.booking_id
        ${txnWhere}
        ${txnWhere ? "AND" : "WHERE"} t.status='Success' AND t.type='Coaching'
      `, txnValues),

      // Total Revenue
      pool.query(`
        SELECT COALESCE(SUM(t.amount),0) AS amount
        FROM transactions t
        JOIN bookings b ON t.booking_id = b.booking_id
        ${txnWhere}
        ${txnWhere ? "AND" : "WHERE"} t.status='Success'
      `, txnValues),

      // Refunds & Disputes
      pool.query(`
        SELECT COUNT(*) FROM transactions t
        JOIN bookings b ON t.booking_id = b.booking_id
        ${txnWhere}
        ${txnWhere ? "AND" : "WHERE"} t.status IN ('Refunded','Dispute')
      `, txnValues),

      // Revenue by Venue (chart)
      pool.query(`
        SELECT v.name, SUM(t.amount) AS revenue
        FROM transactions t
        JOIN bookings b ON t.booking_id = b.booking_id
        JOIN venues v ON b.venue_id = v.venue_id
        WHERE t.status='Success'
        GROUP BY v.name
      `),

      // Booking Count
      pool.query(`
        SELECT COUNT(*) FROM bookings b
        ${bookingWhere}
        ${bookingWhere ? "AND" : "WHERE"} b.status != 'Cancelled'
      `, bookingValues),

      // Coupon Redemption
      pool.query(`
        SELECT COUNT(*) FROM bookings b
        ${bookingWhere}
        ${bookingWhere ? "AND" : "WHERE"} b.coupon_code IS NOT NULL
      `, bookingValues),

      // Repeat Booking %
      pool.query(`
        SELECT ROUND(
          COUNT(*) FILTER (WHERE booking_count > 1)::decimal /
          NULLIF(COUNT(*),0) * 100, 2
        ) AS percentage
        FROM (
          SELECT b.member_id, COUNT(*) AS booking_count
          FROM bookings b
          ${bookingWhere}
          GROUP BY b.member_id
        ) sub
      `, bookingValues),

      // Slot Utilization (not computable → forced 0)
      pool.query(`SELECT 0 AS utilization`)
    ]);

    res.json({
      activeMembers: activeMembers.rows[0].count,
      inactiveMembers: inactiveMembers.rows[0].count,
      trialConversion: trialConversion.rows[0].rate,
      bookingRevenue: bookingRevenue.rows[0].amount,
      coachingRevenue: coachingRevenue.rows[0].amount,
      totalRevenue: totalRevenue.rows[0].amount,
      refunds: refunds.rows[0].count,
      bookings: bookingCount.rows[0].count,
      couponRedemption: couponRedemption.rows[0].count,
      repeatBooking: repeatBooking.rows[0].percentage,
      slotUtilization: slotUtilization.rows[0].utilization,
      revenueByVenue: revenueByVenue.rows
    });

  } catch (err) {
    console.error("Dashboard API error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});






// app.get("/api/dashboard", async (req, res) => {
//   const data = {};

//   const queries = {
//     activeMembers: `SELECT COUNT(*) FROM members WHERE status='Active'`,
//     inactiveMembers: `SELECT COUNT(*) FROM members WHERE status='Inactive'`,
//     trialConversion: `
//       SELECT ROUND(
//         COUNT(*) FILTER (WHERE converted_from_trial = TRUE)::decimal /
//         NULLIF(COUNT(*) FILTER (WHERE is_trial_user = TRUE), 0) * 100, 2
//       ) AS rate FROM members`,
//     totalRevenue: `
//       SELECT COALESCE(SUM(amount),0) FROM transactions WHERE status='Success'`,
//     bookingRevenue: `
//       SELECT COALESCE(SUM(amount),0) FROM transactions 
//       WHERE type='Booking' AND status='Success'`,
//     coachingRevenue: `
//       SELECT COALESCE(SUM(amount),0) FROM transactions 
//       WHERE type='Coaching' AND status='Success'`,
//     refunds: `
//       SELECT COUNT(*) FROM transactions 
//       WHERE status IN ('Refunded','Dispute')`,
//     revenueByVenue: `
//       SELECT v.name, SUM(t.amount) AS revenue
//       FROM transactions t
//       JOIN bookings b ON t.booking_id=b.booking_id
//       JOIN venues v ON b.venue_id=v.venue_id
//       WHERE t.status='Success'
//       GROUP BY v.name`
//   };

//   for (let key in queries) {
//     const result = await pool.query(queries[key]);
//     data[key] = result.rows;
//   }

//   res.json(data);
// });



const port = 3001;
app.listen(port, () => {
	console.log(`Server is running on ${port}`);
});


module.default = app;


// if (require.main === module) {
//     app.listen(3000, () => {
//         console.log('Server running on port 3000');
//     });
// }
