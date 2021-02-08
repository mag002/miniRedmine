const mongoose = require("mongoose");
const Tag = require('../models/tag')
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
        default: 'assigned',
        enum: ['assigned', 'delayed', 'inprogress', 'toBeValidated', 'toBeTested', 'toBeMerged', 'resolved', 'deleted'] // only manager can delete task
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
    priority: {
        type: String,
        required: false,
        enum: ['low', 'medium', 'high', 'extra_high'],
        default: 'medium'
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
    tag: [{
        type: mongoose.SchemaTypes.ObjectId,
        ref: "Tag",
    }],
    type: {
        type: String,
        required: true,
        enum: ['task', 'bug', 'improvement'],
        default: 'task'
    },
    //createdAt
    //updatedAt

});
const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
