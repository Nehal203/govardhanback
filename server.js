import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { connectToDatabase } from "./config/db.js";

// ✅ FIX: Correct imports (Route with capital R, Controller with capital C)
import dashboardRoutes from "./Route/dashboardRoutes.js";
import apiRouter from "./Route/index.js";
import menuRoutes from "./Route/menuRoutes.js";
import orderRoutes from "./Route/orderRoutes.js";
import inventoryRoutes from "./Route/inventoryRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const port = process.env.PORT || 5000;

// ---------- Middlewares ----------
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(morgan("dev"));

// ✅ Dashboard routes
app.use("/api", dashboardRoutes);

// ---------- Ensure uploads folder exists ----------
const uploadsPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// ---------- Health check ----------
app.get("/health", (req, res) => res.json({ status: "ok" }));

// ---------- Static uploads folder ----------
app.use("/uploads", express.static(uploadsPath));

// ---------- Routes ----------
app.use("/api", apiRouter);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/inventory", inventoryRoutes);

// ---------- 404 handler ----------
app.use("/api/*", (req, res) =>
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found.`,
  })
);

// ---------- Global error handler ----------
app.use((err, req, res, next) => {
  console.error("❌ Global Error:", err);
  res
    .status(err.status || 500)
    .json({ success: false, message: err.message || "Internal server error" });
});

// ---------- Start server ----------
const startServer = async () => {
  try {
    await connectToDatabase();
    app.listen(port, () =>
      console.log(`🚀 Server running on http://localhost:${port}`)
    );
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

startServer();

export default app;
