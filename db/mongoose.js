/**
 * Module dependencies.
 */
var mongoose = require('mongoose');

mongoose.Promise = global.Promise;
var dbConnection;
const db = () =>{

return new Promise((resolve, reject)=>{
  console.log(process.env.MONOGO_DB);
 dbConnection = mongoose.createConnection(process.env.MONOGO_DB);

 dbConnection.on('connected', function() {
  console.log(`Mongoose connected to db: ${process.env.MONOGO_DB}`);
  resolve();
});
})


}

const getDbConnection = () => {
return dbConnection;
}



module.exports={
  getDbConnection,
  db

};
