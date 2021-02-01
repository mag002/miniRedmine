const jwt = require("jsonwebtoken");
const User = require("../models/user");

const auth = async (req, res, next) => {
  const noNeedTokenUrl = ["/api/site"];
  const noNeedTokenQuery = noNeedTokenUrl.includes(
    req.url.toString().split("?")[0]
  ); //true is no need token url
  const noNeedTokenParam = noNeedTokenUrl.includes(
    "/api/" + req.url.toString().split("/")[2]
  ); //true is no need token url

  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    if (!token) {
      return res.status(403).send({ err: "Please authenticate to continute" });
    }
    const decoded = jwt.verify(token, "germanyaccountsecretkey7394");
    const user = await User.findOne({
      _id: decoded._id,
      "tokens.token": token,
    })
      .populate("current_level")
      .exec();

    if (!user) {
      throw new Error();
    }
    req.token = token;
    req.user = user;

    next();
  } catch (error) {
    if (
      (noNeedTokenQuery || noNeedTokenParam) &&
      !req.header("Authorization")
    ) {
      return next();
    }
    res.status(401).send({ err: "Please authenticate" });
  }
};
module.exports = auth;
