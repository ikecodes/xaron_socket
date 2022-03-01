const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const cors = require('cors');
const PORT = 5000;
//  origin: 'http://localhost:5000',

const app = express();
app.use(cors());
app.options('*', cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

////This will contain all drivers currently available with there locations
let drivers = [];

const addDriver = (data) => {
  if (!drivers.some((driver) => driver.id === data.id))
    return drivers.push(data);
  drivers = drivers.map((driver) => (driver.id === data.id ? data : driver));
};

const removeDriver = (socketId) => {
  drivers = drivers.filter((driver) => driver.socketId !== socketId);
};

const getDriver = (driverId) => {
  return drivers.find((driver) => driver.id === driverId);
};

io.on('connection', (socket) => {
  ///Add online riders and update locations (drivers action)
  ///You will emit addDriver event here. Once a driver is online, he should get connected to the websocket.
  socket.on('addDriver', (driver) => {
    const socketId = socket.id;
    addDriver({ ...driver, socketId });
  });

  ///Get all online drivers (customers action)
  ///When a customer wants to make a delivery, you will emit a getDrivers event so I can send you a list of all drivers online
  socket.on('getDrivers', () => {
    socket.emit('driversList', drivers);
  });

  ///Select a driver (customers action)
  ///From the list of drivers you have, the customer will select a driver and send a pickup request to that driver.
  socket.on('selectDriver', (driversId, customerInfo) => {
    const driver = getDriver(driversId);
    if (driver) {
      ///make sure the customerInfo here also contains the customers socketId because you will respond back with it
      io.to(driver.socketId).emit('pickupRequest', customerInfo);
    }
  });

  ///Pickup request action (drivers action)
  ///Here the driver responds to the pickupRequest, either accepting or rejecting.
  socket.on('pickupReply', (customersId, answer) => {
    ///responding back to the customer with his socketid
    io.to(customersId).emit('answer', answer);
  });

  ////Get driver location
  ///whenever the user wants to get the driver with the goods current location
  socket.on('getDriver', (driverId) => {
    const driver = getDriver(driverId);
    socket.emit('location', driver);
  });

  ///Remove any disconnected or offline driver
  socket.on('disconnect', () => {
    console.log('a user disconnected!');
    removeDriver(socket.id);
    // io.emit('getUsers', users);
  });
});

server.listen(PORT, () => console.log(`running on port ${PORT}`));
