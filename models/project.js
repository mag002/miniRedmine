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
        required: false,
    },
    endDate: {
        type: Date,
        required: false,
    },
    createdBy: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "User",
    },
});
projectSchema.pre("save", async function (next) {
    const project = this;
    this.updated_at = Date.now();
    next();
});

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;
