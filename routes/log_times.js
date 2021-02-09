
const express = require("express");
const jwt = require("jsonwebtoken");
const LogTime = require("../models/log_time");
const Task = require("../models/task");
const ProjectUser = require("../models/project_user");
const auth = require("../middleware/auth");
const { isAdmin } = require("../utils");
const mongoose = require("mongoose");
const router = new express.Router();
const route_path = "/api/logtimes"

//Create
/**
 * @swagger
 * /logtimes:
 *    post:
 *      description: Log time to project
 *      security:
 *        - bearerAuth: []
 *      tags:
 *        - logtime
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                taskId:
 *                  type: string
 *                time:
 *                  type: integer
 *                date:
 *                  type: timestamp
 *                note:
 *                  type: string
 *              required:
 *                - taskId
 *                - time
 *                - date
 *                - note
 *      responses:
 *        201:
 *          description: Success
 *        400:
 *          description: Failure
 */
router.post(route_path, auth, async (req, res) => {
  const {
    taskId,
    time,
    date,
    note,
  } = req.body;
  try {
    const task = await Task.findById(taskId);

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

    if (!userProject) {
      res.status(400).send({
        message: "Can't access this Task",
        code: "TASK_ACCESS_DENIED"
      });
      return
    }

    const log_time = new LogTime({
      task: taskId,
      user: req.user._id,
      time,
      date,
      note,
    })

    await (await log_time.save()).populate('task user').execPopulate();

    res.status(201).send({
      log_time
    })
  } catch (e) {
    console.log(e);
    res.status(400).send({
      message: e.message || "Something went wrong",
      code: e.code || 'UNKNOWN'
    });
  }
})

//Create
/**
 * @swagger
 * /logtimes:
 *    post:
 *      description: Log time to project
 *      security:
 *        - bearerAuth: []
 *      tags:
 *        - logtime
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                taskId:
 *                  type: string
 *                time:
 *                  type: integer
 *                date:
 *                  type: timestamp
 *                note:
 *                  type: string
 *              required:
 *                - taskId
 *                - time
 *                - date
 *                - note
 *      responses:
 *        201:
 *          description: Success
 *        400:
 *          description: Failure
 */
router.post(route_path, auth, async (req, res) => {
  const {
    taskId,
    time,
    date,
    note,
  } = req.body;
  try {
    const task = await Task.findById(taskId);

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

    if (!userProject) {
      res.status(400).send({
        message: "Can't access this Task",
        code: "TASK_ACCESS_DENIED"
      });
      return
    }

    const log_time = new LogTime({
      task: taskId,
      user: req.user._id,
      time,
      date,
      note,
    })

    await (await log_time.save()).populate('task user').execPopulate();

    res.status(201).send({
      log_time
    })
  } catch (e) {
    console.log(e);
    res.status(400).send({
      message: e.message || "Something went wrong",
      code: e.code || 'UNKNOWN'
    });
  }
})

//Get
/**
 * @swagger
 * /logtimes/{logTimeId}:
 *    patch:
 *      description: Update log time
 *      security:
 *        - bearerAuth: []
 *      tags:
 *        - logtime
 *      parameters:
 *        - in: path
 *          name: logTimeId
 *          required: true
 *          schema:
 *            type: string
 *          desciption: The Log Time ID
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                time:
 *                  type: integer
 *                date:
 *                  type: timestamp
 *                note:
 *                  type: string
 *      responses:
 *         200:
 *           description: Success
 *         400:
 *           desciption: Failure
 */
router.patch(`${route_path}/:id`, auth, async (req, res) => {
  const { id } = req.params;
  const updates = Object.keys(req.body);
  const allowedUpdates = ["time", "date", "note"];
  const isValidOperation = updates.every(update =>
    allowedUpdates.includes(update)
  );
  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates field!", code: "FIELD_INVALID" });
  }
  try {
    const logtimes = await LogTime.findById(id);

    if (req.user._id.toString() !== logtimes.user.toString()) {
      console.log(logtimes.user);
      return res.status(400).send({ error: "Access denied!", code: "ACCESS_DENIED" });
    }

    if (!logtimes) {
      return res.status(404).send({
        message: 'Model not found',
        code: 'MODEL_NOT_FOUND'
      });
    }
    updates.forEach(update => (logtimes[update] = req.body[update]));
    await (await logtimes.save()).populate('user task').execPopulate();
    res.send({ logtimes });
  } catch (e) {
    console.log(e);
    res.status(400).send({
      message: e.message || "Something went wrong",
      code: e.code || 'UNKNOWN'
    });
  }
})


//Get
/**
 * @swagger
 * /logtimes:
 *    get:
 *      description: Get log time 
 *      security:
 *        - bearerAuth: []
 *      tags:
 *        - logtime
 *      parameters:
 *        - in: query
 *          name: page
 *          schema:
 *            type: integer
 *          description: The page number (start from 1)
 *        - in: query
 *          name: limit
 *          schema:
 *            type: integer
 *          description: The limit of list item
 *        - in: query
 *          name: where
 *          schema:
 *            type: string
 *          description: JSON of where 
 *      responses:
 *         200:
 *           description: Success
 *         400:
 *           desciption: Failure
 */
router.get(route_path, auth, async (req, res) => {
  const { where } = req.query;
  try {
    let _where = {};
    console.log(where)
    if (where) {
      _where = JSON.parse(where)
    }

    if (_where.projectId) {
      const _projectUser = await ProjectUser.findOne({
        user: req.user._id.toString(),
        project: _where.projectId,
      }).populate('project').exec();

      const _isAdmin = isAdmin(req);

      if (!(_isAdmin || _projectUser)) {
        return res.status(403).send({ message: "Unauthorized", code: 'UNAUTHORIZED' })
      }

      const tasks = await Task.find({
        project: _where.projectId
      });

      delete _where.projectId;

      if (tasks) {
        console.log(tasks);
        _where.task = [...tasks.map(task => task._id)];
      }
    }


    const logtimes = await LogTime.find({
      ..._where,
    })
      // .limit(parseInt(limit))
      // .skip(parseInt((page - 1) * limit))
      // .select(" -short_description -detail_description -code -expire_date")
      .populate(
        'task user'
      )
      .exec();
    res.status(201).send({
      logtimes
    })
  } catch (e) {
    console.log(e);
    res.status(400).send({
      message: e.message || "Something went wrong",
      code: e.code || 'UNKNOWN'
    });
  }
})


//Get
/**
 * @swagger
 * /logtimes/{logTimeId}:
 *    delete:
 *      description: Delete log time
 *      security:
 *        - bearerAuth: []
 *      tags:
 *        - logtime
 *      parameters:
 *        - in: path
 *          name: logTimeId
 *          required: true
 *          schema:
 *            type: string
 *          desciption: The Log Time ID
 *      responses:
 *         200:
 *           description: Success
 *         400:
 *           desciption: Failure
 */
router.delete(`${route_path}/:id`, auth, async (req, res) => {
  const { id } = req.params;
  try {
    const logtimes = await LogTime.findById(id);

    if (req.user._id.toString() !== logtimes.user.toString()) {
      console.log(logtimes.user);
      return res.status(400).send({ error: "Access denied!", code: "ACCESS_DENIED" });
    }

    if (!logtimes) {
      return res.status(404).send({
        message: 'Model not found',
        code: 'MODEL_NOT_FOUND'
      });
    }

    await logtimes.remove()


    res.status(200).send({ deleted: true });
  } catch (e) {
    console.log(e);
    res.status(400).send({
      message: e.message || "Something went wrong",
      code: e.code || 'UNKNOWN'
    });
  }
})

module.exports = router;
