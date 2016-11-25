var cors = require('cors');
var express = require("express");
var app = express();
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
	.get(function(req, res){
		var response = {};
		mongoOp.Drivers.find({},function(err, driver) {
			if(!err) {
				response = {"error" : false, "data" : driver};
			}
			console.log("Listed all drivers");
			res.json(response);
		});
	});

router.route("/drivers/:id")
	.get(function(req, res) {
		var response = {};
		mongoOp.Drivers.findById(req.params.id, function(err, driver) {
			if(!err) {
				response = {"error" : false, "data" : driver};
			}
			console.log("Driver: " + req.params.id + " listed.");
			res.json(response);
		});
	})
	.put(function(req, res) {
		var response = {};
		mongoOp.Drivers.findById(req.params.id, function(err, driver) {
			if(!err) {
				var isAlready = false;
				
				if(req.body.status !== undefined) {
					driver.status = req.body.status;
				}
				if(req.body.lat !== undefined && req.body.lng !== undefined) {
					var lat = req.body.lat;
					var lng = req.body.lng;
					var newpoint = {lat, lng};
					var newpath = driver.toObject().path;
					
					newpath.forEach(function(point, i, object) {
						if(point.lat == req.body.lat && point.lng == req.body.lng) {
							isAlready = true;
						}
					});
					
					if(!isAlready) {
						newpath.push(newpoint);
						driver.path = newpath;
												
						driver.save(function(err, updateddriver) {
							if(!err) {
								console.log("Driver: " + req.params.id + " has a new destination added.");
								res.send(updateddriver);
							}
						})
					}
				}
			}
		});
	})
	.delete(function(req, res) {
		var response = {};
		mongoOp.Drivers.findById(req.params.id, function(err, driver) {
			if(!err) {
				var wasAlready = false;
				
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
						
						driver.save(function(err, updateddriver) {
							if(!err) {
								console.log("Driver: " + req.params.id + " has one destination removed.");
								res.send(updateddriver);
							}
						})
					}
				}
			}
		});
	});
					

router.route("/passengers")
        .get(function(req, res){
                var response = {};
                mongoOp.Passengers.find({},function(err, data) {
                        if(!err) {
                                response = {"error" : false, "data" : data};
                        }
                        res.json(response);
                });
        });

router.route("/passengers/:id")
        .get(function(req, res) {
                var response = {};
                mongoOp.Passengers.findById(req.params.id, function(err, data) {
                        if(!err) {
                        	response = {"error" : false, "data" : data}; 
                        }
                        res.json(response);
                });
        });


app.use('/',router);

app.listen(28017);
console.log("Listening to PORT 28017");
