
/**
 * Module dependencies.
 */
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const yargs = require('yargs');
var methodOverride = require("method-override");

const {db} = require('./db/mongoose');

const argv=yargs.options({
  p:{
    describe:'port number',
    demand:true,
    alias:'port',
    string:true
  },
  db:{
    describe:'mongodb URI of documents db',
    demand:true,
    alias:'docDb',
    string:true
  }
}).help()
.alias('help','h')
.argv;

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
