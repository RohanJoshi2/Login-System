const express = require('express');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
const port = 5000;
const prisma = new PrismaClient();

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({ 
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
}));

async function logEvent(type, success, reason) {
  try {
    await prisma.logs.create({
      data: {
        type,
        success: success ? 'true' : 'false',
        reason
      }
    });
  } catch (error) {
    console.error('Error logging event:', error);
  }
}

function containsSpace(str) {
  return str.includes(" ");
}

function isAuthenticated(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
}

app.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/homepage');
  } else {
    res.redirect('/login');
  }
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/signup.html'));
});

app.post('/create-account', async (req, res) => {
  console.log('Received request body:', req.body);
  const { username, password } = req.body;
  
  if (!username || !password) {
    console.log('Username or password is blank');
    await logEvent('account_creation', false, 'Username or password is blank');
    return res.status(400).json({ message: 'Username and password are required' });
  }
  if (containsSpace(username) || containsSpace(password)) {
    console.log('Username or password contains whitespace');
    await logEvent('account_creation', false, 'Username or password contains whitespace');
    return res.status(400).json({ message: 'Username and password cannot contain spaces' });
  }
  if (password.length < 8) {
    console.log('Password is too short');
    await logEvent('account_creation', false, 'Password is too short');
    return res.status(400).json({ message: 'Password must be at least 8 characters long' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
   
    await prisma.users.create({
      data: {
        username: username,
        password: hashedPassword
      }
    });
    console.log('Account created successfully');
    await logEvent('account_creation', true, 'Account created successfully');
    res.status(201).json({ message: 'Account created successfully' });
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('Username already exists');
      await logEvent('account_creation', false, 'Username already exists');
      res.status(400).json({ message: 'Username already exists' });
    } else {
      console.error('Internal server error:', error);
      await logEvent('account_creation', false, 'Internal server error: ' + error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
});

app.post('/log-in', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await prisma.users.findUnique({
      where: { username: username }
    });
    if (!user) {
      await logEvent('login', false, 'User does not exist');
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await logEvent('login', false, 'Incorrect password');
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    req.session.user = { id: user.id, username: user.username };
    await logEvent('login', true, 'Login successful');
    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    console.error('Error:', error);
    await logEvent('login', false, 'Internal server error: ' + error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/homepage', isAuthenticated, (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Homepage</title>
        <style>
          body {
            background: linear-gradient(to top left, #000000 35%, #535252) no-repeat;
            background-size: cover;
            height: 100vh;
            display: flex;
            text-align: center;
            align-items: center;
            justify-content: center;
            font-family: "Roboto", sans-serif;
            color: white;
          }
            
          a:link {
              text-decoration: none;
              color: aliceblue;
          }

          a:visited {
              text-decoration: none;
              color: rgb(189, 208, 224);
          }

          a:hover {
              text-decoration: none;
              color: rgb(128, 153, 173);
          }

          a:active {
              text-decoration: none;
          }
        </style>
      </head>
      <body>
        <p>Welcome to your homepage, ${req.session.user.username}! <a href="/logout">Logout</a></p>
      </body>
    </html>
  `);
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/login');
  });
});

app.listen(port, () => console.log('Server running on port', port));

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
