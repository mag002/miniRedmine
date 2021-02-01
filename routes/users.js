
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const auth = require("../middleware/auth");
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
  const decoded = jwt.verify(token, "germanyaccountsecretkey7394");
  return user = await User.findOne({
    _id: decoded._id,
    "tokens.token": token
  }).populate('current_level').exec();
}


//Register
router.post("/api/users", async (req, res) => {
 
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
      business,
      high_level,
      site
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
router.post("/api/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => {
      return token.token !== req.token;
    });
    await req.user.save();

    res.send("Logged Out");
  } catch (e) {
    res.status(500).send();
  }
});


router.delete("/api/users/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).send();
    }

    res.send(user);
  } catch (e) {
    res.status(500).send();
  }
});

router.get("/api/users/me", auth, async (req, res) => {
  try {
    const business = await Business.findOne({ user_id: req.user._id })
    const high_level = await HighLevel.findOne({ user_id: req.user._id })
    const site = await Site.findOne({ user_id: req.user._id })
    delete req.user._doc.tokens
    delete req.user._doc.password
    res.send({
      ...req.user._doc,
      business,
      high_level,
      site
    });
  } catch (e) {
    res.status(500).send(e);
  }
});



module.exports = router;
