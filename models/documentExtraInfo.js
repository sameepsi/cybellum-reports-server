var mongoose = require("mongoose");
var {getDbConnection} = require('../db/mongoose');

var docExtraInfoSchema = mongoose.Schema({
  data:{}
});


const docExtraInfo = getDbConnection().model('document_extra_info', docExtraInfoSchema);
module.exports = docExtraInfo;
