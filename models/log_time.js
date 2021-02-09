const mongoose = require("mongoose");
// const Notification = require("./notification");
const logTimeSchema = new mongoose.Schema({
    user: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "User",
        required: true,
    },
    task: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "Task",
        required: true,
    },
    time: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        required: true
    },
    note: {
        type: String,
        required: false
    }
    //createdAt
});

const LogTime = mongoose.model("LogTime", logTimeSchema);

module.exports = LogTime;
