const mongoose = require("mongoose");
// const Notification = require("./notification");
const targetVersionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    project: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "Project",
        required: true
    },
});
const TargetVersion = mongoose.model("TargetVersion", targetVersionSchema);

module.exports = TargetVersion;
