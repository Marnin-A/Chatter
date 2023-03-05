const Message = require("./models/Message.js");
const cookieParser = require("cookie-parser");
const User = require("./models/User.js");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Buffer = require("buffer").Buffer;
const jwt = require("jsonwebtoken");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const ws = require("ws");
const fs = require("fs");

// Use dotenv to hide sensitive data
dotenv.config();
// Connect to MongoDB atlas
mongoose.connect(process.env.MONGO_URL, (err) => {
  if (err) throw err;
});
// JWT encryption key
const jwtSecret = process.env.JWT_SECRET;

const bcryptSalt = bcrypt.genSaltSync(10);

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
  })
);
app.use("/uploads", express.static(__dirname + "/uploads/"));
async function getUserDataFromRequest(req) {
  return new Promise((resolve, reject) => {
    // Get the token from the cookies
    const token = req.cookies?.token;
    // Verify the token and respond with the user's data
    if (token) {
      jwt.verify(token, jwtSecret, {}, (err, userData) => {
        if (err) throw err;
        resolve(userData);
      });
    } else {
      reject("No token,you haven't logged in yet.");
    }
  });
}
app.get("/test", (req, res) => {
  res.json("test ok");
});

app.get("/messages/:userId", async (req, res) => {
  const { userId } = req.params; //UserId of the other person
  const userData = await getUserDataFromRequest(req);
  const ourUserId = userData.userId; // Our userId
  const messages = await Message.find({
    sender: { $in: [userId, ourUserId] },
    recipient: { $in: [userId, ourUserId] },
  })
    .sort({ createdAt: 1 })
    .exec();
  res.json(messages);
});

app.get("/profile", (req, res) => {
  const token = req.cookies?.token; // Get the token from the cookies
  // Verify the token and respond with the user's data
  if (token) {
    jwt.verify(token, jwtSecret, {}, (err, userData) => {
      if (err) throw err;
      res.json(userData);
    });
  } else {
    res.status(401).json("no token");
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const foundUser = await User.findOne({ username });
  if (foundUser) {
    const passOk = bcrypt.compareSync(password, foundUser.password);
    if (passOk) {
      jwt.sign(
        { userId: foundUser._id, username },
        jwtSecret,
        {},
        (err, token) => {
          res.cookie("token", token, { sameSite: "none", secure: true }).json({
            id: foundUser._id,
          });
        }
      );
    }
  }
});
app.post("/logout", (req, res) => {
  res.cookie("token", { sameSite: "none", secure: true }).json("logged out");
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
    // Create user using the model
    const createdUser = await User.create({
      username: username,
      password: hashedPassword,
    });
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
            _id: createdUser._id,
          });
      }
    );
  } catch (err) {
    if (err) throw err;
    res.status(500).json("error");
  }
});

const server = app.listen(4000);

// Define a Web Socket Server (wss)
const wss = new ws.WebSocketServer({ server });
wss.on("connection", (connection, req) => {
  function whoIsOnline() {
    // Define function that sends details of who is online to each client
    [...wss.clients].forEach((client) => {
      client.send(
        JSON.stringify({
          online: [...wss.clients].map((c) => ({
            userId: c.userId,
            username: c.username,
          })),
        })
      );
    });
  }

  connection.isAlive = true;
  connection.timer = setInterval(() => {
    connection.ping();
    connection.deathTimer = setTimeout(() => {
      clearInterval(connection.timer);
      connection.isAlive = false;
      connection.terminate();
    }, 1000);
  }, 5000);
  connection.on("pong", () => {
    clearTimeout(connection.deathTimer);
  });
  // Get the cookie from the header
  const cookies = req.headers.cookie;
  if (cookies) {
    const tokenCookieString = cookies
      .split(";")
      .find((str) => str.startsWith("token="));
    if (tokenCookieString) {
      // Split the token and take the part after the equals to sign
      const token = tokenCookieString.split("=")[1];
      if (token) {
        // Decrypt the token
        jwt.verify(token, jwtSecret, {}, (err, userData) => {
          if (err) throw err;
          // Pass data to through the web socket connection
          const { userId, username } = userData;
          connection.userId = userId;
          connection.username = username;
        });
      }
    }
  }
  connection.on("message", async (message) => {
    const messageData = JSON.parse(message.toString());
    const { recipient, text, file } = messageData;
    let fileName = null;
    if (file) {
      console.log("Size: ", file.data.length);
      const fileParts = file.name.split(".");
      const fileExten = fileParts[fileParts.length - 1];
      fileName = Date.now() + "." + fileExten;
      const path = __dirname + "/uploads/" + fileName;
      const bufferData = new Buffer.from(file.data.split(",")[1], "base64");
      fs.writeFile(path, bufferData, () => {
        console.log("file saved:" + path);
      });
    }
    if ((recipient && text) || file) {
      const messageDoc = await Message.create({
        sender: connection.userId,
        recipient,
        text,
        file: fileName ? fileName : null,
      });
      // Filter is used instead of find because find only searches
      // for a single instance of a user, where as filter searches
      // for all instances
      [...wss.clients]
        .filter((c) => c.userId === recipient)
        .forEach((c) =>
          c.send(
            JSON.stringify({
              text,
              sender: connection.userId,
              recipient,
              file: file ? fileName : null,
              id: messageDoc._id,
            })
          )
        );
    }
  });
  app.get("/people", async (req, res) => {
    const users = await User.find({}, { _id: 1, username: 1 });
    res.json(users);
  });
  // Call function that sends details of who is online to each client
  whoIsOnline();
});
