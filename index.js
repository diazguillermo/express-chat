var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var logger = require('morgan');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectId;
var url = 'mongodb://localhost:27017/test';
// var connect = require('connect');
// var methodOverride = require('method-override');
// var routes = require('./routes/index');
// var users = require('./routes/users');

var users = 0;

var insertDocument = function(db, callback) {
   db.collection('restaurants').insertOne( {
      "address" : {
         "street" : "2 Avenue",
         "zipcode" : "10075",
         "building" : "1480",
         "coord" : [ -73.9557413, 40.7720266 ]
      },
      "borough" : "Manhattan",
      "cuisine" : "Italian",
      "grades" : [
         {
            "date" : new Date("2014-10-01T00:00:00Z"),
            "grade" : "A",
            "score" : 11
         },
         {
            "date" : new Date("2014-01-16T00:00:00Z"),
            "grade" : "B",
            "score" : 17
         }
      ],
      "name" : "Vella",
      "restaurant_id" : "41704620"
   }, function(err, result) {
    assert.equal(err, null);
    console.log("Inserted a document into the restaurants collection.");
    callback();
  });
};

var findRestaurants = function(db, callback) {
   var cursor = db.collection('restaurants').find( { "name": "Vella" } ); //{ %gt: 10 } (greater than 10)
   cursor.each(function(err, doc) {
      assert.equal(err, null);
      if (doc != null) {
         console.dir(doc);
      } else {
         callback();
      }
   });
};

// MongoClient.connect(url, function(err, db) {
//    assert.equal(null, err);
   // findMessages(db, function() {
   //    db.close();
   // });
// });

app.use(logger('dev'));
// app.use('/subapp', require('./stormpath/app.js'));

app.use("/node_modules", express.static(__dirname + '/node_modules'));

app.get('/', function(req, res){
   res.sendFile(__dirname + '/index.html');
});

// app.listen(3000);//8080

var findMessages = function(db, callback) {
   var cursor = db.collection('messages').find();
   cursor.each(function(err,doc) {
      assert.equal(err, null);
      if (doc != null) {
         console.dir(doc);
      } else {
         callback();
      }
   });
};

var addMessage = function(msg, db, callback) {
   db.collection("messages").insertOne( {
      "message": msg
   }, function(err,result){
      assert.equal(err, null);
      console.log("Message inserted into the message collection.");
      callback();
   });
};

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
      socket.broadcast.emit('chat message', "A user has disconnected.");
   });

   socket.on('chat message', function (msg){
      io.emit('chat message', "User " + "socket.id" + ": " + msg);
      // MongoClient.connect(url, function(err, db) {
      //    assert.equal(null, err)
      //    addMessage(msg, db, function(){
      //       db.close();
      //    });
      // });
   });
});

http.listen(process.env.PORT || 3000, function(){
   console.log('listening on *:3000');
   console.log("# of users: " + users);
});
