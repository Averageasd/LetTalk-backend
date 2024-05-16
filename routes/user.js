const express = require('express');
const router = express.Router();
const UserModel = require('../model/User');

router.get('/getUserWithName/:userName', async (req,res,next)=>{
    try {
        console.log(req.params.userName);
        const user = await UserModel.findOne({name:req.params.userName}).exec();
        if (!user) {
            res.status(404).json({message: 'user with name ' + req.params.userName + ' not found', status: 404});
            return;
        }
        res.status(200).json({user: user, message: 'user found', status: 200});
    } catch (e) {
        res.status(500).send(e.message);
    }
});


router.get('/:userId', async (req, res, next) => {
    try {
        console.log(req.params.userId);
        const user = await UserModel.findById(req.params.userId).exec();
        if (!user) {
            res.status(404).json({message: 'user with id ' + req.params.id + ' not found', status: 404});
            return;
        }
        res.status(200).json({user: user, message: 'user found', status: 200});
    } catch (e) {
        res.status(500).send(e.message);
    }
});



module.exports = router;