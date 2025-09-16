import express from "express";
import {
  getInventory,
  addInventory,
  updateInventory,
  deleteInventory,
} from "../Controller/inventoryController.js";
import upload from "../middleware/upload.js"; // ✅ multer middleware

const router = express.Router();

// Routes: /api/inventory
router.get("/", getInventory);

// ✅ use multer for image upload
router.post("/", upload.single("img"), addInventory);
router.put("/:id", upload.single("img"), updateInventory);

router.delete("/:id", deleteInventory);

export default router;
