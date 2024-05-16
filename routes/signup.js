const express = require('express');
const router = express.Router();
const UserModel = require('../model/User');

router.post('/', async function (req, res, next) {
    try {
        let user = await UserModel.findOne({name: req.body.name}).exec();
        if (user) {
            res.status(401).json({
                status: 401,
                message: `user with ${req.body.name} already existed`
            });
            return;
        }
        user = new UserModel({name: req.body.name, password: req.body.password, rooms: []});
        await user.save();
        res.status(200).json({status: 200, message: 'Sign up successfully'});
    } catch (e) {
        res.status(500).send(e.message);
    }

});

module.exports = router;