// API To handle communication between the Node server and the Arduino

const fs = require('fs');
const http = require('http');
const https = require('https');

// Enable Express
const express = require('express');
const app = express();

// Enable session management
const session = require('express-session');

// Enable the use of cookies
app.use(session({
  secret: `${process.env.SESSION_SECRET}`,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Configure dotenv
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

//Tell the App to use the body-parser middleware
const bodyParser = require('body-parser');
app.use(bodyParser.json());

//Import cors and tell the app to use it
const cors = require('cors');
app.use(cors());

// Import route handlers
const userRoutes = require('./routes/userRoutes');
const sensorRoutes = require('./routes/sensorRoutes');
const dataRoutes = require('./routes/dataRoutes');
const aiRoutes = require('./routes/aiRoutes');
const rootaiRoutes = require('./routes/rootaiRoutes');
const tagRoutes = require('./routes/tagRoutes');

// Add headers
app.use((req, res, next) => {
    res.header('Access-Control-Expose-Headers', 'Authorization');
    next();
  });

//Define Middleware and Routes
app.use(express.json());
app.use('/users', userRoutes);
app.use('/sensors', sensorRoutes);
app.use('/api', dataRoutes);
app.use('/ai', aiRoutes);
app.use('/rootai', rootaiRoutes);
app.use('/api', tagRoutes);

// Your routes and middleware setup
app.get('/', (req, res) => {
  res.send('Guarden Guardian API server!');
});


// SSL options
// const sslOptions = {
//   key: fs.readFileSync('./sslcert/ggssl.key', 'utf8'),
//   cert: fs.readFileSync('./sslcert/63be74e1b51ba86b.crt', 'utf8'),
//   ca: fs.readFileSync('./sslcert/gd_bundle-g2-g1.crt', 'utf8')
// };


const host = '0.0.0.0';


// //Start the HTTPS server
// const httpsServer = https.createServer(sslOptions, app);
// const httpsPort = 8443;
// httpsServer.listen(httpsPort,host, () => {
//   console.log(`Listening at https://localhost:${httpsPort}`);
// });


// Start the HTTP server
var httpServer = http.createServer(app);
const port = 3420;
httpServer.listen(port, host, () => {
  console.log(`Listening at http://localhost:${port}`);
});