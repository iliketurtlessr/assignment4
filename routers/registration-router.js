const express = require('express');
const router = express.Router();

//Send registration form
router.get("/", (_,res) => res.render("pages/registration"));

//Register user if one doesn't exist already
router.post("/", express.json(), registerUser);

/**
 * Register new user into our 'users' database
 */
async function registerUser(req, res, next) {

    // Get the user by username if exists
    let user = await req.app.locals.db.collection('users').findOne({
        username: req.body.username
    });
    
    // If user exists, they cant register again
    if (user) {
        res.status(400).send("Looks like this username has been taken\n" + 
                "Please try another one");
        return;
    }

    if (req.body.password.length === 0) {
        res.status(400).send("Sorry, password can't be empty");
        return;
    }

    //Update other fields and add user to db
    req.body.privacy = false;
    req.body.password = req.body.password;
    req.body.orders = [];
    user = await req.app.locals.db.collection('users').insertOne(req.body);

    // console.log(user);

    // Create new session and add to 'sessions' collection
    // let session = await req.app.locals.db.collection('sessions').insertOne({
    //     who: req.body.username,
    //     loggedIn: true,
    //     user: user.insertedId,   // reference to user's ObjectId
    //     numOfTimesLoggedIn: 1    // just for fun
    // });

    // Get user to add to local session
    req.session.loggedIn = true;
    req.session.user = await req.app.locals.db.collection('users').findOne({
        _id: user.insertedId
    });

    // console.log("new session: ", session);
    res.status(201).send(user.insertedId);

    // if (!user) {
    //     //Update other fields and add user to db
    //     req.body.privacy = false;
    //     req.body.password = req.body.username;
    //     req.body.orders = [];
    //     user = await req.app.locals.db
    //             .collection('users')
    //             .insertOne(
    //                 req.body
    //             );

    //     //get the user to store in req.session.user
    //     req.session.user = await req.app.locals.db
    //             .collection('users')
    //             .findOne({
    //                 _id: user.insertedId
    //             });

    //     //Log them in
    //     req.session.loggedIn = true;
    //     console.log(user, req.session.user);
    //     res.status(201).send(user.insertedId);
    // } else {
    //     res.sendStatus(400);
    // }
}

module.exports = router;