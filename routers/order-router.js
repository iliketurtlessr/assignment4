const express = require('express');
const router = express.Router();

//Send order info
router.get("/:oid", getOrder, sendOrder);

//Add order to user orders 
router.post("/", express.json(), addOrder);

/**
 * Add order to user's list of orders
 */
async function addOrder(req, res, next) {

    //link user's username to order
    let orderForm = req.body;
    orderForm.who = req.session.user.username;
    orderForm.userId = req.session.user._id;
    console.log(orderForm);

    // Add order to db and add it to user's orders array
    let order = await req.app.locals.db
            .collection('orders')
            .insertOne(orderForm);
    
    let user = await req.app.locals.db
            .collection("users")
            .findOneAndUpdate(
                { username: req.session.user.username },
                { "$push": {orders: order.insertedId}
            });
    console.log(user, order);
    res.sendStatus(201);
}

/**
 * Get order from database and do necessary modifications
 */
async function getOrder(req, res, next) {

    // No user is logged in right now
    if (!req.session.loggedIn) {
        res.status(403).send("You need to login first");
        return;
    }

    //get order
    let oid, order;
    try {
        oid = new req.app.locals.mongo.ObjectId(req.params.oid);
    } catch {
        res.status(404).send("Unknown ID");
        return;
    }
    order = await req.app.locals.db
            .collection("orders")
            .findOne({ "_id": oid });
    if (!order) {
        res.status(404).send(`No Order.`);
        return;
    }

    //get user
    let user = await req.app.locals.db
            .collection('users')
            .findOne({
                username: order.who
            });
    if (!user) {
        res.status(404).send(`No account.`);
        return;
    }

    //Return if acc is private
    if (user.privacy && req.session.user.username !== user.username) {
        res.status(403).send("Forbidden. This isn't your order, sorry");
        return;
    }

    res.order = order;
    next();
}

/**
 * Send order page
 */
function sendOrder(req, res, next) {
    res.render("pages/order", {
        order: res.order
    });
}

module.exports = router;