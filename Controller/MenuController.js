import MenuItem from "../Modal/MenuItem.js";

// Get all menu items (public)
export const getAllMenuItems = async (req, res) => {
  try {
    const items = await MenuItem.find();
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all menu items (admin only, with count)
export const getAllMenuItemsAdmin = async (req, res) => {
  try {
    const items = await MenuItem.find();
    res.json({ success: true, count: items.length, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Add new menu item
export const addMenuItem = async (req, res) => {
  try {
    const { name, price, category } = req.body;
    const newItem = new MenuItem({
      name,
      price,
      category,
      image: req.file ? `/uploads/${req.file.filename}` : null,
    });
    await newItem.save();
    res.json({ success: true, data: newItem });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update menu item
export const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (req.file) updateData.image = `/uploads/${req.file.filename}`;

    const updatedItem = await MenuItem.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!updatedItem)
      return res
        .status(404)
        .json({ success: false, message: "Menu item not found" });

    res.json({ success: true, data: updatedItem });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete menu item
export const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await MenuItem.findByIdAndDelete(id);

    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "Menu item not found" });

    res.json({ success: true, message: "Menu item deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
