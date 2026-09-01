const express = require("express");
const session = require("express-session");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const config = require("./config");

const latestLocations = new Map();

function getTargetSnapshot() {
  return Array.from(latestLocations, ([id, latestLocation]) => ({
    id,
    label: "Connected target",
    latestLocation,
    hasLocation: true
  }));
}

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
    secret: "change-this-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 4 }
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
app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === config.username && password === config.password) {
    req.session.loggedIn = true;
    return res.redirect("/admin");
  }

  res.render("login", { error: "Invalid username or password" });
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

app.get("/admin", requireLogin, (req, res) => {
  res.render("admin", { targets: getTargetSnapshot() });
});

app.get("/share", (req, res) => {
  res.render("share");
});

app.get("/", (req, res) => {
  res.redirect("/login");
});

// ---------- Socket.io ----------
io.on("connection", (socket) => {
  const role = socket.handshake.query.role;

  console.log("Client connected:", socket.id);

  if (role === "admin") {
    socket.emit("target-list", getTargetSnapshot());
  }

  socket.on("location-update", (data = {}) => {
    const targetId = socket.id;
    const lat = Number(data.lat);
    const lng = Number(data.lng);
    const accuracy = Number(data.accuracy);
    const timestamp = data.timestamp || new Date().toISOString();

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return;
    }

    const payload = {
      targetId,
      lat,
      lng,
      accuracy: Number.isNaN(accuracy) ? null : accuracy,
      timestamp
    };

    latestLocations.set(targetId, payload);

    io.emit("location-update", payload);
    io.emit("target-list", getTargetSnapshot());
  });

  socket.on("disconnect", () => {
    if (latestLocations.delete(socket.id)) {
      io.emit("target-list", getTargetSnapshot());
      io.emit("target-removed", socket.id);
    }

    console.log("Client disconnected:", socket.id);
  });
});

// ---------- Start server ----------
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
