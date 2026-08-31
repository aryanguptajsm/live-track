const express = require("express");
const session = require("express-session");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const config = require("./config");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ---------- App setup ----------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "change-this-secret-key", // move to env var in production
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 4 } // 4 hours
  })
);

// ---------- Auth middleware ----------
function requireLogin(req, res, next) {
  if (req.session && req.session.loggedIn) {
    return next();
  }
  return res.redirect("/login");
}

// ---------- Routes ----------

// Login page
app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

// Handle login form
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === config.username && password === config.password) {
    req.session.loggedIn = true;
    return res.redirect("/admin");
  }

  res.render("login", { error: "Invalid username or password" });
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

// Admin dashboard (protected)
app.get("/admin", requireLogin, (req, res) => {
  res.render("admin");
});

// Page opened on the device that shares its location
app.get("/share", (req, res) => {
  res.render("share");
});

// Root -> send to login
app.get("/", (req, res) => {
  res.redirect("/login");
});

// ---------- Socket.io ----------
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Device sends its coordinates
  socket.on("location-update", (data) => {
    // data = { lat, lng, timestamp }
    // Broadcast to everyone else (admin dashboard listens for this)
    socket.broadcast.emit("location-update", data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// ---------- Start server ----------
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});