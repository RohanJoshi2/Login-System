const express = require('express');
const session = require('express-session');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const app = express();
const prisma = new PrismaClient();

// Session middleware setup
app.use(session({
  secret: 'your_session_secret', // Replace with a strong, random string
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === "production", // Use secure cookies in production
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// ... other middleware and route setup ...

// Modify your login route
app.post('/log-in', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await prisma.users.findUnique({
      where: { username: username }
    });

    if (!user) {
      return res.status(401).send('Invalid username or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).send('Invalid username or password');
    }

    // Set user information in session
    req.session.userId = user.id;
    req.session.username = user.username;

    res.sendFile(path.join(__dirname, '../public/homepage.html'));
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal server error');
  }
});

// Add a logout route
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Could not log out, please try again');
    }
    res.redirect('/');
  });
});

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).send('You need to be logged in to access this page');
  }
}

// Example of a protected route
app.get('/profile', isAuthenticated, (req, res) => {
  res.send(`Welcome to your profile, ${req.session.username}!`);
});