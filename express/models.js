var mongoose = require("mongoose");
mongoose.connect('mongodb://localhost:27017/taxi');
var Schema = mongoose.Schema;

var driverSchema = new Schema({
	"name" : String,
	"status" : String,
	"path" : Array
});

var passengerSchema = new Schema({
	"name" : String,
	"request" : Boolean
});

var Drivers = mongoose.model('drivers', driverSchema);
var Passengers = mongoose.model('passengers', passengerSchema);
module.exports = {
	Drivers: Drivers,
	Passengers: Passengers
};
