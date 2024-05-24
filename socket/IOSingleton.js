const {Server} = require("socket.io");
const UserModel = require('../model/User');
const RoomModel = require('../model/Room');
const Message = require('../model/Mesage');
const Invitation = require('../model/Invitation');
const mongoose = require("mongoose");
const {ObjectId} = require("mongodb");

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
                    isEditing: false,
                    user: userId,
                    room: roomId,
                });
                await newMessage.save();
                const room = await RoomModel.findById(roomId).exec();
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

            socket.on('send-invitation-request', async (from, to, roomId) => {
                const newInvitation = new Invitation({
                    status: 'PENDING',
                    from: from,
                    to: to,
                    room: roomId,
                })
                await newInvitation.save();
                IOSingleton.IOInstance.emit('send-invitation-request', from, to, roomId);
            });

            socket.on('invitation-request-response', async (from, to, accept, invitationId) => {
                if (accept) {
                    const invitation = await Invitation.findByIdAndUpdate(invitationId, {
                        'status': 'ACCEPTED'
                    }, {new: true}).exec();
                    const room = await RoomModel.findById(invitation.room).exec();
                    const updatedRoomWithNewUsers = [...room.users];
                    updatedRoomWithNewUsers.push(invitation.to);
                    await RoomModel.findByIdAndUpdate(room._id, {
                        'users': updatedRoomWithNewUsers
                    }).exec();
                    const requestReceiver = await UserModel.findById(from).exec();
                    await UserModel.findByIdAndUpdate(from, {
                        rooms: requestReceiver.rooms.concat(room._id),
                    });
                }
                IOSingleton.IOInstance.emit('invitation-request-response', from, to , accept, invitationId);
            })


            socket.on('connection-request-response', async (userId, toUserId, accept, invitationId) => {
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

            socket.on('delete-message', async (messageId, roomId) => {
                const room = await RoomModel.findById(roomId).exec();
                await Message.findByIdAndDelete(messageId).exec();
                const roomMessages = [...room.messages].map((id) => id.toString());
                const indexDeleteMessage = roomMessages.indexOf(messageId.toString());
                roomMessages.splice(indexDeleteMessage, 1);
                await RoomModel.findByIdAndUpdate(roomId, {
                    messages: roomMessages
                }).exec();
                IOSingleton.IOInstance.to(roomId).emit('delete-message', messageId, roomId);
            });

            socket.on('change-message-to-edit', async (messageId, roomId, userId) => {
                await Message.findByIdAndUpdate(messageId, {
                    isEditing: true,
                }).exec();
                const room = await RoomModel.findById(roomId).populate({path: 'messages'}).exec();
                const roomMessages = [...room.messages];
                for (const message of roomMessages) {
                    if (message._id.toString() !== messageId && message.isEditing) {
                        await Message.findByIdAndUpdate(message._id, {
                            isEditing: false
                        }).exec();
                    }
                }
                IOSingleton.IOInstance.to(roomId).emit('change-message-to-edit', messageId, roomId, userId);
            });

            socket.on('edit-message', async (newMessage, messageId, roomId, userId) => {
                await Message.findByIdAndUpdate(messageId, {
                    isEditing: false,
                    status: 'EDIT',
                    date: new Date(),
                    message: newMessage,
                }).exec();

                IOSingleton.IOInstance.to(roomId).emit('edit-message', newMessage, messageId, roomId, userId);
            });

            socket.on('remove-edit-status', async (messageId, roomId, userId) => {
                await Message.findByIdAndUpdate(messageId, {
                    isEditing: false,
                    status: 'CREATE',
                }).exec();

                IOSingleton.IOInstance.to(roomId).emit('remove-edit-status', messageId, roomId, userId);
            });
        });
        return IOSingleton.IOInstance;
    }
}


module.exports = IOSingleton;