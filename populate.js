/**
 * File: seedJobs.js
 * Description: Seeds the database with job data from a JSON file.
 */

import { readFile } from "fs/promises";
import dotenv from "dotenv";
dotenv.config();

import connectDB from "./db/connect.js";
import Job from "./models/Job.js";

/**
 * Initializes the database with mock job data.
 */
const start = async () => {
  try {
    await connectDB(process.env.MONGO_URL);

    const jobs = JSON.parse(
      await readFile(new URL("./mock-data.json", import.meta.url))
    );

    await Job.create(jobs);
    console.log("Database seeded successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

start();