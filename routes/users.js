
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const auth = require("../middleware/auth");
const { Unauthorized } = require("http-errors");
const { isAdmin } = require("../utils");
const router = new express.Router();
// USER MODEL

Array.prototype.unique = function () {
  var a = this.concat();
  for (var i = 0; i < a.length; ++i) {
    for (var j = i + 1; j < a.length; ++j) {
      if (JSON.stringify(a[i]) === JSON.stringify(a[j]))
        a.splice(j--, 1);
    }
  }
  return a;
};

const getUserInfo = async (req) => {
  const token = req.header("Authorization").replace("Bearer ", "");
  const decoded = jwt.verify(token, "miniRedmine7394");
  return user = await User.findOne({
    _id: decoded._id,
    "tokens.token": token
  }).populate('current_level').exec();
}
//Create
/**
 * @swagger
 * /users:
 *    post:
 *      description: Login user
 *      security:
 *        - bearerAuth: []
 *      tags:
 *        - users
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                username:
 *                  type: string
 *                email:
 *                  type: string
 *                phone_number:
 *                  type: string
 *                password:
 *                  type: string
 *                avatar:
 *                  type: string
 *                  description: base64
 *                role:
 *                  type: string
 *                  description: Is in  [admin, user]
 *                firstName:
 *                  type: string
 *                lastName:
 *                  type: string
 *              required:
 *                - username
 *                - email
 *                - phone_number
 *                - password
 *                - role
 *      responses:
 *        201:
 *          description: Success
 *        400:
 *          description: Failure
 */
router.post("/api/users", auth, async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).send({
        message: 'Unauthorized',
        code: 'UNAUTHORIZED'
      })
    };
    const user = new User({
      ...req.body
    })
    await user.save();
    res.status(201).send({
      user
    })
  } catch (err) {
    res.status(400).send(err)
  }
})
//Register
router.post("/api/users/register", async (req, res) => {

  const { email, phone_number, company_name, head_office_address, ward_id, form_id } = req.body;
  try {
    let isAvailable = true;
    let err;
    // if (!email && !phone_number) {
    //   throw new Error("Cần Nhập Email hoặc số điện thoại");
    // }
    if (!email) {
      err = new Error("Cần Nhập Email");
      err.code = "EMAIL_REQUIRED";
      throw err
    }

    if (email.trim() !== "" && email) {
      isAvailable = !(await User.validateEmailAndPhone(email, "email"));
      if (!isAvailable) {
        err = new Error("Email hoặc số điện thoại đã tồn tại");
        err.code = "EMAIL_EXIST"
        throw err
      }
    }
    // if (phone_number.trim() !== "" && phone_number) {
    //   isAvailable = !(await User.validateEmailAndPhone(
    //     phone_number,
    //     "phone_number"
    //   ));
    //   if (!isAvailable) { throw new Error("Email hoặc số điện thoại đã tồn tại"); }
    // }
    // if (isAvailable && (phone_number || email)) {
    //   await user.save();
    // }
    await user.save();
    const token = await user.generateAuthToken();
    await user.generateLocalPhone();
    res.status(201).send({ user, token });


  } catch (e) {
    res.status(400).send({ message: e.message });
  }
});
//Login
/**
 * @swagger
 * /users/login:
 *    post:
 *      description: Login user
 *      tags:
 *        - users
 *      requestBody:
 *        required: true
 *        content:
 *          application/x-www-form-urlencoded:
 *            schema:
 *              type: object
 *              properties:
 *                user_input:           # <!--- form field name
 *                  type: string
 *                password:             # <!--- form field name
 *                  type: string
 *              required:
 *                - user_input
 *                - password     
 *      responses:
 *        200:
 *          description: Success
 *        400:
 *          desciption: Failure
 */
router.post("/api/users/login", async (req, res) => {
  const { user_input, password } = req.body;
  let type = "email";
  // if (user_input.includes("+")) {
  //   type = "phone_number";
  // }
  // if (user_input.includes("@")) {
  //   type = "email";
  // }
  console.log(type);

  try {
    let user = await User.findByCredentials(user_input, type, password);
    const token = await user.generateAuthToken();
    delete user._doc.tokens
    delete user._doc.password
    user = {
      ...user._doc,
    }
    res.status(200).send({ user, token });
  } catch (e) {
    res.status(400).send({ message: e.message });
  }
});

//Update User Info
router.patch("/api/users/:id", async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password", "phone_number", "local_phone_number", "avatar"];
  const isValidOperation = updates.every(update =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates field!" });
  }

  try {
    const { avatar } = req.body
    if (avatar) {
      const imgName = "site_" + Date.now() + ".png";
      const path = "/var/www/germany/site/" + imgName;
      const imgdata = avatar;
      // to convert base64 format into random filename
      const base64Data = imgdata.replace(/^data:([A-Za-z-+/]+);base64,/, "");

      const avatar_official = "site/" + imgName;
      fs.writeFileSync(path, base64Data, { encoding: "base64" });

      req.body['avatar'] = avatar_official
    }


    const user = await User.findById(req.params.id);

    updates.forEach(update => (user[update] = req.body[update]));
    await user.save();

    if (!user) {
      return res.status(404).send();
    }

    res.send(user);
  } catch (e) {
    res.status(400).send(e);
  }
});

//Logout
/**
 * @swagger
 * /users/logout:
 *    post:
 *      description: Logout user
 *      tags:
 *        - users
 *      security:
 *        - bearerAuth: []
 *      responses:
 *        200:
 *          description: Success
 *        400:
 *          desciption: Failure
 */

router.post("/api/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => {
      return token.token !== req.token;
    });
    await req.user.save();

    res.status(200).send("Logged Out");
  } catch (e) {
    res.status(500).send();
  }
});


// router.delete("/api/users/:id", async (req, res) => {
//   try {
//     const user = await User.findByIdAndDelete(req.params.id);

//     if (!user) {
//       return res.status(404).send();
//     }

//     res.send(user);
//   } catch (e) {
//     res.status(500).send();
//   }
// });
/**
* @swagger
* /users/me:
*    get:
*      description: Get user info
*      tags:
*        - users
*      security:
*        - bearerAuth: []
*      responses:
*        200:
*          description: Success
*        400:
*          desciption: Failure
*/
router.get("/api/users/me", auth, async (req, res) => {
  try {
    res.send({
      user: req.user
    });
  } catch (e) {
    res.status(500).send(e);
  }
});



module.exports = router;
