const express = require('express');
const router = express.Router();
const RoomModel = require('../model/Room');
const MessageModel = require('../model/Mesage');
const UserModel = require("../model/User");
const jwt = require("jsonwebtoken");
const InvitationModel = require('../model/Invitation');

router.get('/all-rooms/:userId', async function (req, res, next) {
    try {
        const allUserRooms = await RoomModel.find({users: req.params.userId}).populate({path: 'users'}).populate({
            path: 'messages',
            populate: {path: 'user', model: 'user'}
        }).exec();
        res.status(200).json({status: 200, allUserRooms: allUserRooms});
    } catch (e) {
        res.status(500).send(e.message);
    }
});

router.get('/all-invitations/:userId', async function (req, res, next) {
    try {
        const allInvitations = await InvitationModel.find({$or: [{from: req.params.userId}, {to: req.params.userId}]}).populate({path: 'from'}).populate({path: 'to'}).populate({path: 'room'}).exec();
        res.status(200).json({status: 200, allInvitations: allInvitations});
    } catch (e) {
        res.status(500).send(e.message);
    }
});

router.post('/create-room/', async function (req, res, next) {
    try {
        const roomWithName = await RoomModel.findOne({name: req.body.roomName}).exec();
        console.log(roomWithName);
        if (roomWithName) {
            res.status(403).json({status: 403, message: `room with name ${req.body.roomName} already exists`});
            return;
        }

        const user = await UserModel.findById(req.body.userId).exec();
        const newRoom = new RoomModel({
            name: req.body.roomName,
            roomType: 'MULTIUSER',
            users: [user._id],
            messages: [],
        });
        await newRoom.save();
        await UserModel.findByIdAndUpdate(req.body.userId, {
            rooms: user.rooms.concat(newRoom._id),
        }).exec();

        res.status(200).json({status: 200, message: `room ${newRoom.name} created`});
    } catch (e) {

    }
});

router.get('/all-friends/:userId', async function (req, res, next) {
    const user = await UserModel.findById(req.params.userId).populate('connections').exec();
    res.status(200).json({status: 200, allFriends: user.connections});

});

module.exports = router;