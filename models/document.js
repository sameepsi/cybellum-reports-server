var mongoose=require('mongoose');
var Schema = mongoose.Schema;
var mongoosePaginate = require('mongoose-paginate');
var _ = require('lodash');

var {getDbConnection} = require('../db/mongoose');


var DocumentSchema = Schema({

  explosion_address:{
    type: Number
  },
  original_path:{
    type:String
  },
  target_address:{
    type: Number
  },
  vulnerability_type:{
    type:Number
  },
  parent_folder:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"folder"
  },
  extra_info:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"document_extra_info"
  },
  instruction_descriptor:{
    type:Schema.Types.Mixed
  },
  heap_info:{
    type:Schema.Types.Mixed
  },
  runtime_information:{
    type:Schema.Types.Mixed
  },
  stacktrace : []

});


DocumentSchema.plugin(mongoosePaginate);

DocumentSchema.methods.toJSON = function () {
  var document = this;
  var docObject = document.toObject();

  var returnObject = _.pick(docObject, ['_id','vulnerability_type','target_address','instruction_descriptor', 'original_path', 'runtime_information', 'stacktrace', 'heap_info', 'parent_folder', 'extra_info']);

  return returnObject;
};

const Document = getDbConnection().model('document', DocumentSchema);

module.exports = {
  Document
};
