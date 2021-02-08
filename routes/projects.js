
const express = require("express");
const jwt = require("jsonwebtoken");
const Project = require("../models/project");
const Task = require("../models/task");
const ProjectUser = require("../models/project_user");
const auth = require("../middleware/auth");
const { isAdmin } = require("../utils");
const mongoose = require("mongoose");
const router = new express.Router();
const route_path = "/api/projects"

const getProjectUser = async projectId => {
  const projectUsers = await ProjectUser.find({
    project: projectId
  }).populate('user').exec();

  return projectUsers.map(pus => pus.user)

}

//Create
/**
 * @swagger
 * /projects:
 *    post:
 *      description: Create Project
 *      security:
 *        - bearerAuth: []
 *      tags:
 *        - project
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                name:
 *                  type: string
 *                startDate:
 *                  type: timestamp
 *                endDate:
 *                  type: timestamp
 *              required:
 *                - name
 *      responses:
 *        201:
 *          description: Success
 *        400:
 *          description: Failure
 */
router.post(route_path, auth, async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).send({
      message: 'Unauthorized',
      code: 'UNAUTHORIZED'
    })
  };
  const { name, startDate, endDate } = req.body;
  try {
    const project = new Project({
      name,
      startDate,
      endDate,
      createdBy: req.user._id
    })
    await project.save();
    res.status(201).send({
      project
    })
  } catch (err) {
    res.status(400).send(err)
  }
})

//Get project Info
/**
  * @swagger
  * /projects:
  *   get:
  *     description: Get project info 
  *     tags:
  *       - project
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
    if (_isAdmin) {
      const projects = await Project.find().populate('createdBy').exec();
      return res.status(200).send({ projects })
    }
    const userProjects = await ProjectUser.find({
      user: req.user._id
    })
    const projectIDs = userProjects.map(pj => pj.project);
    const projects = await Project.find({
      _id: projectIDs
    }).populate('createdBy').exec();
    return res.status(200).send({ projects })
  } catch (e) {
    console.log(e);
    res.status(400).send({
      message: e.message || "Something went wrong",
      code: 'UNKNOWN'
    });
  }
});

//Get project Info
/**
  * @swagger
  * /projects/{projectId}:
  *   get:
  *     description: Get project info 
  *     tags:
  *       - project
  *     security:
  *       - bearerAuth: []
  *     parameters:
  *       - in: path
  *         name: projectId
  *         required: true
  *         schema:
  *           type: string
  *         desciption: The Project ID
  *     responses:
  *        200:
  *          description: Success
  *        400:
  *          desciption: Failure
*/
router.get(`${route_path}/:id`, auth, async (req, res) => {
  const _isAdmin = isAdmin(req);
  try {
    const userProject = await ProjectUser.findOne({
      user: req.user._id,
      project: req.params.id
    }).populate('project').exec();
    if (!(_isAdmin || userProject)) {
      res.status(400).send({
        message: "Can't access this Project",
        code: "PROJECT_ACCESS_DENIED"
      });
      return
    }
    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404).send({
        message: "Project not found",
        code: "PROJECT_NOT_FOUND"
      });
      return
    }

    const users = await getProjectUser(project._id);

    res.status(200).send({
      project,
      users
    })

  } catch (e) {
    console.log(e);
    res.status(400).send({
      message: e.message || "Something went wrong",
      code: 'UNKNOWN'
    });
  }
});

//Update User Info
/**
  * @swagger
  * /projects/{projectId}:
  *   patch:
  *     description: Update project info 
  *     tags:
  *       - project
  *     security:
  *       - bearerAuth: []
  *     parameters:
  *       - in: path
  *         name: projectId
  *         required: true
  *         schema:
  *           type: string
  *         desciption: The Project ID
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             properties:
  *               name:
  *                 type: string
  *               startDate:
  *                 type: timestamp
  *               endDate:
  *                 type: timestamp
  *     responses:
  *        200:
  *          description: Success
  *        400:
  *          desciption: Failure
*/
router.patch(`${route_path}/:id`, auth, async (req, res) => {

  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "startDate", "endDate"];
  const isValidOperation = updates.every(update =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates field!", code: "FIELD_INVALID" });
  }

  try {
    const projectUser = await ProjectUser.findOne({
      user: req.user._id,
      project: req.params.id,
    })
    let isManager = projectUser && projectUser.role === "manager";
    const _isAdmin = isAdmin(req);

    if (!(_isAdmin || isManager)) {
      res.status(403).send({ message: "Unauthorized", code: 'UNAUTHORIZED' })
    }
    // Check only role manager can update
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).send({
        message: 'Model not found',
        code: 'MODEL_NOT_FOUND'
      });
    }
    updates.forEach(update => (project[update] = req.body[update]));
    await project.save();
    res.send({ project });
  } catch (e) {
    console.log(e);
    res.status(400).send({
      message: e.message || "Something went wrong",
      code: 'UNKNOWN'
    });
  }
});
/**
  * @swagger
  * /projects/{projectId}/members:
  *   post:
  *     description: Add user to project 
  *     tags:
  *       - project
  *     security:
  *       - bearerAuth: []
  *     parameters:
  *       - in: path
  *         name: projectId
  *         required: true
  *         schema:
  *           type: string
  *         desciption: The Project ID
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             properties:
  *               role:
  *                 type: string
  *               userId:
  *                 type: string
  *             required:
  *               - role
  *               - userId
  *     responses:
  *        200:
  *          description: Success
  *        400:
  *          desciption: Failure
  */
router.post(`${route_path}/:id/members`, auth, async (req, res) => {
  try {
    const _projectUser = await ProjectUser.findOne({
      user: req.user._id.toString(),
      project: req.params.id,
    })
    console.log(_projectUser);
    let isManager = _projectUser && _projectUser.role === "manager";
    const _isAdmin = isAdmin(req);

    if (!(_isAdmin || isManager)) {
      return res.status(403).send({ message: "Unauthorized", code: 'UNAUTHORIZED' })
    }
    const available = await ProjectUser.count({
      user: req.body.userId,
      project: req.params.id,
    })

    if (available > 0) {
      res.status(403).send({ message: "User has already added into project", code: 'ALREADY_ADD' })
      return
    }

    const projectUser = new ProjectUser({
      user: req.body.userId,
      project: req.params.id,
      role: req.body.role
    })
    await projectUser.save();
    res.status(201).send({ projectUser })
  } catch (err) {
    console.log(e);
    res.status(400).send({
      message: e.message || "Something went wrong",
      code: 'UNKNOWN'
    });
  }
})
/**
  * @swagger
  * /projects/{projectId}/members:
  *   patch:
  *     description: Delete user from project 
  *     tags:
  *       - project
  *     security:
  *       - bearerAuth: []
  *     parameters:
  *       - in: path
  *         name: projectId
  *         required: true
  *         schema:
  *           type: string
  *         desciption: The Project ID
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             properties:
  *               userId:
  *                 type: string
  *             required:
  *               - userId
  *     responses:
  *        200:
  *          description: Success
  *        400:
  *          desciption: Failure
  */
router.patch(`${route_path}/:id/members`, auth, async (req, res) => {
  try {
    const _projectUser = await ProjectUser.findOne({
      user: req.user._id.toString(),
      project: req.params.id,
    })
    let isManager = _projectUser && _projectUser.role === "manager";
    const _isAdmin = isAdmin(req);

    if (!(_isAdmin || isManager)) {
      return res.status(403).send({ message: "Unauthorized", code: 'UNAUTHORIZED' })
    }
    const projectUser = await ProjectUser.findOneAndDelete({
      user: req.body.userId,
      project: req.params.id,
    })

    res.status(200).send(true)
  } catch (err) {
    console.log(err);
    res.status(400).send({
      message: err.message || "Something went wrong",
      code: 'UNKNOWN'
    });
  }
})


/**
  * @swagger
  * /projects/{projectId}/tasks:
  *   get:
  *     description: Get list task of project
  *     tags:
  *       - project
  *     security:
  *       - bearerAuth: []
  *     parameters:
  *       - in: path
  *         name: projectId
  *         required: true
  *         schema:
  *           type: string
  *         desciption: The Project ID
  *       - in: query
  *         name: page
  *         schema:
  *           type: integer
  *         description: The page number (start from 1)
  *       - in: query
  *         name: limit
  *         schema:
  *           type: integer
  *         description: The limit of list item
  *       - in: query
  *         name: where
  *         schema:
  *           type: string
  *         description: JSON of where 
  *     responses:
  *        200:
  *          description: Success
  *        400:
  *          desciption: Failure
  */
router.get(`${route_path}/:id/tasks`, auth, async (req, res) => {
  const {
    limit,
    page,
    where
  } = req.query
  try {
    const _projectUser = await ProjectUser.findOne({
      user: req.user._id.toString(),
      project: req.params.id,
    }).populate('project').exec();

    const _isAdmin = isAdmin(req);

    if (!(_isAdmin || _projectUser)) {
      return res.status(403).send({ message: "Unauthorized", code: 'UNAUTHORIZED' })
    }
    let _where = {};
    console.log(where)
    if (where) {
      _where = JSON.parse(where)
    }
    const tasks = await Task.find({
      project: req.params.id,
      ..._where,
    })
      // .limit(parseInt(limit))
      // .skip(parseInt((page - 1) * limit))
      // .select(" -short_description -detail_description -code -expire_date")
      .populate(
        'assignee createdBy tag targetVersion'
      )
      .exec();
    res.status(201).send({
      projects: _projectUser.project,
      tasks
    })
  } catch (e) {
    console.log(e);
    res.status(400).send({
      message: e.message || "Something went wrong",
      code: e.code || 'UNKNOWN'
    });
  }
})

module.exports = router;
