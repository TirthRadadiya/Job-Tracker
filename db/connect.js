import mongoose from "mongoose";

/**
 * Establishes a connection to the MongoDB database using the provided URL.
 * 
 * @param {string} url - MongoDB connection string.
 * @returns {Promise} - Resolves when the connection is successful.
 */
const connectDB = (url) => {
  return mongoose.connect(url);
};

export default connectDB;