var mongoose = require("mongoose");
mongoose.connect('mongodb://localhost:27017/taxi');
var Schema = mongoose.Schema;

var driverSchema = new Schema({
	"name" : String,
	"active" : Number,
	"status" : String,
	"color" : String,
	"path" : Object
});

var passengerSchema = new Schema({
	"name" : String,
	"active" : Number,
	"request" : Boolean,
	"color" : String,
	"male" : Boolean,
	"act" : Object,
	"aim" : Object,
	"address" : String
});

var Drivers = mongoose.model('drivers', driverSchema);
var Passengers = mongoose.model('passengers', passengerSchema);

module.exports = {
	Drivers: Drivers,
	Passengers: Passengers
};
