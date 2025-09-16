// Backend/Controller/dashboardController.js
import Order from "../Modal/Order.js"; 
import Reservation from "../Modal/ReservationSchema.js"; // ✅ Correct filename

export const getDashboardData = async (req, res) => {
  try {
    // Last 4 orders (latest first)
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(4);

    // Today’s reservations
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todaysReservations = await Reservation.find({
      date: { $gte: todayStart.toISOString().split("T")[0], $lte: todayEnd.toISOString().split("T")[0] },
      status: "confirmed", // optional filter if you only want confirmed
      isVerified: true     // optional if you only want verified
    })
      .sort({ time: 1 })
      .limit(4);

    res.json({ recentOrders, todaysReservations });
  } catch (error) {
    res.status(500).json({ message: "Error fetching dashboard data", error });
  }
};
