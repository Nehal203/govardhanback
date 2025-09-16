import express from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import {
  getAllMenuItems,
  getAllMenuItemsAdmin,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem
} from '../Controller/MenuController.js';

const router = express.Router();

// ✅ Multer setup for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // uploads folder me save hoga
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // unique filename
  }
});
const upload = multer({ storage });

// ---------------- Customer Routes ----------------
router.get('/', getAllMenuItems); // GET /api/menu

// ---------------- Admin Routes ----------------
router.get('/admin', authenticateToken, requireAdmin, getAllMenuItemsAdmin); // GET /api/menu/admin
router.post('/admin', authenticateToken, requireAdmin, upload.single('image'), addMenuItem); // POST /api/menu/admin
router.put('/admin/:id', authenticateToken, requireAdmin, upload.single('image'), updateMenuItem); // PUT /api/menu/admin/:id
router.delete('/admin/:id', authenticateToken, requireAdmin, deleteMenuItem); // DELETE /api/menu/admin/:id

export default router;
