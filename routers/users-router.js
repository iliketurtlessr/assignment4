const express = require("express");
const router = express.Router();

// Send user query page
router.get("/", (req, res) => res.render("pages/userQuery"));

// Send users with matching query
router.post("/?", express.json(), queryUsers, sendUsers);

// Send a particular user
router.get("/:uid", getUser, questionUser, sendUser);

// Change privacy of user
router.put("/:uid", express.json(), updatePrivacy);

/**
 * Query database for users as requested
 */
async function queryUsers(req, res, next) {
    let name = req.body.name;
    let users = await req.app.locals.db
        .collection("users")
        .find({
            username: { $regex: `.*${name}.*`, $options: "i" },
            privacy: false,
        })
        .toArray();
    res.users = users;
    next();
    console.log(users.length);
    // users.forEach(user => console.log(user.username, user.privacy));
}

/**
 * Send list of matched users query
 */
function sendUsers(req, res, next) {
    //Send partial page containing list of users
    res.render("partials/users", {
        url: `http://localhost:${req.app.locals.PORT}/users/`,
        users: res.users,
    });
}

/**
 * Get user from database, if exists
 */
async function getUser(req, res, next) {
    // No user is logged in right now
    if (!req.session.loggedIn) {
        res.status(403).send("You need to login first");
        return;
    }

    // Try getting user
    let uid, user;
    try {
        uid = new req.app.locals.mongo.ObjectId(req.params.uid);
    } catch {
        res.status(404).send("Unknown ID");
        return;
    }
    user = await req.app.locals.db.collection("users").findOne({ _id: uid });

    // No account was found
    if (!user) {
        res.status(404).send(`No account.`);
        return;
    }

    res.requestedUser = user;
    next();
}

/**
 * Set parameters according to who is viewing this user
 */
async function questionUser(req, res, next) {
    // We can assume that a user is currently logged in
    let user = res.requestedUser;

    //maybe: i still dont understand this logic
    // User wants to view their own profile
    // console.log("before", req.session.user);
    if (req.session.user.username === user.username) {
        // update local user and send user info with ability to change user privacy
        req.session.user = await req.app.locals.db.collection('users').findOne({
            _id: req.app.locals.mongo.ObjectId(req.session.user._id)
        });
        console.log("after", req.session.user);
        res.ownPage = true;
        next();
    }

    if (user.privacy) {
        if (req.session.user.username !== user.username) {
            //the current user is not the holder of acc requested
            res.status(403).send("Sorry, can't view this user"+ 
                "Thay have set their profile to private");
            return;
        }
    } else {
        //send basic user info with order history
        res.ownPage = false;
        next();
    }
}

/**
 * Send user with appropriate information
 */
function sendUser(req, res, next) {
    res.render("pages/user", {
        ownPage: res.ownPage ? true : false,
        userToDisplay: res.requestedUser,
    });
}

/**
 * Change user's privacy
 */
async function updatePrivacy(req, res, next) {
    // Respond to a false request
    if (!req.session.loggedIn) {
        res.status(403).send("You need to login first.");
        return;
    }

    // Unauthorized request
    if (req.params.uid !== req.session.user._id.toString()) {
        res.sendStatus(403);
        return;
    }

    // Update in the database
    // console.log(req.session);
    user = await req.app.locals.db
        .collection("users")
        .findOneAndUpdate(
            { _id: req.session.user._id },
            { $set: { privacy: req.body.privacy } }
        );
    console.log(user);

    // Update user locally as well
    req.session.user = await req.app.locals.db.collection("users").findOne({
        _id: user.value._id,
    });
    // console.log(user, req.body);
    res.sendStatus(200);
}

module.exports = router;
