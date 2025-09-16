// Route/ReservationRoute.js
import express from 'express';
import {
    createReservation,
    verifyReservationOTP,
    resendReservationOTP,
    getAllReservations,
    getReservationById,
    updateReservationStatus,
    deleteReservation
} from '../Controller/ReservationController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no authentication required)
router.post('/create', createReservation);
router.post('/verify-otp', verifyReservationOTP);
router.post('/resend-otp', resendReservationOTP);

// Protected routes (authentication required)
router.get('/:id', authenticateToken, getReservationById);

// Admin only routes
router.get('/admin/all', authenticateToken, requireAdmin, getAllReservations);
router.put('/admin/:id/status', authenticateToken, requireAdmin, updateReservationStatus);
router.delete('/admin/:id', authenticateToken, requireAdmin, deleteReservation);

export default router;
