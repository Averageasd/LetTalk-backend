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

router.post('/create-room/:roomName/user/:userId', async function (req, res, next) {
    try {
        const roomWithName = await RoomModel.findOne({name: req.params.roomName}).exec();
        if (roomWithName) {
            res.status(403).json({status: 403, message: 'name already exists'});
            return;
        }
        const newRoom = new RoomModel({
            name: req.params.roomName,
            roomType: 'MULTIUSER',
            users: [user._id],
            messages: [],
        });
        await newRoom.save();

        const user = await UserModel.findById(userId).exec();
        await UserModel.findByIdAndUpdate(req.params.userId, {
            rooms: user.rooms.concat(newRoom._id),
        }).exec();

        res.status(200).json({status: 200, message: `room ${newRoom.name} created`});
    } catch (e) {

    }
});

module.exports = router;