import express from 'express';
import userRoutes from './UserRoute.js';
import reservationRoutes from './ReservationRoute.js';
import menuRoutes from './menuRoutes.js';
import menuCategoryRoutes from './menuCategoryRoutes.js'; // check if file exists

const router = express.Router();

// ✅ Grouped API routes
router.use('/users', userRoutes);            // /api/users
router.use('/reservations', reservationRoutes); // /api/reservations
router.use('/menu', menuRoutes);             // /api/menu
router.use('/categories', menuCategoryRoutes); // /api/categories

// ✅ Health check route
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
});

export default router;
