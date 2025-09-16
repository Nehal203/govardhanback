// backend/models/Order.js
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      required: true,
    },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    orderType: { 
      type: String,
      enum: ["dine-in", "takeaway"],
      required: true,
    },
    tableNumber: { type: String, default: null },
    items: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        image: { type: String },   // optional
      },
    ],
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
  },
  { timestamps: true }
);

// Pre-validate or pre-save hook to generate orderId if absent
orderSchema.pre('validate', function(next) {
  if (!this.orderId) {
    // You can customize the format as needed
    const randomPart = Math.floor(1000 + Math.random() * 9000);  // 4-digit random
    this.orderId = `ORD-${Date.now()}-${randomPart}`;
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
