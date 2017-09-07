
/**
 * Module dependencies.
 */
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
var methodOverride = require("method-override");

const {db} = require('./db/mongoose');



var port = process.env.PORT || 3000;

db().then(async(res)=>{
  try{

  var folderRoutes = require("./routes/folder/index");
  var folderDocumentRoutes = require("./routes/folder/document/index");

var app=express();
app.use(bodyParser.json());
app.use(methodOverride("_method"));
/**
 * Register all routes of app.
 */
 app.use(folderRoutes);
 app.use(folderDocumentRoutes);


/**
 * Start Application
 */

app.listen(port,(err)=>{
  if(err){
    return console.log(`Failed to start server on port ${port}`);
  }
  console.log(`Server started on port ${port}`);
});
}catch(e){
  console.log(e);
}
},(err)=>{
  console.log(`Failed to connect to db ${process.env.MONOGO_DB} with following error ${err}`);
});
