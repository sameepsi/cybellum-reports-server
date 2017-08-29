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
  parent_folder:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"folder"
  },
  custom_fields:[]
});


DocumentSchema.plugin(mongoosePaginate);

DocumentSchema.methods.toJSON = function () {
  var document = this;
  var docObject = document.toObject();

  var returnObject = _.pick(docObject, ['_id','explosion_address', 'original_path', 'target_address', 'parent_folder', 'custom_fields']);

  return returnObject;
};

const Document = getDbConnection().model('document', DocumentSchema);

module.exports = {
  Document
};
