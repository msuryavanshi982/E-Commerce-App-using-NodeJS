//=Importing all the packages/files here===>>>
const userModel = require("../models/userModel");
const { uploadFile } = require("../aws/aws");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {isValidRequestBody,isValidObjectId,isValidEmail,isValidName,isValidPass,isValidPhone,isValidStreet,isValidPincode,isValidImage} = require("../validators/userValidation");

// <<< === CREATE USER API === >>>
const createUser = async function (req, res) {
  try {
    const reqBody = req.body;

    // request Body validation
    if (!isValidRequestBody(reqBody))
      return res.status(400).send({
        status: false,
        message: "Please provide data in request body!",
      });

    const { fname, lname, email, password, phone, address, profileImage } = reqBody; 

    let files = req.files;

    // fname validation
    if (!fname)
      return res
        .status(400)
        .send({ status: false, message: "fname is required" });

    if (!isValidName(fname.trim()))
      return res
        .status(400)
        .send({ status: false, message: "fname is not Valid or Empty" });

    // lname validation
    if (!lname)
      return res
        .status(400)
        .send({ status: false, message: "lname is required" });
    if (!isValidName(lname.trim()))
      return res
        .status(400)
        .send({ status: false, message: "lname is not Valid or Empty" });

    //email validation
    if (!email)
      return res
        .status(400)
        .send({ status: false, message: "email is required" });

    if (!isValidEmail(email.trim()))
      return res
        .status(400)
        .send({ status: false, message: "email is not Valid or Empty" });

    const duplicateEmail = await userModel.findOne({ email: email });
    if (duplicateEmail)
      return res
        .status(400)
        .send({ status: false, message: "This email is Already Used !" });

    // password validation
    if (!password)
      return res
        .status(400)
        .send({ status: false, message: "Password is required" });

    if (!isValidPass(password))
      return res.status(400).send({
        status: false,
        message:
          "Password should be between 8 and 15 character and it should be alpha numeric",
      });

    // encrypt the password and set into the db
    reqBody.password = await bcrypt.hash(password, 10);

    // ProfileImage Validation
    if (files.length === 0)
      return res
        .status(400)
        .send({ status: false, message: "ProfileImage is required" });

    let fileExtension = files[0];
    if (!isValidImage(fileExtension.originalname))
      return res.status(400).send({
        status: false,
        message: "Image format Must be in jpeg,jpg,png",
      });

    let profileImgUrl = await uploadFile(files[0]);
    reqBody.profileImage = profileImgUrl;

    //phone validation
    if (!phone)
      return res
        .status(400)
        .send({ status: false, message: "phone is required" });

    if (!isValidPhone(phone))
      return res
        .status(400)
        .send({ status: false, message: "phone is not Valid or Empty" });

    const duplicatePhone = await userModel.findOne({ phone: phone });
    if (duplicatePhone)
      return res.status(400).send({
        status: false,
        message: "This phone number is Already Used !",
      });

    // Validation of address
    if (!address)
      return res
        .status(400)
        .send({ status: false, message: "Address is required" });
    try {
      reqBody.address = JSON.parse(address);
    } catch (err) {
      return res
        .status(400)
        .send({ status: false, message: "Address must be Object" });
    }

    if (Object.keys(reqBody.address).length > 2)
      return res
        .status(400)
        .send({ status: false, message: "Dont't Enter extra keys in Address" });

    const { shipping, billing } = reqBody.address; //destructuring  of address object

    // validation of shipping address
    if (shipping) {
      if (Object.keys(shipping).length > 3)
        return res.status(400).send({
          status: false,
          message: "Dont't Enter extra keys in shipping",
        });

      const { street, city, pincode } = shipping; //destructuring  of shipping object

      if (!isValidRequestBody(shipping))
        return res
          .status(400)
          .send({ status: false, message: "Enter data into the shipping" });

      // shipping street validation
      if (!street)
        return res
          .status(400)
          .send({ status: false, message: "shipping street is required" });

      if (!isValidStreet(street))
        return res
          .status(400)
          .send({ status: false, message: "shipping street is not valid" });

      // shipping city validation
      if (!city)
        return res
          .status(400)
          .send({ status: false, message: "shipping city is required" });

      if (!isValidName(city))
        return res
          .status(400)
          .send({ status: false, message: "city is not valid" });

      // shipping pincode validation
      if (!pincode)
        return res
          .status(400)
          .send({ status: false, message: "pincode is required" });

      if (!isValidPincode(pincode))
        return res
          .status(400)
          .send({ status: false, message: "pincode is not valid" });
    } else {
      return res
        .status(400)
        .send({ status: false, message: "shipping is required" });
    }

    // billing validation

    if (billing) {
      if (Object.keys(billing).length > 3)
        return res.status(400).send({
          status: false,
          message: "Dont't Enter extra keys in billing",
        });

      if (!isValidRequestBody(billing))
        return res
          .status(400)
          .send({ status: false, message: "Enter data into the billing" });

      const { street, city, pincode } = billing; //destructuring  of billing object

      // billing street validation
      if (!street)
        return res
          .status(400)
          .send({ status: false, message: "billing street is required" });
      if (!isValidStreet(street))
        return res
          .status(400)
          .send({ status: false, message: "billing street is not valid" });

      // billing city validation
      if (!city)
        return res
          .status(400)
          .send({ status: false, message: "billing city is required" });

      if (!isValidName(city))
        return res
          .status(400)
          .send({ status: false, message: "billing city is not valid" });

      // billing pincode validation
      if (!pincode)
        return res
          .status(400)
          .send({ status: false, message: "billing pincode is required" });

      if (!isValidPincode(pincode))
        return res
          .status(400)
          .send({ status: false, message: "billing pincode is not valid" });
    } else {
      return res
        .status(400)
        .send({ status: false, message: "billing is required" });
    }

    const obj = JSON.parse(JSON.stringify(reqBody));

    const user = await userModel.create(obj);

    return res.status(201).send({
      status: true,
      message: "User is created Sucessfully",
      data: user,
    });
  } catch (err) {
    return res.status(500).send(err.message);
  }
};

// <<< === Login API === >>>

const loginUser = async function (req, res) {
  try {
    let requestBody = req.body;

    if (!isValidRequestBody(requestBody))
      return res
        .status(400)
        .send({ status: false, message: "requestBody can't be empty" });

    let { email, password } = requestBody; 

    // email validation
    if (!email)
      return res
        .status(400)
        .send({ status: false, message: "email is required" });

    //password validation
    if (!password) {
      return res
        .status(400)
        .send({ status: false, message: "password is required" });
    }

    //User Present or Not
    let user = await userModel.findOne({ email: email });
    if (!user) {
      return res
        .status(400)
        .send({ status: false, message: "Email id not valid" });
    }

    // check user password with hashed password stored in the database
    const matchPassword = await bcrypt.compare(password, user.password);

    if (!matchPassword)
      return res
        .status(400)
        .send({ status: false, message: "Invalid password" });

    // generate the token
    let token = jwt.sign(
      {
        userId: user._id.toString(),
        organization: "FunctionUp",
      },
      "functionup-group24-secretKey",
      { expiresIn: "24h" }
    );

    return res.status(200).send({
      status: true,
      message: "User login successfull",
      data: { userid: user._id, token: token },
    });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

// <<< === Get User Details === >>>

const getUserDetails = async function (req, res) {
  try {
    let userId = req.params.userId;
    // validation of userId
    if (!userId)
      return res.status.send({
        status: false,
        message: "Please Provide userId in the path params",
      });

    if (!isValidObjectId(userId))
      return res
        .status(400)
        .send({ status: false, message: "UserId  Invalid" });

    if (req.userId != userId)
      return res
        .status(403)
        .send({ status: false, message: "user is not authorised" });

    let userData = await userModel.findById({ _id: userId });
    if (!userData)
      return res
        .status(404)
        .send({ status: false, message: "User Data Not Found" });

    return res
      .status(200)
      .send({ status: true, message: "User profile details", data: userData });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

// <<< === Update User Profile ===  >>>
const updateUser = async function (req, res) {
  try {
    let data = req.body;
    let userId = req.params.userId;
    let files = req.files;

    // userId validation
    if (!userId)
      return res.status(400).send({
        status: false,
        message: "Please Provide userId in the path Params",
      });

    if (!isValidObjectId(userId))
      return res
        .status(400)
        .send({ status: false, message: "UserId is not valid" });

    // finding user with given userId
    let userDataFind = await userModel.findOne({ _id: userId });

    if (!userDataFind)
      return res.status(404).send({ status: false, message: "No User Found" });

    if (!isValidRequestBody(data) && files == undefined)
      return res.status(400).send({
        status: false,
        message: "Please provide data in the request body",
      });
    let { fname, lname, email, phone, profileImage, password, address } = data;

    // validation of fname
    if (Object.keys(data).some((a) => a === "fname")) {
      if (!fname)
        return res
          .status(400)
          .send({ status: false, message: "Enter Value in Fname Field " });

      if (!isValidName(fname))
        return res.status(400).send({
          status: false,
          message: "Please write fname in correct way",
        });
    }
    // validation of lname
    if (Object.keys(data).some((a) => a === "lname")) {
      if (!lname)
        return res
          .status(400)
          .send({ status: false, message: "Enter Value in lname Field " });

      if (!isValidName(lname))
        return res.status(400).send({
          status: false,
          message: "please write lname in correct way",
        });
    }
    // = Email validation === >>>
    if (Object.keys(data).some((a) => a === "email")) {
      if (!email)
        return res
          .status(400)
          .send({ status: false, message: "Enter Value in email Field " });

      if (!isValidEmail(email))
        return res.status(400).send({
          status: false,
          message: "please write email in correct way",
        });

      const checkEmail = await userModel.findOne({ email: email });
      if (checkEmail)
        return res
          .status(400)
          .send({ status: false, message: "This email is alredy exist" });
    }

    // = Password Validation === >>>
    if (Object.keys(data).some((a) => a === "password")) {
      if (!password)
        return res
          .status(400)
          .send({ status: false, message: "Enter Value in password Field " });

      if (!isValidPass(password))
        return res.status(400).send({
          status: false,
          message: "please write password in correct way",
        });

      //-----password hashing----->>>

      const hashPassword = await bcrypt.hash(password, 10);
      data.password = hashPassword;
    }
    // = phone Validation === >>>
    if (Object.keys(data).some((a) => a === "phone")) {
      if (!phone)
        return res
          .status(400)
          .send({ status: false, message: "Enter Value in phone Field " });

      if (!isValidPhone(phone))
        return res.status(400).send({
          status: false,
          message: "please write phone in correct way",
        });

      const checkPhone = await userModel.findOne({ phone: phone });

      if (checkPhone)
        return res.status(400).send({
          status: false,
          message: "This phone number is already exist ",
        });
    }

    // = Profile image validation === >>>

    if (profileImage == "" && files.length == 0) {
      return res
        .status(400)
        .send({ status: false, message: "Enter Value in profileImage file " });
    }

    if (files.length > 0) {
      let fileExtension = files[0];
      if (!isValidImage(fileExtension.originalname))
        return res.status(400).send({
          status: false,
          message: "Image format Must be in jpeg,jpg,png",
        });

      let uploadedImageURL = await uploadFile(files[0]);
      data.profileImage = uploadedImageURL;
    }

    // = Address validation === >>>
    let ObjectAddress = {};
    if (address) {
      try {
        ObjectAddress = JSON.parse(address);
      } catch (err) {
        return res
          .status(400)
          .send({ status: false, message: "Address must be Object" });
      }

      let oldAddress = userDataFind.address;

      const { shipping, billing } = ObjectAddress;

      // = shipping address === >>>

      if (shipping) {
        let { street, city, pincode } = shipping; 

        if (!isValidRequestBody(shipping))
          return res
            .status(400)
            .send({ status: false, message: "Enter data into the shipping" });

        // validation street
        if (street) {
          if (!isValidStreet(street))
            return res
              .status(400)
              .send({ status: false, message: "street is not valid" });
          oldAddress.shipping.street = shipping.street;
        }

        if (city) {
          if (!isValidName(city))
            return res
              .status(400)
              .send({ status: false, message: "city is not valid" });
          oldAddress.shipping.city = city;
        }

        if (pincode) {
          if (!pincode)
            return res
              .status(400)
              .send({ status: false, message: "pincode is required" });

          if (!isValidPincode(pincode))
            return res
              .status(400)
              .send({ status: false, message: "pincode is not valid" });

          oldAddress.shipping.pincode = pincode;
        }
      }

      // = billing address === >>>
      if (billing) {
        if (!isValidRequestBody(billing))
          return res
            .status(400)
            .send({ status: false, message: "Enter data into the billing" });

        const { street, city, pincode } = billing; 

        // validation of street
        if (street) {
          if (!isValidStreet(street))
            return res
              .status(400)
              .send({ status: false, message: "street is not valid" });
          oldAddress.billing.street = street;
        }

        // validation of city
        if (city) {
          if (!isValidName(city))
            return res
              .status(400)
              .send({ status: false, message: "city is not valid" });
          oldAddress.billing.city = city;
        }

        // validation of pincode
        if (pincode) {
          if (!isValidPincode(pincode))
            return res
              .status(400)
              .send({ status: false, message: "pincode is not valid" });
          oldAddress.billing.pincode = pincode;
        }
      }

      data.address = oldAddress;
    }

    const updatedUser = await userModel.findOneAndUpdate(
      { _id: userId },
      { $set: data },
      { new: true }
    );

    return res.status(200).send({
      status: true,
      message: "User profile updated",
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).send({ status: false, error: error.message });
  }
};

// = Exporting all the functions here === >>>

module.exports = { createUser, loginUser, getUserDetails, updateUser };
