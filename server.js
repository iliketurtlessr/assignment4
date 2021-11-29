const PORT = 3002;
const express = require('express');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const app = express();

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
// Catch errors
store.on('error', error => console.log(error));

// Setting middleware
app.set("view engine", "pug");
app.use(express.static("public"));
app.use(express.static("views/images"));
app.use(express.urlencoded({extended: true}));
app.use(session({
    secret: 'This is a secret',
    store: store,
    resave: true,
    saveUninitialized: true
}));

app.use(function(req, res, next) {
    // res.send('Hello ' + JSON.stringify(req.session));
    // console.log('Hello ' + JSON.stringify(req.sessionID));
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


// **************** Routers ****************
// Users router
let usersRouter = require('./routers/users-router');
app.use('/users', usersRouter);

// Order router
let ordersRouter = require('./routers/order-router');
app.use('/orders', ordersRouter);

// Registration router
let registrationRouter = require('./routers/registration-router');
app.use("/registration", registrationRouter);


// **************** ROUTES ****************
// Send Homepage
app.get(["/", "/home", "/login"], sendIndex);

// Login and logout routes
// app.post("/login", express.json(), login, sendIndex);
app.post("/login", express.json(), login);
app.get("/logout", logout, sendIndex);

// Send orderform page
app.get("/order", sendOrderForm);

/**
 * Send Homepage
 */
function sendIndex(req, res, next) {
    //if user is logged in, send index with user's header
    // if (req.session.loggedIn) res.render("pages/index", {user: req.session.user});
    // else res.render("pages/index", {user: false});
    res.render("pages/index", {
        user: (req.session.loggedIn ? req.session.user : false)
    });
}

/**
 * Log in user
 */
 async function login(req, res, next) {

    console.log(req.body);
    //return if already logged in
    if(req.session.loggedin){
		res.status(200).send("Already logged in.");
		return;
	}

    // Get user by username if exists
    let user = await req.app.locals.db.collection('users').findOne({
        username: req.body.username
    });

    //return if account doesn't exist
    if (!user) {
        res.status(404).send(`Account doesn't exist.`);
        console.log("no account");
        return;
    }

    //return if password typed is wrong
    if (req.body.password !== user.password) {
        res.status(400).send("Uh oh! Wrong password. Try again");
        return;
    }

    // All went well. add user to local session
    req.session.loggedIn = true;
    req.session.user = user;
    res.sendStatus(200);

    // // Get session
    // let session = await req.app.locals.db.collection('sessions').findOne({
    //     who: user.username
    // });

    // // Add/Update session
    // (session ? updateSession(req, true) : createSession(req));

    // next();
}

/**
 * Creates a new session for the user who has logged in for the first time
 */
async function createSession(req) {

     // Create new session and add to 'sessions' collection
     let session = await req.app.locals.db.collection('sessions').insertOne({
        who: req.session.user.username,
        loggedIn: true,
        user: req.session.user._id,   // reference to user's ObjectId
        numOfTimesLoggedIn: 1    // just for fun
    });

    console.log("new session", session);
}

/**
 * Updates the login status of this session
 * @param {Boolean} loginStatus to be login status of this user
 */
async function updateSession(req, loginStatus) {

    // Get and update session
    let session =  await req.app.locals.db.collection('sessions').updateOne({
        who: req.session.user.username
    }, { 
        "$set": {loggedIn: loginStatus},
        "$inc": {numOfTimesLoggedIn: (loginStatus? 1: 0)} //update this as well
    });
    console.log("updated session", session);
    
}

/**
 * Log out user
 */
async function logout(req, res, next) {
    if (!req.session.loggedIn) {
        res.status(200)
            .send("You aren't logged in yet.\nGo login first lol");
        return;
    }
    
    // Update session
    // updateSession(req, false);

    // Update local session information
    req.session.loggedIn = false;
    req.session.user = undefined;

    next();
}

/**
 * Send order form
 * Couldn't think of a way to include this in ordersRouter
 * ps. suggestions appreciated :)
 */
function sendOrderForm(req, res, next) {
    if (!req.session.loggedIn) {
        res.status(403).send("You need to login first.");
        return;
    }
    res.render("pages/orderform", {
        user: req.session.user
    });
}


// Initialize database connection
MongoClient.connect("mongodb://localhost:27017/", function (err, client) {
    if (err) throw err;

    //Get the a4 database
    app.locals.db = client.db('a4');
    app.locals.PORT = PORT;

    //Save our info in app.locals to access from routers
    app.locals.mongo = mongo;

    //Start server once Mongo is initialized
    app.listen(PORT);
    console.log(`Listening on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT}`);
});