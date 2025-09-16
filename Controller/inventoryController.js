import Inventory from "../Modal/inventoryModel.js";

// ✅ Get all items
export const getInventory = async (req, res) => {
  try {
    const items = await Inventory.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Add new item (with file upload)
export const addInventory = async (req, res) => {
  try {
    const { name, kg } = req.body;
    const img = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name || !kg || !img) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required." });
    }

    const newItem = new Inventory({ name, img, kg });
    await newItem.save();
    res.json(newItem);
  } catch (err) {
    console.error("❌ Error in addInventory:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Update item (with optional new file upload)
export const updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, kg } = req.body;
    const img = req.file ? `/uploads/${req.file.filename}` : undefined;

    const updateData = { name, kg };
    if (img) updateData.img = img; // only update if new image uploaded

    const updatedItem = await Inventory.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedItem) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    res.json(updatedItem);
  } catch (err) {
    console.error("❌ Error in updateInventory:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Delete item
export const deleteInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Inventory.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }
    res.json({ success: true, message: "Item deleted successfully" });
  } catch (err) {
    console.error("❌ Error in deleteInventory:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
