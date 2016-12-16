var fs = require('fs');
var https = require('https');
var cors = require('cors');
var express = require("express");
var app = express();
var options = {
	key: fs.readFileSync('../../server.key'),
	cert: fs.readFileSync('../../server.crt')
}
app.use(cors());
var bodyParser = require("body-parser");
var mongoOp = require("./models");
var router = express.Router();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({"extended" : false}));

router.get("/",function(req,res){
	res.json({"error" : false, "data" : "404 error"});
});

router.route("/drivers")
	.get(function(req, res) {
		var response = {};
		mongoOp.Drivers.find({},function(err, drivers) {
			if(!err) {
				response = {"error" : false, "data" : drivers};
			}
			console.log("Listed all drivers");
			res.json(response);
		});
	})
	.put(function(req, res) {
		var response = {};
		var driversnearby = [];

		mongoOp.Drivers.find({},function(err, drivers) {
			if(!err) {
				if(req.body.lat !== undefined && req.body.lng !== undefined) {
					drivers.forEach(function(driver, i) {
						if(Math.abs(driver.path[0].lat-req.body.lat) < 0.014 && Math.abs(driver.path[0].lng-req.body.lng) < 0.024) {
							driversnearby.push(driver);
						}
					});
					response = {"error" : false, "data" : driversnearby};
					console.log("Listed all drivers nearby");
					res.json(response);
				}
			}
		});
	});

router.route("/drivers/:id")
	.get(function(req, res) {
		var response = {};
		mongoOp.Drivers.findById(req.params.id, function(err, driver) {
			if(!err) {
				//The driver is active.
				var timeout = new Date().getTime() + 5*60*1000; // in the next 5 minutes
				driver.active = timeout;

				driver.save(function(err, updateddriver) {
					if(!err) {
						console.log("Driver: " + req.params.id + " show up.");
						response = {"error" : false, "data" : updateddriver};
						res.json(response);
					}
				});
			}
		});
	})
	.put(function(req, res) {
		var response = {};
		mongoOp.Drivers.findById(req.params.id, function(err, driver) {
			if(!err) {
				var isAlready = false;
				//The driver is active.
				var timeout = new Date().getTime() + 5*60*1000; // in the next 5 minutes
				driver.active = timeout;

				//The status of the taxi can change.
				if(req.body.status !== undefined) {
					driver.status = req.body.status;
				}
				//There could be new destination point added.
				if(req.body.lat !== undefined && req.body.lng !== undefined && req.body.aimlat !== undefined && req.body.aimlng !== undefined) {
					var lat = parseFloat(req.body.lat.toFixed(6));
					var lng = parseFloat(req.body.lng.toFixed(6));
					var newpoint = {lat, lng};
					var newpath = driver.toObject().path;
					var newpassengers = driver.toObject().passengers;

					newpath.push(newpoint);

					lat = parseFloat(req.body.aimlat.toFixed(6));
					lng = parseFloat(req.body.aimlng.toFixed(6));
					newpoint = {lat, lng};

					newpath.push(newpoint);
					driver.path = newpath;

					newpassengers.push(req.body.passengerId);
					driver.passengers = newpassengers;

					driver.save(function(err, updateddriver) {
						if(!err) {
							console.log("Driver: " + req.params.id + " has a new destination added.");
							response = {"error" : false, "data" : updateddriver};
							res.json(response);
						}
					});
				}
				//The taxi can move.
				if(req.body.movelat !== undefined && req.body.movelng !== undefined) {
					var lat = req.body.movelat;
					var lng = req.body.movelng;
					var newpoint = {lat, lng};
					var path = driver.toObject().path;
					var newpath = [];

					path.forEach(function(point, i) {
						if(i > 0) {
							if(Math.abs(point.lat-lat) > 0.0014 || Math.abs(point.lng-lng) > 0.0024) {
								newpath.push(point);
							}
						}
					});
					newpath.unshift(newpoint);

					driver.path = newpath;
					driver.save(function(err, updateddriver) {
						if(!err) {
							if((path[0].lat != lat) || (path[0].lng != lng)) console.log("Driver: " + req.params.id + " has a new position.");
							response = {"error" : false, "data" : updateddriver};
							res.json(response);
						}
					});
				}
			}
		});
	})
	.delete(function(req, res) {
		var response = {};
		mongoOp.Drivers.findById(req.params.id, function(err, driver) {
			if(!err) {
				var wasAlready = false;
				//The driver is active.
				var timeout = new Date().getTime() + 5*60*1000; // in the next 5 minutes
				driver.active = timeout;
				var passengers = driver.toObject().passengers;
				var newpassengers = [];

				//The destination point can be removed.
				if(req.body.lat !== undefined && req.body.lng !== undefined) {
					var newpath = driver.toObject().path;

					newpath.forEach(function(point, i, object) {
						if(point.lat == req.body.lat && point.lng == req.body.lng) {
							wasAlready = true;
							object.splice(i, 1);
						}
					});

					if(wasAlready) {
						driver.path = newpath;
					}
				}
				//The passenger can be removed.
				if(req.body.passenger !== undefined) {
					passengers.forEach(function(passenger, i) {
						if(passenger != req.body.passenger) {
							newpassengers.push(passenger);
						}
					});
					driver.passengers = newpassengers;
				}

				driver.save(function(err, updateddriver) {
					if(!err) {
						console.log("Driver: " + req.params.id + " has one destination removed.");
						res.send(updateddriver);
					}
				});
			}
		});
	});

router.route("/passengers")
	.get(function(req, res){
		var response = {};
		mongoOp.Passengers.find({},function(err, passenger) {
			if(!err) {
				response = {"error" : false, "data" : passenger};
			}
			console.log("Listed all passengers");
				res.json(response);
		});
	});

router.route("/passengers/:id")
	.get(function(req, res) {
		var response = {};
		mongoOp.Passengers.findById(req.params.id, function(err, passenger) {
			if(!err) {
				//The passenger is active.
				var timeout = new Date().getTime() + 5*60*1000; // in the next 5 minutes
				if(timeout - passenger.active > 60*60*1000) { // in the last 60 minutes, he/she was not available, so probably he/she has a new destination
					passenger.status = 0;
				}
				passenger.active = timeout;

				passenger.save(function(err, updatedpassenger) {
					if(!err) {
						console.log("Passenger: " + req.params.id + " show up.");
						response = {"error" : false, "data" : updatedpassenger};
						res.json(response);
					}
				});
			}
		});
	})
	.put(function(req, res) {
		var response = {};
		mongoOp.Passengers.findById(req.params.id, function(err, passenger) {
			if(!err) {
				var moving = false;
				var dest = false;
				var status = false;
				//The passenger is active.
				var timeout = new Date().getTime() + 5*60*1000; // in the next 5 minutes
				passenger.active = timeout;

				//The position of the passenger can change.
				if((req.body.lat !== undefined && req.body.lng !== undefined) && (req.body.lat !== passenger.act.lat || req.body.lng !== passenger.act.lng)) {
					var lat = req.body.lat;
					var lng = req.body.lng;
					var newpoint = {lat, lng};
					passenger.act = newpoint;
					moving = true;
				}
				//The destination of the passenger can change.
				if(req.body.aimlat !== undefined && req.body.aimlng !== undefined) {
					var lat = req.body.aimlat;
					var lng = req.body.aimlng;
					var newpoint = {lat, lng};
					passenger.aim = newpoint;
					dest = true;
				}
				//The destination address of the passenger can change.
				if(req.body.address !== undefined) {
					passenger.address = req.body.address;
					dest = true;
				}
				//The status of the passenger can change.
				if(req.body.status !== undefined) {
					passenger.status = req.body.status;
					if(req.body.status == 0 || req.body.status == 3) {
						passenger.driver = "";
					} else if(req.body.status == 2) {
						passenger.driver = req.body.driver;
					}
					status = true;
				}

				passenger.save(function(err, updatedpassenger) {
					if(!err) {
						if(moving) console.log("Passenger: " + req.params.id + " has a new position.");
						if(dest) console.log("Passenger: " + req.params.id + " has a new destination.");
						if(status) console.log("Passenger: " + req.params.id + " has a new status.");
						response = {"error" : false, "data" : updatedpassenger};
						res.json(response);
					}
				});
			}
		});
	});

app.use('/',router);

https.createServer(options, app).listen(28017, function() {
	console.log("Listening to PORT 28017");
});
