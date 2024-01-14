/*
 RBAC (Role-Based Access Control) in Node.js
*/

import bodyParser from "body-parser";
import express from "express";
import session from "express-session";
import redis from "redis";
import dotenv from "dotenv"
import RedisStore from "connect-redis";
dotenv.config()
const app = express();
const redisClient = redis.createClient();
redisClient.connect();

const redisStore = new RedisStore({
    client: redisClient,
    prefix: "session"
})

app.use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET,
    store: redisStore
  })
);

app.use(bodyParser.json());


// Middleware
function hasPermission(action) {
  return async (req, res, next) => {
    const username = req.session.username;
    const role = await redisClient.hGet(`user:${username}`, "role");
    const hasPermission = await redisClient.sIsMember(`role:${role}`, action)
    if (hasPermission) {
      next(); // Permission granted
    } else {
      res.status(403).send("Access Denied"); // Permission denied
    }
  };
}

app.post("/login", (req, res) => {
  const { username } = req.body;
  // Gör lösenordsautentisering här
  req.session.username = username
  res.send("Login successful")
});

// Routes med role-based access control
app.get("/data", hasPermission("read"), (req, res) => {
  res.send("Data read");
});

app.post("/data", hasPermission("create"), (req, res) => {
  res.send("Data created");
});

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
