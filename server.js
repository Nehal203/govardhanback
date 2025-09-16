import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { connectToDatabase } from "./config/db.js";

// Import routes
import dashboardRoutes from "./Route/dashboardRoutes.js";
import apiRouter from "./Route/index.js";
import menuRoutes from "./Route/menuRoutes.js";
import orderRoutes from "./Route/orderRoutes.js";
import inventoryRoutes from "./Route/inventoryRoutes.js";

// Setup __dirname for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const port = process.env.PORT || 5000;

// Define allowed origins
const allowedOrigins = [
  "http://localhost:3000",
  "https://govardhanfron.onrender.com"
];

// CORS Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Allow Postman, curl, etc.
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy: Origin not allowed"));
      }
    },
    credentials: true,
  })
);

// Body parsers & logging
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(morgan("dev"));

// Dashboard routes
app.use("/api", dashboardRoutes);

// Ensure uploads directory exists
const uploadsPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// Health check route
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Serve static uploads
app.use("/uploads", express.static(uploadsPath));

// API Routes
app.use("/api", apiRouter);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/inventory", inventoryRoutes);

// 404 Route Not Found handler
app.use("/api/*", (req, res) =>
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found.`,
  })
);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Global Error:", err.message);
  res
    .status(err.status || 500)
    .json({ success: false, message: err.message || "Internal server error" });
});

// Start the server
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
