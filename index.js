const io = require('socket.io')(8000, {
  cors: {
    origin: 'http://localhost:3000',
  },
});

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
  return drivers.find((driver) => driver.id == driverId);
};

io.on('connection', (socket) => {
  ///Add online riders and update locations (drivers action)
  socket.on('addDriver', (driver) => {
    const socketId = socket.id;
    addDriver({ ...driver, socketId });
  });

  ///Get all online drivers (customers action)
  socket.on('getDrivers', () => {
    socket.emit('driversList', drivers);
  });

  ///Select a driver (customers action)
  socket.on('selectDriver', (driversId, customerInfo) => {
    const driver = getDriver(driversId);
    if (driver) {
      io.to(driver.socketId).emit('pickupRequest', customerInfo);
    }
  });

  ///Pickup request action (drivers action)
  socket.on('pickupReply', (customersId, answer) => {
    io.to(customersId).emit('answer', answer);
  });

  ////Get driver location
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
