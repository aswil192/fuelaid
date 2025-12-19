const express = require("express");
const app = express();
const passport = require("passport");
const path= require("path");
const flash = require("connect-flash");
const session = require("express-session");
const multer = require("multer");
const http = require("http"); // ✅ Add this
const { Server } = require("socket.io"); // ✅ And this
// const expressLayouts = require("express-ejs-layouts");
const methodOverride = require("method-override");
const homeRoutes = require("./routes/home.js");
const blogsRoutes = require("./routes/blogs.js");
const servRoutes = require("./routes/services.js");
const authRoutes = require("./routes/auth.js");
const pageRoutes= require("./routes/pages.js");
const adminRoutes = require("./routes/admin.js");
const customerRoutes = require("./routes/customer.js");
const mechanicRoutes = require("./routes/mechanic.js");
const fuelRoutes = require("./routes/fueldeliveryboy.js");
require("dotenv").config();
require("./config/dbConnection.js")();
require("./config/passport.js")(passport);







app.set("view engine", "ejs");
app.set("views",path.resolve("./views"));
// app.use(expressLayouts);
app.use("/assets", express.static(__dirname + "/assets"));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use(express.static('public'));



app.use(express.json());
app.use(session({
	secret: "secret",
	resave: true,
	saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(methodOverride("_method"));
app.use((req, res, next) => {
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	res.locals.warning = req.flash("warning");
	next();
});




// Routes
app.use(homeRoutes);
app.use(blogsRoutes);
app.use(servRoutes);
app.use(authRoutes);
app.use(pageRoutes);
app.use(customerRoutes);
app.use(adminRoutes);
app.use(mechanicRoutes);
app.use(fuelRoutes);
app.use((req,res) => {
	res.status(404).render("404page", { title: "Page not found" });
});

const server = http.createServer(app);
const io = new Server(server);
app.set('socketio', io);
io.on('connection', (socket) => {
  console.log('A user connected');

  // Listen for location updates from mechanic
  socket.on('mechanicLocationUpdate', ({ mechanicId, lat, lng }) => {
    console.log(`Location update for mechanic ${mechanicId}: (${lat}, ${lng})`);
    io.emit('updateMechanicLocation', { mechanicId, lat, lng }); // Broadcast to all clients
  });
  socket.on('fuelLocationUpdate', ({ fuelId, lat, lng }) => {
        console.log(`Location update for fuel delivery boy ${fuelId}: (${lat}, ${lng})`);
        io.emit('updateFuelLocation', { fuelId, lat, lng }); // Broadcast to all clients
      });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

// io.on('connection', (socket) => {
//   console.log('A fuel del boy connected');

//   // Listen for location updates from fuel delivery boy
//   socket.on('fueldeliveryboyLocationUpdate', ({ fuelId, lat, lng }) => {
//     console.log(`Location update for fuel delivery boy ${fuelId}: (${lat}, ${lng})`);
//     io.emit('updatefueldeliveryboyLocation', { fuelId, lat, lng }); // Broadcast to all clients
//   });

//   socket.on('disconnect', () => {
//     console.log('fuel del boy disconnected');
//   });
// });
// ✅ Socket.io setup ends here


// Route for Terms and Conditions page



const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});