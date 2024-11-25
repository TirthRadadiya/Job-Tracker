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

//MiddleWares
import errorHandlerMiddleware from "./middleware/error-handler.js";
import notFoundMiddleware from "./middleware/not-found.js";
import authenticateUser from "./middleware/auth.js";

const app = express();

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.json());
app.use(helmet());
app.use(xss());
app.use(mongoSanitize());
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/jobs", authenticateUser, jobRouter);
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "./client/build", "index.html"));
});

const port = process.env.PORT || 5000;

// Enable in production
// if (process.env.NODE_ENV === "production") {
//   app.use(express.static("client/build"));
// }

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
