const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InvitationSchema = new Schema(
    {
        date: {type: Date, default: Date.now()},
        status: {
            type: String,
            require: true,
            enum: ['PENDING', 'ACCEPTED', 'DECLINED'],
            default: 'PENDING'
        },
        from: {type: Schema.Types.ObjectId, ref:'user'},
        to: {type: Schema.Types.ObjectId, ref:'user'},
        room: {type: Schema.Types.ObjectId, ref: 'room'},
    }
)

module.exports = mongoose.model('invitation', InvitationSchema);