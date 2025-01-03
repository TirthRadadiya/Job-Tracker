import Job from "../models/Job.js";
import { StatusCodes } from "http-status-codes";
import {
  BadRequestError,
  NotFoundError,
  UnAuthenticatedError,
} from "../errors/index.js";
import checkPermissions from "../utils/checkPermissions.js";
import mongoose from "mongoose";
import moment from "moment";

/**
 * Creates a new job entry.
 * - Validates required fields (`position`, `company`).
 * - Associates the job with the logged-in user.
 * - Saves the job to the database and returns it.
 */
const createJob = async (req, res) => {
  const { position, company } = req.body;

  if (!position || !company) {
    throw new BadRequestError("Please provide all values");
  }

  req.body.createdBy = req.user.userId;
  const job = await Job.create(req.body);

  res.status(StatusCodes.CREATED).json({ job });
};

/**
 * Retrieves all jobs for the logged-in user.
 * - Supports filtering by `status`, `jobType`, and `search`.
 * - Allows sorting (`latest`, `oldest`, `a-z`, `z-a`).
 * - Implements pagination.
 */
const getAllJobs = async (req, res) => {
  const { status, jobType, sort, search } = req.query;

  const queryObject = { createdBy: req.user.userId };

  if (status && status !== "all") queryObject.status = status;
  if (jobType && jobType !== "all") queryObject.jobType = jobType;
  if (search) queryObject.position = { $regex: search, $options: "i" };

  let result = Job.find(queryObject);

  if (sort === "latest") result = result.sort("-createdAt");
  if (sort === "oldest") result = result.sort("createdAt");
  if (sort === "a-z") result = result.sort("position");
  if (sort === "z-a") result = result.sort("-position");

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  result = result.skip(skip).limit(limit);

  const jobs = await result;
  const totalJobs = await Job.countDocuments(queryObject);
  const numOfPages = Math.ceil(totalJobs / limit);

  res.status(StatusCodes.OK).json({ jobs, totalJobs, numOfPages });
};

/**
 * Updates an existing job.
 * - Validates required fields (`position`, `company`).
 * - Checks if the job exists and verifies user permissions.
 * - Updates the job and returns the updated job.
 */
const updateJob = async (req, res) => {
  const { id: jobId } = req.params;
  const { company, position } = req.body;

  if (!position || !company) {
    throw new BadRequestError("Please provide all values");
  }

  const job = await Job.findOne({ _id: jobId });
  if (!job) {
    throw new NotFoundError(`No job with id: ${jobId}`);
  }

  checkPermissions(req.user, job.createdBy);

  const updatedJob = await Job.findOneAndUpdate({ _id: jobId }, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(StatusCodes.OK).json({ updatedJob });
};

/**
 * Deletes an existing job.
 * - Checks if the job exists and verifies user permissions.
 * - Deletes the job from the database.
 */
const deleteJob = async (req, res) => {
  const { id: jobId } = req.params;

  const job = await Job.findOne({ _id: jobId });
  if (!job) {
    throw new NotFoundError(`No job with id: ${jobId}`);
  }

  checkPermissions(req.user, job.createdBy);

  await job.remove();

  res.status(StatusCodes.OK).json({ msg: "Success! Job removed" });
};

/**
 * Shows job statistics for the logged-in user.
 * - Aggregates job counts by `status`.
 * - Aggregates monthly application trends for the last six months.
 */
const showStats = async (req, res) => {
  let stats = await Job.aggregate([
    { $match: { createdBy: mongoose.Types.ObjectId(req.user.userId) } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  stats = stats.reduce((acc, curr) => {
    const { _id: title, count } = curr;
    acc[title] = count;
    return acc;
  }, {});

  const defaultStats = {
    pending: stats.pending || 0,
    interview: stats.interview || 0,
    declined: stats.declined || 0,
  };

  let monthlyApplications = await Job.aggregate([
    { $match: { createdBy: mongoose.Types.ObjectId(req.user.userId) } },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": -1, "_id.month": -1 } },
    { $limit: 6 },
  ]);

  monthlyApplications = monthlyApplications
    .map((item) => {
      const {
        _id: { year, month },
        count,
      } = item;
      const date = moment()
        .month(month - 1)
        .year(year)
        .format("MMM Y");
      return { date, count };
    })
    .reverse();

  res.status(StatusCodes.OK).json({ defaultStats, monthlyApplications });
};

export { createJob, deleteJob, getAllJobs, updateJob, showStats };
