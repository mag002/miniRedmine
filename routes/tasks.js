
const express = require("express");
const Project = require("../models/project");
const ProjectUser = require("../models/project_user");
const Task = require("../models/task");
const auth = require("../middleware/auth");
const { isAdmin } = require("../utils");
const mongoose = require("mongoose");
const router = new express.Router();
const route_path = "/api/tasks"


//Create
/**
 * @swagger
 * /tasks:
 *    post:
 *      description: Create Task
 *      security:
 *        - bearerAuth: []
 *      tags:
 *        - task
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                title:
 *                  type: string
 *                status:
 *                  type: string
 *                description:
 *                  type: string
 *                assignee:
 *                  type: objectId
 *                projectId:
 *                  type: objectId
 *                priority:
 *                  type: string
 *                targetVersion:
 *                  type: objectId
 *                estimate:
 *                  type: number
 *                type:
 *                  type: string
 *                tags:
 *                  type: array
 *                  items:
 *                    type: objectId
 *              required:
 *                - title
 *                - assignee
 *                - projectId
 *      responses:
 *        201:
 *          description: Success
 *        400:
 *          description: Failure
 */
router.post(route_path, auth, async (req, res) => {
  // if (!isAdmin(req)) {
  //   return res.status(403).send({
  //     message: 'Unauthorized',
  //     code: 'UNAUTHORIZED'
  //   })
  // };
  const {
    title,
    status,
    description,
    assignee,
    projectId,
    priority,
    targetVersion,
    estimate,
    type,
    tags// check tag array is have in CLIENT SIDE, if not create
  } = req.body;
  try {
    let err;
    const projectUser = await ProjectUser.findOne({
      user: req.user._id,
      project: req.body.projectId,
    })

    console.log(req.user);
    if (!projectUser) {
      err = new Error('Permission Denied');
      err.code = "TASK_PERMISSION_DENIED";
      throw err;
    }
    // check assignee is in project
    const assigneeIsInProject = await ProjectUser.count({
      user: req.body.assignee,
      project: req.body.projectId,
    })

    if (!assigneeIsInProject) {
      err = new Error("Assignee not found");
      err.code = "TASK_ASSIGNEE_NOT_FOUND";
      throw err
    }

    const task = new Task({
      title,
      status,
      description,
      assignee,
      project: req.body.projectId,
      priority,
      targetVersion,
      estimate,
      type,
      tags, // check tag array is have in CLIENT SIDE, if not create
      createdBy: req.user._id
    })
    await (await task.save()).populate('project').populate('assignee').populate('tag').populate('targetVersion').execPopulate();
    res.status(201).send({
      task
    })
  } catch (e) {
    console.log(e);
    res.status(400).send({
      message: e.message || "Something went wrong",
      code: e.code || 'UNKNOWN'
    });
  }
})

//Get task Info
/**
  * @swagger
  * /tasks:
  *   get:
  *     description: Get all task of user (or return all if isAdmin)
  *     tags:
  *       - task
  *     security:
  *       - bearerAuth: []
  *     responses:
  *        200:
  *          description: Success
  *        400:
  *          desciption: Failure
*/
router.get(`${route_path}`, auth, async (req, res) => {
  const _isAdmin = isAdmin(req);
  try {
    let where = {}
    if (!_isAdmin) {
      where = {
        assignee: req.user._id
      }
    }
    const tasks = await Task.find(where).populate('project').populate('assignee').populate('tag').populate('targetVersion').exec();
    return res.status(200).send({ tasks })
  } catch (e) {
    console.log(e);
    res.status(400).send({
      message: e.message || "Something went wrong",
      code: 'UNKNOWN'
    });
  }
});

//Get task Info
/**
  * @swagger
  * /tasks/{taskId}:
  *   get:
  *     description: Get task info (will include comment)
  *     tags:
  *       - task
  *     security:
  *       - bearerAuth: []
  *     parameters:
  *       - in: path
  *         name: taskId
  *         required: true
  *         schema:
  *           type: string
  *         desciption: The Task ID
  *     responses:
  *        200:
  *          description: Success
  *        400:
  *          desciption: Failure
*/
router.get(`${route_path}/:id`, auth, async (req, res) => {
  const _isAdmin = isAdmin(req);
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404).send({
        message: "Task not found",
        code: "TASK_NOT_FOUND"
      });
      return
    }

    const userProject = await ProjectUser.findOne({
      user: req.user._id,
      project: task.project
    });

    if (!(_isAdmin || userProject)) {
      res.status(400).send({
        message: "Can't access this Task",
        code: "TASK_ACCESS_DENIED"
      });
      return
    }

    await task.populate('project').populate('assignee').populate('tag').populate('targetVersion').execPopulate();

    res.status(200).send({
      task
    })

  } catch (e) {
    console.log(e);
    res.status(400).send({
      message: e.message || "Something went wrong",
      code: 'UNKNOWN'
    });
  }
});

//Update task Info
/**
  * @swagger
  * /tasks/{taskId}:
  *   patch:
  *     description: Update Task info 
  *     tags:
  *       - task
  *     security:
  *       - bearerAuth: []
  *     parameters:
  *       - in: path
  *         name: taskId
  *         required: true
  *         schema:
  *           type: string
  *         desciption: The Task ID
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             properties:
 *                title:
 *                  type: string
 *                status:
 *                  type: string
 *                description:
 *                  type: string
 *                assignee:
 *                  type: objectId
 *                priority:
 *                  type: string
 *                targetVersion:
 *                  type: objectId
 *                estimate:
 *                  type: number
 *                type:
 *                  type: string
 *                tags:
 *                  type: array
 *                  items:
 *                    type: objectId
  *     responses:
  *        200:
  *          description: Success
  *        400:
  *          desciption: Failure
*/
router.patch(`${route_path}/:id`, auth, async (req, res) => {
  const _isAdmin = isAdmin(req);
  const updates = Object.keys(req.body);
  const allowedUpdates = [
    "title",
    "status",
    "description",
    "assignee",
    "priority",
    "targetVersion",
    "estimate",
    "tag",
    "type",
  ];
  const isValidOperation = updates.every(update =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates field!", code: "FIELD_INVALID" });
  }

  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404).send({
        message: "Task not found",
        code: "TASK_NOT_FOUND"
      });
      return
    }

    const userProject = await ProjectUser.findOne({
      user: req.user._id,
      project: task.project
    });

    if (!(_isAdmin || userProject)) {
      res.status(400).send({
        message: "Can't access this Task",
        code: "TASK_ACCESS_DENIED"
      });
      return
    }

    if (req.body.assignee) {
      // check assignee is in project
      const assigneeIsInProject = await ProjectUser.count({
        user: req.body.assignee,
        project: task.project,
      })
      if (!assigneeIsInProject) {
        err = new Error("Assignee not found");
        err.code = "TASK_ASSIGNEE_NOT_FOUND";
        throw err
      }
    }

    updates.forEach(update => (task[update] = req.body[update]));
    await (await task.save()).populate('project').populate('assignee').populate('tag').populate('targetVersion').execPopulate();
    res.send({ task });
  } catch (e) {
    console.log(e);
    res.status(400).send({
      message: e.message || "Something went wrong",
      code: e.code || 'UNKNOWN'
    });
  }
});

//LOG TIME

//COMMENT

module.exports = router;
