const express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;
const SECRET_KEY = "your_secret_key"; // use a secure secret in production

app.use(bodyParser.json());

// Sample users with roles
const users = [
  { username: "admin", password: "admin123", role: "Admin" },
  { username: "mod", password: "mod123", role: "Moderator" },
  { username: "user", password: "user123", role: "User" }
];

// Login route - issues JWT containing role
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  
  const token = jwt.sign({ username: user.username, role: user.role }, SECRET_KEY, { expiresIn: "1h" });
  res.json({ token });
});

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Malformed token" });

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = decoded;
    next();
  });
};

// Middleware for role-based access
const permit = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ message: "Forbidden: insufficient role" });
    next();
  };
};

// Protected routes
app.get("/admin", verifyToken, permit("Admin"), (req, res) => {
  res.json({ message: `Hello ${req.user.username}, welcome to the Admin dashboard!` });
});

app.get("/moderator", verifyToken, permit("Admin", "Moderator"), (req, res) => {
  res.json({ message: `Hello ${req.user.username}, welcome to the Moderator page!` });
});

app.get("/user", verifyToken, permit("Admin", "Moderator", "User"), (req, res) => {
  res.json({ message: `Hello ${req.user.username}, welcome to your profile!` });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
