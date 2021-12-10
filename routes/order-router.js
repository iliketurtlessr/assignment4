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
    orderForm.userId = req.session.userId;
    console.log(orderForm);

    // Add order to db and add it to user's orders array
    let order = await req.app.locals.db
            .collection('orders')
            .insertOne(orderForm);
    
    await req.app.locals.db
            .collection("users")
            .findOneAndUpdate(
                { _id: req.session.userId },
                { "$push": {orders: order.insertedId}}
            );
    console.log(order);
    // Send the new order's Mongo ObjectId
    res.status(201).send(order.insertedId.toString());
}

/**
 * Get order from database and do necessary modifications
 */
async function getOrder(req, res, next) {

    // No user is logged in right now
    if (!req.session.loggedIn)
        return res.status(403).send("You need to login first");

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
    if (!order) return res.status(404).send(`No Order.`);

    //get user
    let user = await req.app.locals.db
            .collection('users')
            .findOne({
                _id: order.userId
            });
    if (!user) return res.status(404).send(`No account.`);

    //Return if acc is private
    if (user.privacy && req.session.userId.toString() !== user._id.toString()) {
        res.status(403).send("Forbidden. This isn't your order, sorry");
        return;
    }

    res.order = order;
    res.order.who = user.username;
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