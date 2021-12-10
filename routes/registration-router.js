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
    if (user) 
        return res.status(400)
                .send(
                    "Looks like this username has been taken\n" + 
                    "Please try another one"
                );

    if (req.body.password.length === 0)
        return res.status(400).send("Sorry, password can't be empty");

    //Update other fields and add user to db
    req.body.privacy = false;
    req.body.orders = [];
    user = await req.app.locals.db.collection('users').insertOne(req.body);


    // Get user to add to local session
    req.session.loggedIn = true;
    req.session.userId = user.insertedId;

    res.status(201).send(user.insertedId);
}

module.exports = router;