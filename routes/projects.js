
const express = require("express");
const jwt = require("jsonwebtoken");
const Project = require("../models/project");
const ProjectUser = require("../models/project_user");
const auth = require("../middleware/auth");
const { isAdmin } = require("../utils");
const router = new express.Router();
const route_path = "/api/projects"
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
    const projectIDs = [];
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
router.get(`${route_path}/:id`, async (req, res) => {
  const _isAdmin = isAdmin(req);
  try {

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

module.exports = router;
