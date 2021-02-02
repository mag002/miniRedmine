const mongoose = require("mongoose");
// const Notification = require("./notification");
const tagSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    color: {
        type: String,
        required: false,
    },
    textColor: {
        type: String,
        required: false,
    },
    project: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "Project",
        required: true
    },
});
const Tag = mongoose.model("Tag", tagSchema);

module.exports = Tag;
