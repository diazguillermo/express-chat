var express = require('express');
var io = require('socket.io')(http);
var logger = require('morgan');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectId;
var url = 'mongodb://localhost:27017/test';
var dbConfig = require('./mongo/db.js');
var mongo = require('./mongo/mongofunc.js');
var mongoose = require('mongoose');
var passport = require('passport');
var expressSession = require('express-session');
var flash = require('connect-flash');
var favicon = require('static-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var app = express();
var http = require('http').Server(app);

var users = 0;

// app.set('views', __dirname + '/routes');
// app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use("/node_modules", express.static(__dirname + '/node_modules'));

mongoose.connect(dbConfig.url);
app.use(expressSession({secret: 'mySecretKey'}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash()); // Using the flash middleware provided by connect-flash to store messages in session
// and displaying in templates

var initPassport = require('./server/init');
initPassport(passport);

// var routes = require('./routes/index.js')(passport);
// app.use('/routes', routes);

// app.use('/public', express.static(__dirname + '/public'));

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
 res.sendFile(__dirname + '/routes/start.html', { message: req.flash('message') });
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

MongoClient.connect(url, function(err, db) {
   assert.equal(null, err);
   mongo.findMessages(db, function() {
      db.close();
   });
});

// app.get('/chat', function(req, res){
//    res.sendFile(__dirname + '/index.html');
// });

// app.listen(3000);//8080

io.on('connection', function (socket){
   console.log('a user connected');
   users++;
   console.log("# of users: " + users);
   io.emit('users', users);
   socket.broadcast.emit('chat message', "A user is ready to chat.");
   socket.on('disconnect', function() {
      console.log('user disconnected');
      users--;
      io.emit('users', users);
   });

   socket.on('chat message', function (msg){
      io.emit('chat message', "User " + socket.id + ": " + msg);
      // MongoClient.connect(url, function(err, db) {
      //    assert.equal(null, err)
      //    addMessage(msg, db, function(){
      //       db.close();
      //    });
      // });
   });
});

http.listen(3000, function(){
   console.log('listening on *:3000');
   console.log("# of users: " + users);
});

module.exports = app;
