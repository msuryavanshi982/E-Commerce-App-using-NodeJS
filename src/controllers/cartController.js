const userModel = require("../models/userModel");
const productModel = require("../models/productModel");
const cartModel = require("../models/cartModel");
const { isValidObjectId } = require("mongoose");
const { isValidRequestBody } = require("../validators/productValidation");

// <<< === CreateCart === >>>
const createCart = async function (req, res) {
  try {
    let requestBody = req.body;
    let userIdFromParam = req.params.userId;

    if (!isValidRequestBody(requestBody))
      return res
        .status(400)
        .send({ status: false, message: "request Body can't be empty" });

    let { cartId, productId } = requestBody;

    if (!isValidObjectId(productId))
      return res
        .status(400)
        .send({ status: false, message: "Invalide Product Id" });

    const productById = await productModel.findById(productId);

    if (!productById) {
      return res
        .status(404)
        .send({ status: false, message: " product not found!!!" });
    }

    if (productById.isDeleted == true) {
      return res
        .status(404)
        .send({ status: false, message: " product is deleted!!!" });
    }

    //Find cart in DB With UserId
    const userCart = await cartModel.findOne({ userId: userIdFromParam });

    //if cart id is given and cart not found by user
    if (cartId && !userCart) {
      return res.status(404).send({
        status: false,
        message: "cart by this user does not exist!!!",
      });
    }

    if (!cartId && userCart)
      return res.status(400).send({
        status: false,
        message:
          "This User Cart Is Alreday Created (send cart Id in Request Body)",
      });

    //_Cart not exist for User Then  Create New Cart_
    if (!userCart) {
      let filter = {};
      let prodData = { productId: productById._id, quantity: 1 };
      filter.totalItems = 1;
      filter.totalPrice = productById.price;
      filter.userId = userIdFromParam;
      filter.items = prodData;

      await cartModel.create(filter);
      let cartDataAll = await cartModel
        .findOne({ userId: userIdFromParam })
        .populate("items.productId");

      return res
        .status(201)
        .send({ status: true, message: "Success", data: cartDataAll });
    }

    if (userCart._id != cartId) {
      return res.status(400).send({
        status: false,
        message: "User Cart ID and Requestd Cart ID Not Match",
      });
    }

    //_if Usercart is Created but it is Empty_
    if (userCart.items.length === 0) {
      let filter = {};
      let prodData = { productId: productById._id, quantity: 1 };
      filter.totalItems = 1;
      filter.totalPrice = productById.price;
      filter.userId = userIdFromParam;
      filter.items = prodData;

      const newItemInCart = await cartModel
        .findOneAndUpdate({ userId: userIdFromParam }, filter, { new: true })
        .populate("items.productId");

      return res.status(200).send({
        status: true,
        message: "Product added to cart",
        data: newItemInCart,
      });
    }

    //_Checking product exist in cart_
    {
      let productExistInCart = userCart.items.findIndex(
        (items) => items.productId == requestBody.productId
      );

      //_if Provided product exist in cart_

      if (productExistInCart > -1) {
        const increasedProductQuantity = await cartModel
          .findOneAndUpdate(
            { userId: userIdFromParam, "items.productId": productId },
            {
              $inc: { totalPrice: productById.price, "items.$.quantity": 1 },
            },
            { new: true }
          )
          .populate("items.productId");

        return res.status(201).send({
          status: true,
          message: "Success",
          data: increasedProductQuantity,
        });
      }

      //_if Provided product does not exist in cart_
      if (productExistInCart == -1) {
        const updatedProductQuantity = await cartModel
          .findOneAndUpdate(
            { userId: userIdFromParam },
            {
              $push: { items: { productId: productId, quantity: 1 } },
              $inc: { totalPrice: productById.price, totalItems: 1 },
            },
            { new: true }
          )
          .populate("items.productId");

        return res.status(201).send({
          status: true,
          message: "Success",
          data: updatedProductQuantity,
        });
      }
    }
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

// <<< === Update Cart === >>>

const updateCart = async function (req, res) {
  try {
    let data = req.body;
    let userId = req.params.userId;

    if (!userId)
      return res.status(400).send({
        status: false,
        message: "Please Provide userId in the path Params",
      });

    if (!isValidObjectId(userId))
      return res
        .status(400)
        .send({ status: false, msg: "userId is not valid" });

    if (req.userId !== userId)
      return res
        .status(403)
        .send({ status: false, message: "user is not authorised" });

    let checkUser = await userModel.findById(userId);
    if (!checkUser)
      return res.status(404).send({ status: false, msg: "user is not found" });

    if (!isValidRequestBody(data)) {
      return res
        .status(400)
        .send({ status: false, message: "request Body can't be empty" });
    }

    let { productId, cartId, removeProduct } = data;

    if (!cartId)
      return res.status(400).send({ status: false, msg: "plz provide cartId" });

    if (!isValidObjectId(cartId))
      return res
        .status(400)
        .send({ status: false, message: " enter a valid cartId " });

    let findCart = await cartModel.findOne({ _id: cartId, isDeleted: false });

    if (!findCart)
      return res
        .status(404)
        .send({ status: false, message: " cart not found" });

    if (userId != findCart.userId)
      return res.status(403).send({
        status: false,
        message: "Access denied, this is not your cart",
      });

    if (!productId)
      return res
        .status(400)
        .send({ status: false, msg: "plz provide productId" });

    if (!isValidObjectId(productId))
      return res
        .status(400)
        .send({ status: false, message: " enter a valid productId " });

    let findProduct = await productModel.findOne({
      _id: productId,
      isDeleted: false,
    });

    if (typeof removeProduct != "number")
      return res.status(400).send({
        status: false,
        message: " removeProduct Value Should be Number ",
      });

    if (removeProduct !== 0 && removeProduct !== 1) {
      return res.status(400).send({
        status: false,
        message: "removeProduct value should be 0 or 1 only ",
      });
    }

    let productPrice = findProduct.price;
    let item = findCart.items;

    if (item.length == 0)
      return res.status(404).send({ status: false, message: "cart is empty" });

    let productIndex = item.findIndex(
      (loopVariable) => loopVariable.productId.toString() == productId
    );

    if (productIndex > -1) {
      if (removeProduct == 1) {
        item[productIndex].quantity--;
        findCart.totalPrice -= productPrice;
      } else if (removeProduct == 0) {
        let changePrice = item[productIndex].quantity * productPrice;
        findCart.totalPrice -= changePrice;
        item[productIndex].quantity = 0;
      }
      if (item[productIndex].quantity == 0) {
        item.splice(productIndex, 1);
      }
    }
    if (productIndex == -1) {
      return res
        .status(404)
        .send({ status: false, message: "productId not found in cart" });
    }

    findCart.totalItems = item.length;
    await findCart.save();
    let find = await cartModel
      .findOne({ userId: userId })
      .populate("items.productId");

    return res
      .status(200)
      .send({ status: true, message: "Success", data: find });
  } catch (error) {
    res.status(500).send({ status: false, message: error.message });
  }
};

// <<< === Get Cart === >>>

const getCartDeltail = async function (req, res) {
  try {
    let userId = req.params.userId;

    if (!isValidObjectId(userId))
      return res
        .status(400)
        .send({ status: false, message: "UserId  Invalid" });

    let UserId = await userModel.findOne({ userId: userId });
    if (!UserId)
      return res
        .status(404)
        .send({ status: false, message: "User Data Not Found" });

    if (req.userId != userId)
      return res
        .status(403)
        .send({ status: false, message: "user is not authorised" });

    let cartData = await cartModel
      .findOne({ userId: userId })
      .populate("items.productId");
    if (!cartData)
      return res.status(400).send({ status: false, message: "No cart data" });

    return res
      .status(200)
      .send({ status: true, message: "Success", data: cartData });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

// <<< === Cart Delete === >>>

const deleteCart = async function (req, res) {
  try {
    const userId = req.params.userId;
    if (!isValidObjectId(userId))
      return res
        .status(400)
        .send({ status: false, message: "userId is not valid" });

    const findUserId = await userModel.findOne({ userId: userId });
    if (!findUserId)
      return res.status(400).send({
        status: false,
        message: "user is not present with given userId",
      });

    if (req.userId != userId)
      return res
        .status(403)
        .send({ status: false, message: "user is not authorised" });

    const findCart = await cartModel.findOne({ userId: userId });
    if (!findCart)
      return res
        .status(400)
        .send({ status: false, message: "Cart is not found for this user" });

    const removeCart = await cartModel.findOneAndUpdate(
      { userId },
      { $set: { items: [], totalItems: 0, totalPrice: 0 } },
      { new: true }
    );

    return res
      .status(204)
      .send({ status: false, message: "cart is deleted Successfully" });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

module.exports = { createCart, updateCart, getCartDeltail, deleteCart };
