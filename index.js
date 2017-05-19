var express = require('express');
var app = express();

var mongo = require('mongodb'),
    MongoClient = mongo.MongoClient;


app.set('view engine', 'ejs');



var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

var _ = require('underscore');

var sha1 = require('sha1');

var cookieParser = require('cookie-parser');
app.use(cookieParser());

app.use(express.static('public'));

var url = "mongodb://localhost:27017/onlinestore";

MongoClient.connect(url, function (err, db) {

    app.get('/', function (req,res) {
        console.log("Connected correctly to server, for /");
        db.collection("products")
            .find()
            .toArray(function (err, docs) {
                if(err){
                    return console.log(err);
                }
                var products = docs,
                     numOfItems = 0;
                if (req.cookies.user) {
                    db.collection('card')
                        .find({user:req.cookies.user})
                        .toArray(function (err, docs) {
                            if (err) {
                                return console.log(err)
                            }
                            numOfItems = docs[0].products.length;
                            res.render("home.ejs", {products:products, numOfItems:numOfItems})
                        })
                }else{
                    res.render("home.ejs", {products:products, numOfItems:numOfItems})

                }
            });
    });

    app.get('/products/:id', function (req, res) {
        console.log("Connected correctly to server, for /products/...");
        db.collection("products")
            .find({_id:mongo.ObjectId(req.params.id)})
            .toArray(function (err, docs) {
                if (err) {
                    return console.log(err)
                }
                var product = docs,
                    numOfItems = 0;
                if (req.cookies.user) {
                    db.collection('card')
                        .find({user:req.cookies.user})
                        .toArray(function (err, docs) {
                            if (err) {
                                return console.log(err)
                            }
                            numOfItems = docs[0].products.length;
                            res.render("product.ejs", {product:product, numOfItems:numOfItems})
                        })
                }else{
                    res.render("product.ejs", {product:product, numOfItems:numOfItems})
                }
            })
    });

    app.get('/card', function (req, res) {
        var numOfItems = 0;
        if (req.cookies.user) {
            var user = req.cookies.user;
            console.log("Connected correctly to server, for /card");
            db.collection("card")
                .find({user:user})
                .toArray(function (err, docs) {
                    if (err) {
                        return console.log(err);
                    }
                    numOfItems = docs[0].products.length;
                    var card = docs;//[{_id:..., products:[{productId:.., quantity:..},...{}], user:'......'}]
                    var query = [];
                    card[0].products.forEach(function (elm) {
                        query.push(mongo.ObjectId(elm.productId))
                        });
                    db.collection("products")
                        .find({"_id":{$in:query}})
                        .toArray(function (err, docs) {
                            if (err) {
                                return console.log(err);
                            }
                            card[0].products.forEach(function (elm, i, arr) {
                                var productId = elm.productId,
                                    product = _.find(docs, function(item){
                                    return productId == item._id;
                                });
                                elm.product = product
                            });
                            res.render("card.ejs", {
                                card: card[0].products,
                                numOfItems:numOfItems
                            })
                        })
                    })
        }else {
            res.render("card.ejs", {
                products: [],
                card: [],
                numOfItems:numOfItems
            })
        }
    });

    app.post('/card', function (req, res) {
        if (req.cookies.user) {
            console.log("Connected correctly to server, for /card, method - post");
            db.collection('card')
                .find({user: req.cookies.user})
                .toArray(function (err, docs) {
                    if (err) {
                        return console.log(err);
                    }
                    var isExist = docs[0].products.some(function (elm) {
                        return elm.productId === req.body.id
                    });
                    if (isExist) {
                        var product = _.find(docs[0].products, function(elm){
                            return elm.productId === req.body.id
                        });
                        var newQuantity = parseInt(product.quantity) + parseInt(req.body.quantity);
                        db.collection('card')
                            .updateOne({$and:[{user: req.cookies.user},{'products.productId':req.body.id}]}, {$set:{"products.$.quantity":newQuantity}}, function (err) {
                                if (err) {
                                    return console.log(err);
                                }
                                console.log("updated quantity successfully");
                                res.status(200);
                                res.end()
                            })
                    }else{
                        db.collection('card')
                            .updateOne({user: req.cookies.user}, {$push:{products:{productId:req.body.id, quantity:req.body.quantity}}}, function (err) {
                                if (err) {
                                    return console.log(err);
                                }
                                console.log("added new item to card");
                                res.status(200);
                                res.end()
                            })
                    }
                })
        }else{
            var user = sha1(new Date());
            res.cookie("user",user,{maxAge:1000*60*60*12});
            console.log("Connected correctly to server, for /card, method - post");
            db.collection('card')
                .insertOne({
                    products: [{
                        productId:req.body.id,
                        quantity:req.body.quantity
                    }],
                    user: user
                }, function (err) {
                    if (err) {
                        return console.log(err);
                    }
                    res.status(200);
                    res.end()
                })
        }
    });

    app.post('/booking', function (req, res) {
        console.log("Connected correctly to server, for /booking, method - post");
        var user = req.cookies.user;
        db.collection('card')
            .find({user: user})
            .toArray(function (err, docs) {
                if (err) {
                    return console.log(err)
                }
                var card = docs;
                db.collection('booking')
                    .insertOne({
                        customer: card[0].user,
                        products: card[0].products,
                        total: req.body.total,
                        date: new Date().getTime()
                    }, function (err) {
                        if (err) {
                            return console.log(err);
                        }
                        console.log("success, /booking");
                        db.collection("card")
                            .deleteOne({user: user}, function (err) {
                                if (err) {
                                    return console.log(err);
                                }
                                res.clearCookie('user');
                                res.end();
                            })
                    })
            });
    });

    app.post('/card/remove-item', function (req,res) {
        console.log("Connected correctly to server, for /card/remove-item, method - post");
        db.collection('card')
            .updateOne({user: req.cookies.user},{$pull:{"products":{productId:req.body.id}}}, function (err) {
                if (err) {
                    return console.log(err)
                }
                console.log('deleted item successfully');
                res.status(200);
                res.end()
            })
    });

});

app.listen(3005);
