const mongoose = require("mongoose");
// const Notification = require("./notification");
const projectUserSchema = new mongoose.Schema({
    user: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "User",
    },
    project: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "Project",
    },
    role: {
        type: String,
        required: false,
        enum: ['manager', 'dev', 'qc']
    },
});
const ProjectUser = mongoose.model("ProjectUser", projectUserSchema);

module.exports = ProjectUser;
