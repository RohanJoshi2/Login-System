const express = require('express');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const app = express();
const port = 5000;
const prisma = new PrismaClient();


app.use(express.static(path.join(__dirname, '../public')));
app.use(bodyParser.urlencoded({ extended: true }));


app.post('/create-account', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await prisma.users.create({
      data: {
        username: username,
        password: hashedPassword
      }
    });

    res.sendFile(path.join(__dirname, '../public/homepage.html'));
    console.log('Account created successfully');
  } catch (error) {
    if (error.code === 'P2002') {
      res.sendFile(path.join(__dirname, '../public/index.html'));
      console.log('Username already exists');
    } else {
      res.sendFile(path.join(__dirname, '../public/index.html'));
      console.log('Internal server error');
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
      res.sendFile(path.join(__dirname, '../public/index.html'));
      console.log('User does not exist');
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.sendFile(path.join(__dirname, '../public/index.html'));
      console.log('Incorrect password');
      return;
    }

    // Implement proper session management here

    res.sendFile(path.join(__dirname, '../public/homepage.html'));
    console.log('Login successful');
  } catch (error) {
    console.error('Error:', error);
    res.sendFile(path.join(__dirname, '../public/index.html'));
    console.log('Internal server error');
  }
});


app.listen(port, () => console.log(`Server running on port ${port}`));

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});