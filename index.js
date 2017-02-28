var express = require('express');
var app = module.exports = express();
var http = require('http').Server(app);
var logger = require('morgan');
var io = require('socket.io')(http);
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectId;
var url = 'mongodb://localhost:27017/test';
var dbConfig = require('./mongo/db.js');
var mongo = require('./mongo/mongofunc.js');
var mongoose = require('mongoose');
var passport = require('passport');
var expressSession = require('express-session');
const MongoStore = require('connect-mongo')(expressSession);
var flash = require('connect-flash');
var favicon = require('static-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passportSocketIo = require('passport.socketio');

var users = 0;

// var sessionStore = new MongoStore({ mongooseConnection: mongoose.connection });

// var sessionMiddleware = expressSession({
// 	store: sessionStore,
// 	resave: false,
// 	saveUninitialized: false,
// 	secret: "secretKey",
// });

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use("/node_modules", express.static(__dirname + '/node_modules'));

// uncomment for mongodb
// mongoose.connect(dbConfig.url);
// app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash()); // Using the flash middleware provided by connect-flash to store messages in session
// and displaying in templates

app.use("/routes", express.static(__dirname + "/routes"));

var initPassport = require('./server/init');
initPassport(passport);

var isAuthenticated = function (req, res, next) {
	// if user is authenticated in the session, call the next() to call the next request handler
	// Passport adds this method to request object. A middleware is allowed to add properties to
	// request and response objects
	if (req.isAuthenticated())
		return next();
	// if the user is not authenticated then redirect him to the login page
	res.redirect('/');
}


/* GET login page. */
app.get('/', function(req, res) {
 // Display the Login page with any flash message, if any
 // ***uncomment below to set up passport***
 // res.sendFile(__dirname + '/routes/start.html', { message: req.flash('message') });
 res.sendFile(__dirname + '/routes/index.html');
});

/* Handle Login POST */
app.post('/login', passport.authenticate('login', {
 successRedirect: '/home',
 failureRedirect: '/',
 failureFlash : true
}));

/* GET Registration Page */
app.get('/signup', function(req, res){
 res.sendFile(__dirname + '/routes/register.html',{message: req.flash('message')});
});

/* Handle Registration POST */
app.post('/signup', passport.authenticate('signup', {
 successRedirect: '/home',
 failureRedirect: '/signup',
 failureFlash : true
}));

/* GET Home Page */
app.get('/home', isAuthenticated, function(req, res){
	res.sendFile(__dirname + '/routes/index.html', { user: req.user });
});

/* Handle Logout */
app.get('/signout', function(req, res) {
	req.logout();
	res.redirect('/');
});

// MongoClient.connect(url, function(err, db) {
//    assert.equal(null, err);
//    mongo.findMessages(db, function() {
//       db.close();
//    });
// });


// io.use(passportSocketIo.authorize({
// 	store: sessionStore,
// 	key: 'connect.sid',
// 	secret: "secretKey",
// 	passport: passport,
// 	cookieParser: cookieParser
// }));

io.on('connection', function (socket){
	var userId = "exampleName";
	// var userId = socket.request.user.username;
   console.log('a user connected');
   users++;
   console.log("# of users: " + users);
   io.emit('users', users);
   socket.broadcast.emit('chat message', "A user is ready to chat.");

   socket.on('disconnect', function() {
      console.log('user disconnected');
      users--;
			console.log("# of users: " + users);
      io.emit('users', users);
      socket.broadcast.emit('chat message', "A user has disconnected.");
   });

   socket.on('chat message', function (msg){
		io.emit('chat message', "User " + userId + ": " + msg);

			// uncomment to reenable mongo
      // MongoClient.connect(url, function(err, db) {
      //    assert.equal(null, err)
      //    mongo.addMessage(msg, userId, db, function(){
      //       db.close();
        //  });

      });
  //  });

});

http.listen(process.env.PORT || 3000, function(){
   console.log('listening on *:3000');
   console.log("# of users: " + users);
});
