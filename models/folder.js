var mongoose=require('mongoose');
var Schema = mongoose.Schema;

var {getDbConnection} = require('../db/mongoose');

var FolderSchema = Schema({
  name:{
    type:String,
    required:true
  },
  child:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:"folder"
    }
  ],
  parent:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"folder"
  },
  date_created:{
    type:Date
  },
  document:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:"document"
    }
  ]
});


const Folder = getDbConnection().model('folder', FolderSchema);

module.exports = {
  Folder
};
