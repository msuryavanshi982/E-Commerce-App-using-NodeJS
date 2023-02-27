const express = require('express');
const { createUser, loginUser, updateUser, getUserDetails } = require("../controllers/userController")
const { createProduct, getProductDetailsById, deleteProductById, getProductDetails, productUpdate } = require("../controllers/productController")
const { createCart, updateCart, getCartDeltail, deleteCart } = require('../controllers/cartController')
const { createOrder, updateOrderDetails } = require('../controllers/orderController')
const { authentication, authorization } = require('../middleware/auth')
const router = express.Router();


//==========Feature I --> User===================
router.post("/register", createUser)
router.post("/login", loginUser)
router.get("/user/:userId/profile", authentication, getUserDetails)
router.put("/user/:userId/profile", authentication, authorization, updateUser)


//==========Feature II --> Product================
router.post("/products", createProduct)
router.get("/products", getProductDetails)
router.get("/products/:productId", getProductDetailsById)
router.put("/products/:productId", productUpdate)
router.delete("/products/:productId", deleteProductById)


//==========Feature III --> Cart===================
router.post('/users/:userId/cart', authentication,authorization,createCart)
router.put('/users/:userId/cart', authentication, updateCart)
router.get("/users/:userId/cart", authentication, getCartDeltail)
router.delete("/users/:userId/cart", authentication, deleteCart)


//============Feature IV --> Order===================
router.post("/users/:userId/orders",authentication,authorization, createOrder)
router.put('/users/:userId/orders',authentication,authorization, updateOrderDetails)


module.exports = router
