import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
    },
    img: {
      type: String,
      required: [true, "Image path is required"], // will store `/uploads/filename.jpg`
    },
    kg: {
      type: Number,
      required: [true, "KG available is required"],
      min: [0, "KG cannot be negative"],
    },
  },
  { timestamps: true }
);

// Collection name will be `inventories`
const Inventory = mongoose.model("Inventory", inventorySchema);

export default Inventory;
