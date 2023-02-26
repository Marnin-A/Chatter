const cookieParser = require("cookie-parser");
const User = require("./models/User.js");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

// Use dotenv to hide sensitive data
dotenv.config();
// Connect to MongoDB atlas
mongoose.connect(process.env.MONGO_URL, (err) => {
  if (err) throw err;
});
// JWT encryption key
const jwtSecret = process.env.JWT_SECRET;

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
  })
);
app.get("/test", (req, res) => {
  res.json("test ok");
});

app.get("/profile", (req, res) => {
  const { token } = req.cookies; // Get the token from the cookies
  // Verify the token and respond with the user's data
  jwt.verify(token, jwtSecret, {}, (err, userData) => {
    if (err) throw err;
    res.json(userData);
  });
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    // Create user usingthe model
    const createdUser = await User.create({ username, password });
    // Sign user in when registered
    jwt.sign(
      { userId: createdUser._id, username },
      jwtSecret,
      {},
      (err, token) => {
        if (err) throw err;
        res
          .cookie("token", token, { sameSite: "none", secure: true })
          .status(201)
          .json({
            id: createdUser._id,
          });
      }
    );
  } catch (err) {
    if (err) throw err;
    res.status(500).json("error");
  }
});
app.listen(4000);
