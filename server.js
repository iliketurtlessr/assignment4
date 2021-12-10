const PORT = 3000;
const express = require('express');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const app = express();

// Importing Routers
let usersRouter = require('./routes/users-router');
let ordersRouter = require('./routes/order-router');
let registrationRouter = require('./routes/registration-router');

//Database variables
let mongo = require('mongodb');
let MongoClient = mongo.MongoClient;

// Global variables
app.locals.db;
app.locals.PORT;
app.locals.mongo;

// Setting session store
const store = new MongoDBStore({
    uri: 'mongodb://localhost:27017',
    collection: 'mySessions',
    databaseName: 'a4'
});
store.on('error', error => console.log(error));

// Setting middleware
app.set("view engine", "pug");
app.use(express.static("public"));
app.use(express.static("public/images"));
app.use(express.urlencoded({extended: true}));
app.use(session({
    secret: "The quick brown fox jumps over a lazy dog",
    store: store,
    resave: true,
    saveUninitialized: true
}));

app.use(function(req, res, next) {
    console.log("****************");
    console.log(req.method, req.url, "by", req.sessionID);
    console.log(loginStatus(req));
    next();
});
function loginStatus(req) {
    return (
        "Login status: " + 
        (req.session.loggedIn
            ? `${req.session.user.username} logged in`
            : "no one logged in")
    );
}

/******************************************************************************/
/*                                 ROUTES                                     */  
/******************************************************************************/
// Expose session
app.use(function(req, res, next){
    res.locals.user = req.session.user;
    next();
});

// Send Homepage
app.get(["/", "/home", "/login"], (req, res)=> res.render("pages/index"));

// Login and logout routes
app.post("/login", express.json(), login);
app.get("/logout", logout);

// Send orderform page
app.get("/order", sendOrderForm);

app.use('/users', usersRouter);                 //users router
app.use('/orders', ordersRouter);               //orders router
app.use("/registration", registrationRouter);   //registration router

/**
 * Log in user
 */
 async function login(req, res, next) {

    console.log(req.body);
    //return if already logged in
    if(req.session.loggedin) 
        return res.status(200).send("Already logged in.");

    // Get user by username if exists
    let user = await req.app.locals.db.collection('users').findOne({
        username: req.body.username
    });

    //return if account doesn't exist
    if (!user) {
        console.log("no account");
        return res.status(404).send(`Account doesn't exist.`);
    }

    //return if entered password is wrong
    if (req.body.password !== user.password)
        return res.status(400).send("Uh oh! Wrong password. Try again");

    // All went well. Add user to local session
    req.session.loggedIn = true;
    req.session.user = user;
    res.sendStatus(200);
}

/**
 * Log out user
 */
async function logout(req, res, next) {
    if (!req.session.loggedIn)
        return res
            .status(200)
            .send("You aren't logged in yet.\nGo login first lol");

    // Remove session data
    req.session.loggedIn = false;
    req.session.user = undefined;

    // Redirect to home page
    res.redirect("/");
}

/**
 * Send order form
 * Couldn't think of a way to include this in ordersRouter
 */
function sendOrderForm(req, res, next) {
    if (!req.session.loggedIn)
        return res.status(403).send("You need to login first.");
    
    res.render("pages/orderform");
}


// Initialize database connection
MongoClient.connect("mongodb://localhost:27017/", function (err, client) {
    if (err) throw err;
        
    //Save our info in app.locals to access from routers
    app.locals.db = client.db('a4');
    app.locals.PORT = PORT;
    app.locals.mongo = mongo;

    //Start server once Mongo is initialized
    app.listen(PORT);
    console.log(`Listening on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT}`);
});