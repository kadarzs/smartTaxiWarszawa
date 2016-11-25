var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoOp = require("./models");
var router = express.Router();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({"extended" : false}));

router.get("/",function(req,res){
    res.json({"error" : false,"message" : "Hello World"});
});

router.route("/drivers")
	.get(function(req, res){
		var response = {};
		mongoOp.Drivers.find({},function(err, data) {
			if(!err) {
				response = {"error" : false, "data" : data};
			}
			res.json(response);
		});
	});

router.route("/drivers/:id")
	.get(function(req, res) {
		var response = {};
		mongoOp.Drivers.findById(req.params.id, function(err, data) {
			if(!err) {
				response = {"error" : false, "data" : data};
			}
			res.json(response);
		});
	})
	.put(function(req, res) {
		var response = {};
		mongoOp.Drivers.findById(req.params.id, function(err, data) {
			if(!err) {
				if(req.body.status !== undefined) {
					data.status = req.body.status;
				}
				if(req.body.lat !== undefined) {
					var newlat = req.body.lat;
					var newlng = req.body.lng;
					data.path.push({newlat, newlng});
				}
				
				data.save(function(err) {
					if(!err) {
						response = {"error" : false, "data" : data};
					}
					res.json(response);
				})
			}
		});
	})
	.delete(function(req, res) {
		var response = {};
		mongoOp.Drivers.findById(req.params.id, function(err, data) {
			if(!err) {
				if(req.body.lat !== undefined) {
					data.path.forEach(function(point, i, object) {
						if(point.lat === req.body.lat && point.lng === req.body.lng) {
							object.splice(i, 1);
						}
					});
				}
				response = {"error" : false, "data" : data};
				res.json(response);
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
