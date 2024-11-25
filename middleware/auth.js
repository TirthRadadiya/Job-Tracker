import jwt from "jsonwebtoken";
import { UnAuthenticatedError } from "../errors/index.js";

/**
 * Middleware to authenticate user based on JWT token.
 * - Verifies the token from the Authorization header.
 * - If valid, attaches user information to the request object.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Passes control to the next middleware.
 * @throws {UnAuthenticatedError} - If the token is missing or invalid.
 */
const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer")) {
    throw new UnAuthenticatedError("Authentication Invalid");
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: payload.userId };
    next();
  } catch (error) {
    throw new UnAuthenticatedError("Authentication Invalid");
  }
};

export default auth;