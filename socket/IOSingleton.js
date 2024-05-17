const {Server} = require("socket.io");
const UserModel = require('../model/User');
const RoomModel = require('../model/Room');
const Message = require('../model/Mesage');
const Invitation = require('../model/Invitation');
const mongoose = require("mongoose");

class IOSingleton {

    static IOInstance = null;

    static getIOInstance(httpServer) {
        if (IOSingleton.IOInstance === null) {
            IOSingleton.IOInstance = new Server(httpServer, {
                cors: {
                    origin: '*',
                    credentials: true
                }
            });
        }

        IOSingleton.IOInstance.on('connection', (socket) => {
            console.log('hello user');
            socket.on('join-rooms', async (userId) => {
                const curUser = await UserModel.findById(userId).exec();
                socket.rooms.clear();
                socket.join(curUser._id.toString());
                for (const room of curUser.rooms) {
                    socket.join(room.toString());
                }
            });

            socket.on('message', async (userId, message, roomId) => {
                const newMessage = new Message({
                    message: message,
                    date: new Date(),
                    status: 'CREATE',
                    user: userId,
                    room: roomId,
                });
                await newMessage.save();
                const room = await RoomModel.findById(roomId).exec();
                console.log(room);
                await RoomModel.findByIdAndUpdate(roomId, {
                    messages: room.messages.concat(newMessage._id)
                });
                IOSingleton.IOInstance.to(roomId).emit('message', userId, message, roomId);
            });

            socket.on('send-connect-request', async (from, to) => {
                const newRoom = new RoomModel({
                    roomType: 'DIRECT-MESSAGE',
                    users: [],
                    messages: [],
                })

                console.log(newRoom);
                await newRoom.save();
                const newInvitation = new Invitation({
                    status: 'PENDING',
                    from: from,
                    to: to,
                    room: newRoom._id,
                })
                await newInvitation.save();
                IOSingleton.IOInstance.emit('send-connect-request', from, to);
            });

            socket.on('connection-request-response', async (userId, toUserId, accept, invitationId) => {
                console.log('yo');
                if (accept) {
                    const invitation = await Invitation.findByIdAndUpdate(invitationId, {
                        'status': 'ACCEPTED'
                    }, {new: true}).exec();
                    const room = await RoomModel.findById(invitation.room).exec();
                    const updatedRoomWithNewUsers = [...room.users];
                    updatedRoomWithNewUsers.push(invitation.from);
                    updatedRoomWithNewUsers.push(invitation.to);
                    await RoomModel.findByIdAndUpdate(room._id, {
                        'users': updatedRoomWithNewUsers
                    }).exec();
                    const sendingRequestUser = await UserModel.findById(toUserId).exec();
                    const requestReceiver = await UserModel.findById(userId).exec();
                    await UserModel.findByIdAndUpdate(userId, {
                        rooms: requestReceiver.rooms.concat(room._id),
                        connections: requestReceiver.connections.concat(toUserId)
                    });

                    await UserModel.findByIdAndUpdate(toUserId, {
                        rooms: sendingRequestUser.rooms.concat(room._id),
                        connections: sendingRequestUser.connections.concat(userId)
                    });
                }
                IOSingleton.IOInstance.emit('connection-request-response', userId, toUserId, accept, invitationId);
            });

        });
        return IOSingleton.IOInstance;
    }
}


module.exports = IOSingleton;