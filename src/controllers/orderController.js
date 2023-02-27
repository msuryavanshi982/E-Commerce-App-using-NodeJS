const { isValidObjectId } = require("mongoose");
const userModel = require("../models/userModel");
const cartModel = require("../models/cartModel");
const orderModel = require("../models/orderModel");
const { isValidRequestBody } = require("../validators/userValidation");

// <<< === Order Create API === >>>
const createOrder = async function (req, res) {
  try {
    let userId = req.params.userId;
    let requestBody = req.body;
    let { cartId, cancellable, status } = requestBody;

    if (!isValidRequestBody(requestBody))
      return res
        .status(400)
        .send({ status: false, message: "request Body cant be emp" });

    if (!isValidObjectId(cartId))
      return res
        .status(400)
        .send({ status: false, message: "cart Id is not valid " });

    let findUserCart = await cartModel
      .findOne({ userId: userId })
      .select({ createdAt: 0, updatedAt: 0, __v: 0 })
      .lean();

    if (!findUserCart)
      return res
        .status(404)
        .send({ status: false, message: "Requested User Cart Not found" });

    if (findUserCart.items.length == 0)
      return res.status(404).send({
        status: false,
        message: "No any product or Items in your Cart",
      });

    if (cartId != findUserCart._id)
      return res.status(400).send({
        status: false,
        message: "Access denied, this is not your cart",
      });

    let totalQuantity = 0;
    for (let obj of findUserCart.items) {
      totalQuantity += obj.quantity;
    }

    findUserCart.totalQuantity = totalQuantity;
    delete findUserCart._id;

    if (cancellable) {
      if (!(cancellable == true || cancellable == false)) {
        return res.status(400).send({
          status: false,
          message: "cancellable value is true or false only",
        });
      }
      findUserCart.cancellable = cancellable;
    }

    const isValideStatus = function (status) {
      return ["pending", "completed", "cancled"].includes(status);
    };
    if (status) {
      if (!isValideStatus(status))
        return res.status(400).send({
          status: false,
          message: "status Value should be [pending, completed, cancled]",
        });

      findUserCart.status = status;
    }

    let orderCreate = await orderModel.create(findUserCart);

    if (orderCreate) {
      // clearCart =>
       await cartModel.findByIdAndUpdate(cartId, {
        $set: { items: [], totalPrice: 0, totalItems: 0 },
      });
    }

    let order = await orderModel
      .findOne({ userId: userId })
      .populate("items.productId");
    return res
      .status(201)
      .send({ status: true, message: "Success", data: order });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

// <<< === Order Update === >>>
const updateOrderDetails = async function (req, res) {
  try {
    const paramsUserId = req.params.userId;
    const data = req.body;
    const { status, orderId } = data;

    if (!isValidObjectId(paramsUserId))
      return res
        .status(400)
        .send({ status: false, message: "userId is not valid" });

    const findUser = await userModel.findById(paramsUserId);
    if (!findUser)
      return res.status(400).send({
        status: false,
        message: "User is not exist with given userId",
      });

    if (!isValidRequestBody(data))
      return res.status(400).send({
        status: false,
        message: "Please provide data in the request body",
      });

    if (!orderId)
      return res.status(400).send({
        status: false,
        message: "please provide orderId in the requset body",
      });

    if (!isValidObjectId(orderId))
      return res
        .status(400)
        .send({ status: false, message: "orderId is not valid" });

    const findOrder = await orderModel.findOne({
      _id: orderId,
      userId: paramsUserId,
    });
    if (!findOrder)
      return res.status(400).send({
        status: false,
        message: "Order details is not found with the given OrderId",
      });

    if (findOrder.cancellable == true) {
      let statusType = ["pending", "completed", "cancled"];
      if (statusType.indexOf(status) == -1)
        return res.status(400).send({
          status: false,
          message:
            "Please provide status from these options only ('pending', 'completed' or 'cancelled')",
        });

      if (status == "completed") {
        if (findOrder.status == "pending") {
          const updateStatus = await orderModel
            .findOneAndUpdate(
              { _id: orderId },
              {
                $set: {
                  status: status,
                  isDeleted: true,
                  deletedAt: Date.now(),
                },
              },
              { new: true }
            )
            .populate("items.productId");
          return res
            .status(200)
            .send({ status: true, message: "Success", data: updateStatus });
        }
        if (findOrder.status == "completed") {
          return res.status(400).send({
            status: false,
            message: "Your order is already completed",
          });
        }
        if (findOrder.status == "cancled") {
          return res
            .status(400)
            .send({ status: false, message: "Your order is cancled " });
        }
      }
      if (status == "cancled") {
        if (findOrder.status == "pending") {
          const updateStatus = await orderModel
            .findOneAndUpdate(
              { _id: orderId },
              {
                $set: {
                  status: status,
                  isDeleted: true,
                  deletedAt: Date.now(),
                },
              },
              { new: true }
            )
            .populate("items.productId");
          return res.status(200).send({
            status: true,
            message: "Order is cancled successfully",
            data: updateStatus,
          });
        }
        if (findOrder.status == "completed") {
          return res.status(400).send({
            status: false,
            message: "Your order is already completed",
          });
        }
        if (findOrder.status == "cancled") {
          return res.status(400).send({
            status: false,
            message: "Your order is already cancelled",
          });
        }
      }
    }

    if (findOrder.cancellable == false) {
      let statusType = ["pending", "completed", "cancelled"];
      if (statusType.indexOf(status) == -1)
        return res.status(400).send({
          status: false,
          message:
            "Please provide status from these options only ('pending', 'completed' or 'cancelled')",
        });

      if (status == "completed") {
        if (findOrder.status == "pending") {
          const updateStatus = await orderModel
            .findOneAndUpdate(
              { _id: orderId },
              {
                $set: {
                  status: status,
                  isDeleted: true,
                  deletedAt: Date.now(),
                },
              },
              { new: true }
            )
            .populate("items.productId");
          return res.status(200).send({
            status: true,
            message: "Your order is Completed successfully",
            data: updateStatus,
          });
        }
        if (findOrder.status == "completed") {
          return res.status(400).send({
            status: false,
            message: "Your order is already completed",
          });
        }
        if (findOrder.status == "cancled") {
          return res
            .status(400)
            .send({ status: false, message: "Your order is canceled " });
        }
      }

      if (status == "cancled") {
        return res.status(400).send({
          status: false,
          message: "Cannot be cancelled as it is not cancellable",
        });
      }
    }
  } catch (err) {
    res.status(500).send({ status: false, message: err.message });
  }
};

module.exports = { createOrder, updateOrderDetails };
