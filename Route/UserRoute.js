// routes/userRoutes.js
import express from 'express';
import { 
    startRegistration, 
    verifyOTP, 
    getAllUsers, 
    loginUser 
} from '../Controller/UserController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register/start', startRegistration);
router.post('/register/verify', verifyOTP);
router.post('/login', loginUser);

// Protected routes
router.get('/profile', authenticateToken, (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});

// Admin only routes
router.get('/admin/users', authenticateToken, requireAdmin, getAllUsers);

export default router;