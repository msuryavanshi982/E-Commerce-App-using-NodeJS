const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const userModel = require("../models/userModel");

//-AUTHENTICATION->>>
const authentication = function (req, res, next) {
  try {
    let token;
    const secretKey = "functionup-group24-secretKey";

    if (req.headers.authorization) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token)
      return res
        .status(401)
        .send({ status: false, message: "Please provide token" });

    const decoded = jwt.decode(token);

    if (!decoded)
      return res.status(400).send({
        status: false,
        message: "Invalid Authentication Token in request header",
      });

    req["decoded"] = decoded;

    if (Date.now() > decoded.exp * 1000)
      return res.status(440).send({
        status: false,
        message: "session expired, please login again",
      });

    jwt.verify(token, secretKey, function (err, decoded) {
      if (err) {
        return res
          .status(400)
          .send({ status: false, message: "Token Invalid" });
      } else {
        req.userId = decoded.userId;
        return next();
      }
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

//-AUTHORIZATION->>>

const authorization = async function (req, res, next) {
  try {
    const userId = req.params.userId;
    const decodedToken = req.userId;

    if (!mongoose.isValidObjectId(userId))
      return res
        .status(400)
        .send({ status: false, message: "userId is not valid" });

    const user = await userModel.findOne({ _id: userId });

    if (!user)
      return res
        .status(404)
        .send({ status: false, message: `no user found by ${userId}` });

    if (decodedToken != user._id)
      return res
        .status(403)
        .send({ status: false, message: `unauthorized access` });
    next();
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
};

module.exports = { authentication, authorization };
