/*
* Testing NeDB before I add it into the main myBot program to replace that BS array setup I made.
*/

const Datastore = require('nedb');
db = new Datastore();

function insertDocComplete (err, newDoc){
  if(err){
    console.log("Error inserting document: " + err);
  }
  else console.log("newDoc: " + newDoc._id);
}

function readDocument (err, newDoc){
  if(err){
    console.log("Error reading documents: " + err);
  }
  else {
    console.log("Returned document: ");
    console.log(newDoc);
  }
}

function setupTestDB (i) {
  console.log("Setup doc...");
  var docNum = null;
  id = 'id' + i;
  var doc = { _id : id
              , number : 5 + i
              , today : new Date()
              , bool : true
              , inception : { name : 'Fire' + i, color : 'orange'}
            };
  db.insert(doc, insertDocComplete);

/*
  db.findOne({_id : 'id1'}, function (err, returnDoc) {
    //console.log("Doc dumber: " + returnDoc.number);
    docNum = returnDoc.number;
    console.log("docNum is: " + docNum);
  });
  */
}

for( i = 0; i < 4; i++){
setupTestDB(i);
}

db.findOne({_id : 'id2'}, readDocument);

db.update({ 'inception.name': 'Fire2' }, { $set: { 'inception.color' : 'black'} }, {returnUpdatedDocs : true}, function (err, numReplaced) {
  db.findOne({'inception.name' : 'Fire2'}, function (err, newDoc){
    console.log(newDoc.inception.name + "'s new color is: " + newDoc.inception.color);
  });
});
