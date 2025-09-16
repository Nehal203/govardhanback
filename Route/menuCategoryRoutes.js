import express from "express";
import MenuCategory from "../Modal/MenuCategory.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Get all categories
router.get("/", async (req, res) => {
  try {
    const categories = await MenuCategory.find();
    res.json({ ok: true, categories });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Add new category (Admin)
router.post("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    const category = new MenuCategory({ name });
    await category.save();
    res.json({ ok: true, category });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

export default router;
