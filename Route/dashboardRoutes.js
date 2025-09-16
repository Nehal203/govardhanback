// Backend/Route/dashboardRoutes.js
import express from "express";
import { getDashboardData } from "../Controller/dashboardController.js"; // ✅ Controller

const router = express.Router();

router.get("/dashboard", getDashboardData);

export default router;