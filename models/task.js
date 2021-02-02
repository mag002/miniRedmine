const mongoose = require("mongoose");
// const Notification = require("./notification");
const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
        default: 'assigned',
        enum: ['assigned', 'delayed', 'inprogress', 'toBeValidated', 'toBeTested', 'toBeMerged', 'resolved']
    },
    description: {
        type: String,
        required: false,
    },
    assignee: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "User",
        required: true,
    },
    project: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "Project",
        required: true,
    },
    role: {
        type: String,
        required: false,
        enum: ['manager', 'dev', 'qc']
    },
    priority: {
        type: String,
        required: false,
        enum: ['low', 'medium', 'high', 'extra_high']
    },
    targetVersion: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "TargetVersion",
        required: false,
    },
    createdBy: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "User",
        required: true,
    },
    estimate: {
        type: Number,
        required: false
    },
    tag: {
        type: String,
        required: false,
    }
    //createdAt
    //updatedAt

});
const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
