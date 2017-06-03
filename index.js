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

    app.get('/', function (req,res) {
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
                if (req.cookies.userEmail) {
                    db.collection('users')
                        .find({email:req.cookies.userEmail})
                        .toArray(function (err, user) {
                            if (err) {
                                return console.log(err);
                            }
                            var userName = user[0].name,
                                userId = user[0]._id;
                            db.collection('cart')
                                .find({user:mongo.ObjectId(userId)})
                                .toArray(function (err, docs) {
                                    if (err) {
                                        return console.log(err)
                                    }
                                    if (docs.length === 0) {
                                        res.render("home.ejs", {products:products, numOfItems:numOfItems, userName:userName})
                                    }else{
                                        numOfItems = docs[0].products.length;
                                        res.render("home.ejs", {products:products, numOfItems:numOfItems, userName:userName})
                                    }
                                })
                        })
                }else if (req.cookies.user) {
                    db.collection('cart')
                        .find({user:req.cookies.user})
                        .toArray(function (err, docs) {
                            if (err) {
                                return console.log(err)
                            }
                            numOfItems = docs[0].products.length;
                            res.render("home.ejs", {products:products, numOfItems:numOfItems, userName:false})
                        })
                }else{
                    res.render("home.ejs", {products:products, numOfItems:numOfItems, userName:false})
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
                    numOfItems = 0; //show how many unique items are in the cart
                if (req.cookies.userEmail) {
                    db.collection('users')
                        .find({email:req.cookies.userEmail})
                        .toArray(function (err, user) {
                            if (err) {
                                return console.log(err);
                            }
                            var userName = user[0].name,
                                userId = user[0]._id;
                            db.collection('cart')
                                .find({user:mongo.ObjectId(userId)})
                                .toArray(function (err, docs) {
                                    if (err) {
                                        return console.log(err)
                                    }
                                    if (docs.length === 0) {
                                        res.render("product.ejs", {product:product, numOfItems:numOfItems, userName:userName})
                                    }else{
                                        numOfItems = docs[0].products.length;
                                        res.render("product.ejs", {product:product, numOfItems:numOfItems, userName:userName})}
                                })
                        })
                }else if (req.cookies.user) {
                    db.collection('cart')
                        .find({user:req.cookies.user})
                        .toArray(function (err, docs) {
                            if (err) {
                                return console.log(err)
                            }
                            numOfItems = docs[0].products.length;
                            res.render("product.ejs", {product:product, numOfItems:numOfItems, userName:false})
                        })
                }else{
                    res.render("product.ejs", {product:product, numOfItems:numOfItems, userName:false})
                }
            })
    });

    app.get('/cart', function (req, res) {
        console.log("Connected correctly to server, for /cart");
        var numOfItems = 0; //show how many unique items are in the cart
        if (req.cookies.userEmail) {
            db.collection('users')
                .find({email:req.cookies.userEmail})
                .toArray(function (err, user) {
                    if (err) {
                        return console.log(err);
                    }
                    var userName = user[0].name,
                        userId = user[0]._id;
                    db.collection('cart')
                        .find({user:mongo.ObjectId(userId)})
                        .toArray(function (err, docs) {
                            if (err) {
                                return console.log(err)
                            }
                            if (docs.length !== 0) {
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
                            }else{
                                res.render("cart.ejs", {
                                    cart: [],
                                    numOfItems:numOfItems,
                                    userName:userName
                                })
                            }
                        })
                })
        }else if (req.cookies.user) {
            console.log("Connected correctly to server, for /cart");
            db.collection("cart")
                .find({user:req.cookies.user})
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
                                userName:false
                            })
                        })
                })
        }else{
            res.render("cart.ejs", {
                products: [],
                cart: [],
                numOfItems:numOfItems,
                userName:false
            })
        }
    });

    app.post('/cart', function (req, res) {// обеднати if i if else
        console.log("Connected correctly to server, for /cart, method - post");
        if (req.cookies.userEmail) {
            db.collection('users')
                .find({email:req.cookies.userEmail})
                .toArray(function (err, userFile) {
                    if (err) {
                        return console.log(err)
                    }
                    db.collection('cart')
                        .find({user: mongo.ObjectId(userFile[0]._id)})
                        .toArray(function (err, docs) {
                            if (err) {
                                return console.log(err);
                            }
                            if (docs.length === 0){
                                db.collection('cart')
                                    .insertOne({
                                        products: [{
                                            productId:req.body.id,
                                            quantity:+req.body.quantity// it has to be a number
                                        }],
                                        user: userFile[0]._id
                                    }, function (err) {
                                        if (err) {
                                            return console.log(err);
                                        }
                                        res.status(200);
                                        res.send({unique:true})
                                    })
                            }else{
                                //check if product is unique
                                var isExist = docs[0].products.some(function (elm) {
                                    return elm.productId === req.body.id
                                });
                                if (isExist) {
                                    //if yes, just updating quantity
                                    var product = _.find(docs[0].products, function(elm){//{productId:..., quantity:...}
                                        return elm.productId === req.body.id
                                    });
                                    var newQuantity = product.quantity + (+req.body.quantity);
                                    db.collection('cart')
                                        .updateOne(
                                            {$and:[{user: userFile[0]._id},{'products.productId':req.body.id}]},
                                            {$set:{"products.$.quantity":+newQuantity}},
                                            function (err) {
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
                                        .updateOne(
                                            {user: userFile[0]._id},
                                            {$push:{products:{productId:req.body.id, quantity:+req.body.quantity}}},
                                            function (err) {
                                                if (err) {
                                                    return console.log(err);
                                                }
                                                console.log("added new item to cart");
                                                res.status(200);
                                                res.send({unique:true})
                                            })
                                }
                            }
                        })
                })
        }else if (req.cookies.user) {
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
            db.collection('cart')
                .insertOne({
                    products: [{
                        productId:req.body.id,
                        quantity:+req.body.quantity// it have to be a number
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
        if (req.cookies.userEmail) {
            db.collection('users')
                .find({email:req.cookies.userEmail})
                .toArray(function (err, userFile) {
                    if (err) {
                        return console.log(err)
                    }
                    db.collection('cart')
                        .find({user: userFile[0]._id})
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
                                        .deleteOne({user: userFile[0]._id}, function (err) {
                                            if (err) {
                                                return console.log(err);
                                            }
                                            res.end();
                                        })
                                })
                        });
                })
        }else{
            user = req.cookies.user;
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
                                    if (req.cookies.userEmail) {
                                        res.clearCookie('userEmail');
                                    }else{
                                        res.clearCookie('user');
                                    }
                                    res.end();
                                })
                        })
                });
        }
    });

    app.post('/cart/remove-item', function (req,res) {
        console.log("Connected correctly to server, for /cart/remove-item, method - post");
        if (req.cookies.userEmail) {
            var user = req.cookies.userEmail
        }else{
            var user = req.cookies.user
        }
        db.collection('cart')
            .updateOne({user:user},{$pull:{"products":{productId:req.body.id}}}, function (err) {
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
        if (req.cookies.userEmail) {
            var user = req.cookies.userEmail
        }else{
            var user = req.cookies.user
        }
        db.collection('cart')
            .updateOne({$and:[{user:user},{'products.productId':req.body.id}]},{$inc:{"products.$.quantity":1}}, function (err) {
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
        if (req.cookies.userEmail) {
            var user = req.cookies.userEmail
        }else{
            var user = req.cookies.user
        }
        db.collection('cart')
            .updateOne({$and:[{user:user},{'products.productId':req.body.id}]},{$inc:{"products.$.quantity":-1}}, function (err) {
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
            .toArray(function (err, userFile) {
                if (err) {
                    return console.log(err)
                }
                if (userFile.length > 0) {
                    if (userFile[0].password === sha1(req.body.password)) {
                        if (req.cookies.user) {
                            db.collection('cart')
                                .updateOne({user:req.cookies.user}, {$set:{user:mongo.ObjectId(userFile[0]._id)}}, function (err) {
                                    if (err) {
                                        return console.log(err)
                                    }
                                    res.clearCookie('user');
                                    res.cookie('userEmail', userFile[0].email, {maxAge:1000*60*60*24*30});
                                    res.status(200);
                                    res.send({name:userFile[0].name})
                                })
                        }else{
                            res.cookie('userEmail', userFile[0].email, {maxAge:1000*60*60*24*30});
                            res.status(200);
                            res.send({name:userFile[0].name})
                        }
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
        console.log("Connected correctly to server, for /sign-out, method - post");
        res.clearCookie('userEmail');
        res.redirect(req.get('referer'));
    });

    app.post('/sign-up', function (req, res) {
        console.log("Connected correctly to server, for /sign-up, method - post");
        var name = req.body.name,
            email = req.body.email,
            password = sha1(req.body.password),
            rePassword = sha1(req.body.rePassword);
        function validateEmail(email) {
            var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(email);
        }

        if(name.length <= 1 || !validateEmail(email) || password.length < 6 || password != rePassword || rePassword == ""){
            res.status(406);
            res.send('client validation error');
        }else{
            db.collection('users')
                .find({email:email})
                .toArray(function (err, userFile) {
                    if (err) {
                        return console.log(err)
                    }
                    if (userFile.length === 1) {
                        res.status(406);
                        res.send({errorEmail:"This email already registered!"});
                    }else{
                        db.collection("users")
                            .insertOne({
                                name: name,
                                email: email,
                                password: password
                            }, function (err) {
                                if (err) {
                                    console.log(err);
                                    res.status(500);
                                    res.send('server error');
                                }else{
                                    if (req.cookies.user) {
                                        db.collection('users')
                                            .find({email:email})
                                            .toArray(function (err, userFile) {
                                                if (err) {
                                                    return console.log(err)
                                                }
                                                db.collection('cart')
                                                    .updateOne({user:req.cookies.user}, {$set:{user:mongo.ObjectId(userFile[0]._id)}}, function (err) {
                                                        if (err) {
                                                            return console.log(err)
                                                        }
                                                        res.clearCookie('user');
                                                        res.cookie('userEmail', email, {maxAge:1000*60*60*24*30});
                                                        res.send({name:name});
                                                    })
                                            })
                                    }else{
                                        res.cookie('userEmail', email, {maxAge:1000*60*60*24*30});
                                        res.send({name:name});
                                    }
                                }
                            })
                    }
                })
        }
    });
});

app.listen(process.env.PORT || 3000);
