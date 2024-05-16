const express = require('express');
const jwt = require("jsonwebtoken");
const router = express.Router();
const UserModel = require('../model/User');
require('dotenv').config();

router.post('/', async function (req, res, next) {
    try {
        const user = await UserModel.findOne({name: req.body.name, password: req.body.password}).exec();
        if (!user) {
            res.status(401).json({
                status: 401,
                message: `user with ${req.body.name} and ${req.body.password} cannot be found`
            });
            return;
        }
        jwt.sign({user: user}, process.env.SECRET_KEY, (err, token) => {
            res.status(200).json({
                status: 200,
                user: user,
                message: 'Log in successfully',
                token: token,
            })
        });
    } catch (e) {
        res.status(500).send(e.message);
    }

});

module.exports = router;