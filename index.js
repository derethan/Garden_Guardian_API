// API To handle communication between the Node.js server and the Arduino

const express = require('express');
const bodyParser = require('body-parser');

const app = express();

//Parse Json body request
app.use(bodyParser.json());



/*********************************************
 * GET request to handle communication between the Node.js server and the Arduino
 * 
 * *******************************************/
app.get('/test1', (request, response) => {

    console.log('GET request received at /test1');
    
    // You can send any data as a response here
    const responseData = { message: 'This is a response from the Node.js server' };
    
    // Send a JSON response
    response.json(responseData);
  });

/*********************************************
 * POST request to handle data sent from the Arduino
 * 
 * The data sent from the Arduino should be in the following format:
 * {
 * temperature: 25.5,
 * humidity: 50.5
 * }
 * 
 * You can send any data as a response here
 * 
 * *******************************************/
app.post('/sensorData', (request, response) => {

    const sensorData = request.body;
    let temp = sensorData.temperature;
    let humidity = sensorData.humidity;

    console.log('POST request received at /sensorData ' + temp + ' ' + humidity);


    // You can send any data as a response here
    const responseData = { message: 'Sensor Data Recieved' };
    // Send a JSON response
    response.json(responseData);
  });


//Port
const port = 80;
const host = '0.0.0.0';
app.listen(port, host);
console.log(`Listening at http://${host}:${port}`);