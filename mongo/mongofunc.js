var assert = require('assert');
var mdb = new Object();

mdb.findMessages = function(db, callback) {
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

mdb.addMessage = function(msg, sender, db, callback) {
   db.collection("messages").insertOne( {
      "message": msg,
      "sender": sender
   }, function(err,result){
      assert.equal(err, null);
      console.log("Message inserted into the message collection.");
      callback();
   });
};

module.exports = mdb;
