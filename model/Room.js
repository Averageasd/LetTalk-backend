const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RoomSchema = new Schema(
    {
        name: {type: String, minLength: 3, maxLength: 20},
        roomType: {
            type: String,
            require: true,
            enum: ['MULTIUSER', 'DIRECT-MESSAGE'],
        },
        users: [{type: Schema.Types.ObjectId, ref: "user"}],
        messages: [{type: Schema.Types.ObjectId, ref: "message"}]
    }
);

module.exports = mongoose.model('room', RoomSchema);