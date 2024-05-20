const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MessageSchema = new Schema(
    {
        message: {type: String, require: true, maxLength: 10000},
        date: {type: Date, default: Date.now()},
        status: {
            type: String,
            require: true,
            enum: ['CREATE', 'EDIT', 'DELETE'],
            default: 'CREATE'
        },
        isEditing: {type: Boolean, default: false, require: true},
        user: {type: Schema.Types.ObjectId, ref: 'user'},
        room: {type: Schema.Types.ObjectId, ref: 'room'},
    }
)

module.exports = mongoose.model('message', MessageSchema);