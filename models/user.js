const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const phoneUtil = require("google-libphonenumber").PhoneNumberUtil.getInstance();
const PNF = require("google-libphonenumber").PhoneNumberFormat;
// const Notification = require("./notification");
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    unique: false,
    trim: true,
    lowercase: true
  },
  phone_number: {
    type: String,
    unique: false,
    trim: true,
    validate(value) {
      if (!validator.isMobilePhone(value) && value) {
        throw new Error("Phone is invalid");
      }
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 7,
    trim: true
  },
  avatar: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'user']
  },
  firstName: {
    type: String,
    required: false,
  },
  lastName: {
    type: String,
    required: false,
  },
  tokens: [
    {
      token: {
        type: String,
        required: true
      }
    }
  ]
});
//
//
userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();
  delete userObject.password;
  delete userObject.tokens;
  return userObject;
};
userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign(
    { _id: user._id.toString() },
    "miniRedmine7394"
  );
  user.tokens = user.tokens.concat({ token });
  await user.save();

  return token;
};
userSchema.methods.generateLocalPhone = async function () {
  const user = this;
  if (this.phone_number) {
    const tel = phoneUtil.parse(this.phone_number);
    const local_phone = phoneUtil.format(tel, PNF.NATIONAL).replace(/\s/g, "");
    const e164 = phoneUtil.format(tel, PNF.E164);

    user.phone_number = e164;
    user.local_phone_number = local_phone;
  }
  await user.save();
};

userSchema.statics.findByCredentials = async (user_input, type, password) => {
  const user = await User.findOne({ [type]: `${user_input}` })
    .exec();

  if (!user) {
    throw new Error("Tài khoản không tồn tại");
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Mat khau khong chinh xac");
  }
  return user;
};
userSchema.statics.validateEmailAndPhone = async (user_input, type) => {
  const user = await User.findOne({ [type]: user_input });

  if (user) {
    console.log("true trong day");

    return true;
  } else {
    console.log("false trong day");

    return false;
  }
};
//hash pw
userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  this.updated_at = Date.now();
  next();
});
const User = mongoose.model("User", userSchema);

module.exports = User;
