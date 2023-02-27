const mongoose = require("mongoose");

const isValidName = function (value) {
  if (typeof value === "undefined" || value === null || value == " ")
    return false;
  if (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.match(/^[a-zA-Z]*$/)
  )
    return true;
  return false;
};

const isValidEmail = function (value) {
  return /^[a-z]{1}[a-z-A-Z-0-9]{1,}@[a-z-A-Z]{3,}[.]{1}[a-z]{3,6}$/.test(
    value
  );
};

const isValidPhone = function (value) {
  return /^[\s]*[6-9]\d{9}[\s]*$/gi.test(value);
};
const isValidPass = function (value) {
  if (
    value.match(
      /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,15}$/
    )
  )
    return true;
  return false;
};

const isValidStreet = function (value) {
  return /^[\s]*[a-zA-Z-0-9,. ]+([\s]?[a-zA-Z-0-9]+)*[\s]*$/.test(value);
};

const isValidPincode = function (value) {
  return /^[1-9]{1}\d{5}$/.test(value);
};

const isValidObjectId = function (value) {
  return mongoose.Types.ObjectId.isValid(value);
};

const isValidRequestBody = function (value) {
  return Object.keys(value).length > 0;
};
const isvalidAddressLength = function (value) {
  let arr = Object.keys(value);
  return arr;
};

const isValid = function (value) {
  if (typeof value === "undefined" || typeof value === "null") return true;
  if (typeof value === "string" && value.trim().length === 0) return true;
  if (typeof value === "object" && Object.keys(value).length === 0) return true;
  return false;
};

const isValidImage = function (value) {
  return /\.(jpe?g|png|jpg)$/.test(value);
};

module.exports = {
  isvalidAddressLength: isvalidAddressLength,
  isValid,
  isValidObjectId,
  isValidRequestBody,
  isValidEmail,
  isValidName,
  isValidPass,
  isValidPhone,
  isValidStreet,
  isValidPincode,
  isValidImage,
};
