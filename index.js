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

var url = "mongodb://"+process.env.login+":"+process.env.password+"@ds151951.mlab.com:51951/ib-onlinestore";

MongoClient.connect(url, function (err, db) {

    //check if user was logged
    var userName = false;
    function isUserWasLogged(userEmail) {
        if (userEmail) {
            db.collection('users')
                .find({email:userEmail})
                .toArray(function (err, userFile) {
                    if (err) {
                        return console.log(err)
                    }
                    return userName = userFile[0].name;
                })
        }
    }

    app.get('/', function (req,res) {
        isUserWasLogged(req.cookies.userEmail);

        console.log("Connected correctly to server, for /");
        db.collection("products")
            .find()
            .limit(16) //for infinite scroll
            .toArray(function (err, docs) {
                if(err){
                    return console.log(err);
                }
                var products = docs,
                     numOfItems = 0; //show how many unique items are in the cart
                res.cookie('page', 0); //for infinite scroll
                if (req.cookies.user) {
                    db.collection('cart')
                        .find({user:req.cookies.user})
                        .toArray(function (err, docs) {
                            if (err) {
                                return console.log(err)
                            }
                            numOfItems = docs[0].products.length;
                            res.render("home.ejs", {products:products, numOfItems:numOfItems, userName:userName})
                        })
                }else{
                    res.render("home.ejs", {products:products, numOfItems:numOfItems, userName:userName})
                }
            });
    });

    app.get('/products/:id', function (req, res) {
        isUserWasLogged(req.cookies.userEmail);

        console.log("Connected correctly to server, for /products/...");
        db.collection("products")
            .find({_id:mongo.ObjectId(req.params.id)})
            .toArray(function (err, docs) {
                if (err) {
                    return console.log(err)
                }
                var product = docs,
                    numOfItems = 0; //show how many unique items are in the cart
                if (req.cookies.user) {
                    db.collection('cart')
                        .find({user:req.cookies.user})
                        .toArray(function (err, docs) {
                            if (err) {
                                return console.log(err)
                            }
                            numOfItems = docs[0].products.length;
                            res.render("product.ejs", {product:product, numOfItems:numOfItems, userName:userName})
                        })
                }else{
                    res.render("product.ejs", {product:product, numOfItems:numOfItems, userName:userName})
                }
            })
    });

    app.get('/cart', function (req, res) {
        isUserWasLogged(req.cookies.userEmail);

        var numOfItems = 0; //show how many unique items are in the cart
        if (req.cookies.user) {
            var user = req.cookies.user;
            console.log("Connected correctly to server, for /cart");
            db.collection("cart")
                .find({user:user})
                .toArray(function (err, docs) {
                    if (err) {
                        return console.log(err);
                    }
                    numOfItems = docs[0].products.length;
                    var cart = docs;//[{_id:..., products:[{productId:.., quantity:..},...{}], user:'......'}]
                    var query = [];
                    cart[0].products.forEach(function (elm) {
                        query.push(mongo.ObjectId(elm.productId))
                        });
                    db.collection("products")
                        .find({"_id":{$in:query}})
                        .toArray(function (err, docs) {
                            if (err) {
                                return console.log(err);
                            }
                            //merge document(all about product) in cart[0].products
                            cart[0].products.forEach(function (elm) {
                                var productId = elm.productId,
                                    product = _.find(docs, function(item){
                                    return productId == item._id;
                                });
                                elm.product = product
                            });
                            res.render("cart.ejs", {
                                cart: cart[0].products,
                                numOfItems:numOfItems,
                                userName:userName
                            })
                        })
                    })
        }else {
            res.render("cart.ejs", {
                products: [],
                cart: [],
                numOfItems:numOfItems,
                userName:userName
            })
        }
    });

    app.post('/cart', function (req, res) {
        if (req.cookies.user) {
            console.log("Connected correctly to server, for /cart, method - post");
            db.collection('cart')
                .find({user: req.cookies.user})
                .toArray(function (err, docs) {
                    if (err) {
                        return console.log(err);
                    }
                    //check if product is unique
                    var isExist = docs[0].products.some(function (elm) {
                        return elm.productId === req.body.id
                    });
                    if (isExist) {
                        //if yes, just updating quantity
                        var product = _.find(docs[0].products, function(elm){
                            return elm.productId === req.body.id
                        });
                        var newQuantity = parseInt(product.quantity) + parseInt(req.body.quantity);
                        db.collection('cart')
                            .updateOne({$and:[{user: req.cookies.user},{'products.productId':req.body.id}]}, {$set:{"products.$.quantity":+newQuantity}}, function (err) {
                                if (err) {
                                    return console.log(err);
                                }
                                console.log("updated quantity successfully");
                                res.status(200);
                                res.send({unique:false})
                            })
                    }else{
                        //if not, add productId and quantity to the user's document
                        db.collection('cart')
                            .updateOne({user: req.cookies.user}, {$push:{products:{productId:req.body.id, quantity:+req.body.quantity}}}, function (err) {
                                if (err) {
                                    return console.log(err);
                                }
                                console.log("added new item to cart");
                                res.status(200);
                                res.send({unique:true})
                            })
                    }
                })
        }else{
            //create a new user's document and add productId and quantity to the document
            var user = sha1(new Date());
            res.cookie("user",user,{maxAge:1000*60*60*12});
            console.log("Connected correctly to server, for /cart, method - post");
            db.collection('cart')
                .insertOne({
                    products: [{
                        productId:req.body.id,
                        quantity:+req.body.quantity
                    }],
                    user: user
                }, function (err) {
                    if (err) {
                        return console.log(err);
                    }
                    res.status(200);
                    res.send({unique:true})
                })
        }
    });

    app.post('/', function (req, res) {
        //just for infinite scroll
        var x = req.cookies.page;
        console.log("Connected correctly to server, for /, method - post");
        db.collection("products")
            .find()
            .skip(16*(++x))
            .limit(16)
            .toArray(function (err, docs) {
                if(err){
                    return console.log(err);
                }
                res.cookie('page', ++x);
                res.send({products:docs})
            });
    });

    app.post('/booking', function (req, res) {
        console.log("Connected correctly to server, for /booking, method - post");
        var user = req.cookies.user;
        db.collection('cart')
            .find({user: user})
            .toArray(function (err, docs) {
                if (err) {
                    return console.log(err)
                }
                var cart = docs;
                db.collection('booking')
                    .insertOne({
                        customer: cart[0].user,
                        products: cart[0].products,
                        total: req.body.total,
                        date: new Date().getTime()
                    }, function (err) {
                        if (err) {
                            return console.log(err);
                        }
                        console.log("success, /booking");
                        db.collection("cart")
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

    app.post('/cart/remove-item', function (req,res) {
        console.log("Connected correctly to server, for /cart/remove-item, method - post");
        db.collection('cart')
            .updateOne({user: req.cookies.user},{$pull:{"products":{productId:req.body.id}}}, function (err) {
                if (err) {
                    return console.log(err)
                }
                console.log('deleted item successfully');
                res.status(200);
                res.end()
            })
    });

    app.post('/cart/quantity-up', function (req,res) {
        console.log("Connected correctly to server, for /cart/quantity-up, method - post");
        db.collection('cart')
            .updateOne({$and:[{user: req.cookies.user},{'products.productId':req.body.id}]},{$inc:{"products.$.quantity":1}}, function (err) {
                if (err) {
                    return console.log(err)
                }
                console.log('successfully');
                res.status(200);
                res.end()
            })
    });

    app.post('/cart/quantity-down', function (req,res) {
        console.log("Connected correctly to server, for /cart/quantity-down, method - post");
        db.collection('cart')
            .updateOne({$and:[{user: req.cookies.user},{'products.productId':req.body.id}]},{$inc:{"products.$.quantity":-1}}, function (err) {
                if (err) {
                    return console.log(err)
                }
                console.log('successfully');
                res.status(200);
                res.end()
            })
    });

    app.post('/sign-in', function (req, res) {
        console.log("Connected correctly to server, for /sign-in, method - post");
        db.collection("users")
            .find({email:req.body.email})
            .toArray(function (err, doc) {
                if (err) {
                    return console.log(err)
                }
                if (doc.length > 0) {
                    if (doc[0].password === sha1(req.body.password)) {
                        res.cookie('userEmail', doc[0].email, {maxAge:1000*60*60*24*30});
                        res.status(200);
                        res.send({name:doc[0].name})
                    }else{
                        res.status(400);
                        res.send({passError:"Password is not correct!"})
                    }
                }else{
                    res.status(400);
                    res.send({emailError:"Your email is not registered!"})
                }
            });
    });

    app.post('/sign-out', function (req, res) {
        res.clearCookie('userEmail');
        res.redirect('/');
    })
});

app.listen(process.env.PORT || 3000);
