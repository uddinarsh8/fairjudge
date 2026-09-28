// ==========================================
// DNS
// ==========================================
const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

// ==========================================
// LOAD ENVIRONMENT VARIABLES FIRST
// ==========================================
const dotenv = require("dotenv");

dotenv.config();

// ==========================================
// IMPORTS
// ==========================================
const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const testRoutes = require("./routes/testRoutes");
const hackathonRoutes = require("./routes/hackathonRoutes");
const criteriaRoutes = require("./routes/criteriaRoutes");
const roundRoutes = require("./routes/roundRoutes");
const teamRoutes = require("./routes/teamRoutes");
const projectRoutes = require("./routes/projectRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const evaluationRoutes = require("./routes/evaluationRoutes");
const organizerRoutes = require("./routes/organizerRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");

// ==========================================
// APP
// ==========================================
const app = express();

const PORT = process.env.PORT || 5000;

// ==========================================
// CORS
// ==========================================
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow Postman, curl, server-side requests
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("Blocked CORS origin:", origin);

      return callback(
        new Error("Not allowed by CORS")
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

// ==========================================
// BODY PARSER
// ==========================================
app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

// ==========================================
// REQUEST LOGGER
// ==========================================
app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`
  );

  next();
});

// ==========================================
// ROUTES
// ==========================================

app.use("/api/auth", authRoutes);

app.use("/api/test", testRoutes);

app.use("/api/hackathons", hackathonRoutes);

app.use("/api/criteria", criteriaRoutes);

app.use("/api/rounds", roundRoutes);

app.use("/api/teams", teamRoutes);

app.use("/api/organizer", organizerRoutes);

app.use("/api/projects", projectRoutes);

app.use("/api/evaluations", evaluationRoutes);

app.use("/api/assignments", assignmentRoutes);

app.use("/api/leaderboard", leaderboardRoutes);

// ==========================================
// HEALTH CHECK
// ==========================================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "FairJudge Backend is running",
    database: "MongoDB Atlas",
    port: PORT,
  });
});

// ==========================================
// API HEALTH CHECK
// ==========================================
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "FairJudge API is reachable",
  });
});

// ==========================================
// 404 HANDLER
// ==========================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ==========================================
// ERROR HANDLER
// ==========================================
app.use((err, req, res, next) => {
  console.error("=================================");
  console.error("SERVER ERROR");
  console.error(err);
  console.error("=================================");

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    success: false,
    message:
      err.message || "Internal server error",
  });
});

// ==========================================
// START SERVER
// ==========================================
async function startServer() {
  try {
    console.log("=================================");
    console.log("Starting FairJudge Backend...");
    console.log("=================================");

    console.log("PORT:", PORT);

    console.log(
      "JWT_SECRET:",
      process.env.JWT_SECRET
        ? "Loaded"
        : "MISSING"
    );

    console.log(
      "MONGODB_URI:",
      process.env.MONGODB_URI
        ? "Loaded"
        : "MISSING"
    );

    // ==========================================
    // CHECK REQUIRED ENV VARIABLES
    // ==========================================
    if (!process.env.MONGODB_URI) {
      throw new Error(
        "MONGODB_URI is not defined in .env"
      );
    }

    if (!process.env.JWT_SECRET) {
      throw new Error(
        "JWT_SECRET is not defined in .env"
      );
    }

    // ==========================================
    // CONNECT DATABASE
    // ==========================================
    await connectDB();

    // ==========================================
    // START SERVER
    // ==========================================
    app.listen(
      PORT,
      "0.0.0.0",
      () => {
        console.log("=================================");
        console.log(
          `FairJudge Backend running on http://localhost:${PORT}`
        );
        console.log(
          `Health: http://localhost:${PORT}/`
        );
        console.log(
          `API Health: http://localhost:${PORT}/api/health`
        );
        console.log("=================================");
      }
    );
  } catch (error) {
    console.error("=================================");
    console.error("FAILED TO START SERVER");
    console.error(error);
    console.error("=================================");

    process.exit(1);
  }
}

// ==========================================
// START
// ==========================================
startServer();