
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config()

const authRoutes = require('./auth');
const app = express();
const PORT = process.env.PORT || 5000

app.use(express.json())
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true, 
}))

app.use(session({
  secret: 'your-secret',
  resave: false,
  saveUninitialized: true,
}))

app.use('/', authRoutes)

app.get('/', (req, res) => {
  res.send('Hello from TypeScript backend!')
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
