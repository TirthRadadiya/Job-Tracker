import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/**
 * User Schema definition for MongoDB.
 * - Contains fields like name, email, password, and location.
 * - Includes validation, password hashing, and JWT generation.
 */
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide name"],
    minlength: 3,
    maxlength: 20,
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Please provide email"],
    validate: {
      validator: validator.isEmail,
      message: "Please provide a valid email",
    },
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Please provide password"],
    minlength: 6,
    select: false,
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: 20,
    default: "lastName",
  },
  location: {
    type: String,
    trim: true,
    maxlength: 20,
    default: "my city",
  },
});

/**
 * Middleware to hash the password before saving to the database.
 * - Runs only if the password is modified.
 */
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return; // Skip if password is not modified
  const salt = await bcrypt.genSalt(10); // Generate salt
  this.password = await bcrypt.hash(this.password, salt); // Hash the password
});

/**
 * Method to create a JWT token for the user.
 * @returns {string} - JWT token with user ID and expiration.
 */
UserSchema.methods.createJWT = function () {
  return jwt.sign({ userId: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_LIFETIME, // Token expiration time from environment variable
  });
};

/**
 * Method to compare entered password with the stored hashed password.
 * @param {string} candidatePassword - The password to be compared.
 * @returns {boolean} - True if passwords match, otherwise false.
 */
UserSchema.methods.comparePassword = async function (candidatePassword) {
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  return isMatch; // Return whether the password matches
};

export default mongoose.model("User", UserSchema);
