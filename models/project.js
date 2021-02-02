const mongoose = require("mongoose");
// const Notification = require("./notification");
const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: false,
    },
});
const Project = mongoose.model("Project", projectSchema);

module.exports = Project;
