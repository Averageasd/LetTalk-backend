const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema(
    {
        name: {type: String, require: true, minLength: 3, maxLength: 20},
        password: {type: String, require: true, minLength: 8},
        rooms: [{type: Schema.Types.ObjectId, ref: 'room'}],
        invitations: [{type: Schema.Types.ObjectId, ref: 'invitation'}],
        connections: [{type: Schema.Types.ObjectId, ref: 'user'}]
    }
);

module.exports = mongoose.model('user', UserSchema);