require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { clerkMiddleware } = require("@clerk/express");
const app = express();
const PORT = process.env.PORT || 4000;

// middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(clerkMiddleware());

// health check
app.get("/", (req, res) => {
  res.json({ message: "Backend running!" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
