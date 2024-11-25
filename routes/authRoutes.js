import express from "express";
const router = express.Router();

import rateLimiter from "express-rate-limit";

// Configure rate limiting for the API (limits to 10 requests per 15 minutes)
const apiLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 10, // Maximum 10 requests
  message: "Too many requests from this IP, please try again after 15 minutes", // Error message
});

import { register, login, updateUser } from "../controllers/authController.js";
import authenticateUser from "../middleware/auth.js";

// Route for user registration (POST request)
router.route("/register").post(register);

// Route for user login (POST request)
router.route("/login").post(login);

// Route for updating user information (PATCH request)
// Authenticated users only
router.route("/updateUser").patch(authenticateUser, updateUser);

// Optionally, rate limit could be applied to register/login routes
// router.route('/register').post(apiLimiter, register)
// router.route('/login').post(apiLimiter, login)

export default router;