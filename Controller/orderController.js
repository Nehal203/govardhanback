import Order from "../Modal/Order.js";

export const createOrder = async (req, res) => {
  try {
    const { name, phone, orderType, tableNumber, items, subtotal, tax, total } =
      req.body;

    const newOrder = new Order({
      name,
      phone,
      orderType,
      tableNumber,
      items,
      subtotal,
      tax,
      total,
    });

    await newOrder.save();

    res.status(201).json({ success: true, data: newOrder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Optional: get all orders (admin)
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
