/**
 * Express server setup with middleware for security, routing, and error handling.
 * 
 * This file configures the application with essential middlewares for security,
 * logging, and sanitization. It also sets up routes for authentication and job management
 * and ensures proper error handling throughout the application.
 */

import express from "express";
import dotenv from "dotenv";
import "express-async-errors";
import morgan from "morgan";
dotenv.config();

import path from "path";

import helmet from "helmet";
import xss from "xss-clean";
import mongoSanitize from "express-mongo-sanitize";

import connectDB from "./db/connect.js";

import authRouter from "./routes/authRoutes.js";
import jobRouter from "./routes/jobsRoutes.js";

// Middlewares
import errorHandlerMiddleware from "./middleware/error-handler.js";
import notFoundMiddleware from "./middleware/not-found.js";
import authenticateUser from "./middleware/auth.js";

const app = express();

// Enable logging for non-production environments
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Get the directory name for static files
const __dirname = dirname(fileURLToPath(import.meta.url));

// Middlewares for security and data sanitization
app.use(express.json());
app.use(helmet());
app.use(xss());
app.use(mongoSanitize());

// Set up routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/jobs", authenticateUser, jobRouter);

// Error handling middlewares
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

// Serve React client in production
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "./client/build", "index.html"));
});

const port = process.env.PORT || 5000;

// Start the server and connect to the database
const start = async () => {
  try {
    await connectDB(process.env.MONGO_URL);
    app.listen(port, () => {
      console.log(`Server is listening on port ${port}...`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();