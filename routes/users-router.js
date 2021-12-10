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
    let name = req.query.name;
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
    if (!user) return res.status(404).send(`No account.`);

    res.requestedUser = user;
    next();
}

/**
 * Set parameters according to who is viewing this user
 */
async function questionUser(req, res, next) {
    let user = res.requestedUser;

    if (req.session.loggedIn) {
        // User wants to view their own profile
        if (req.session.userId.toString() === user._id.toString()) {
            res.ownPage = true;
            next();
        }
    }
    else {
        if (user.privacy) {
            //the current user is not the holder of acc requested
            return res.status(403).send("Sorry, can't view this user. "+ 
                "They have set their profile to private");
        } else {
            //send basic user info with order history
            res.ownPage = false;
            next();
        }
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
    if (!req.session.loggedIn) 
        return res.status(403).send("You need to login first.");
    
    // Unauthorized request
    if (req.params.uid !== req.session.userId.toString())
        return res.sendStatus(403);
    
    // Update in the database
    await req.app.locals.db
        .collection("users")
        .findOneAndUpdate(
            { _id: req.session.userId },
            { $set: { privacy: req.body.privacy } }
        );
        
    res.sendStatus(200);
}

module.exports = router;
