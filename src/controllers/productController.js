const productModel = require("../models/productModel");
const { uploadFile } = require("../aws/aws");

const {isValidImage,isValid,isValidSizes,isValidObjectId,isValidRequestBody,isValidPrice,isValidStyle} = require("../validators/productValidation");

// <<< === CREATE PRODUCT API === >>>
const createProduct = async function (req, res) {
  try {
    let data = req.body;
    let files = req.files;

    if (!isValidRequestBody(data)) {
      return res
        .status(400)
        .send({ status: false, message: "request Body cant be empty" });
    }

    //destructuring of data object
    let {title,description,price,currencyId,currencyFormat,isFreeShipping,style,availableSizes,installments} = data;

    //title validation
    if (!title)
      return res
        .status(400)
        .send({ status: false, message: "Please enter title" });

    if (!isValid(title))
      return res.status(400).send({
        status: false,
        message: "Please enter title in correct format",
      });

    data.title = title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();

    let findTitle = await productModel.findOne({ title: data.title });

    if (findTitle)
      return res
        .status(400)
        .send({ status: false, message: "Title Already exist!!!" });

    //description validation
    if (!description)
      return res
        .status(400)
        .send({ status: false, message: "Please enter description" });

    if (!isValid(description))
      return res.status(400).send({
        status: false,
        message: "Please enter description in correct format",
      });

    //price validation
    if (!price)
      return res
        .status(400)
        .send({ status: false, message: "Please enter price" });

    if (!isValidPrice(price.trim()))
      return res
        .status(400)
        .send({ status: false, message: "Enter a proper price" });

    //currencyID validation
    if (!currencyId)
      return res
        .status(400)
        .send({ status: false, message: "Please enter currencyId" });
    currencyId = currencyId.trim().toUpperCase();

    if (currencyId != "INR")
      return res
        .status(400)
        .send({ status: false, message: "currencyId invalid" });

    //currencyFormat validation
    if (!currencyFormat)
      return res
        .status(400)
        .send({ status: false, message: "Please enter currencyFormat" });

    if (currencyFormat != "₹")
      return res.status(400).send({
        status: false,
        message: "Please enter a valid currencyFormat",
      });

    data.currencyFormat = currencyFormat;

    //productImage validation

    if (files.length === 0)
      return res
        .status(400)
        .send({ status: false, message: "ProductImage is required" });

    let fileExtension = files[0];

    if (!isValidImage(fileExtension.originalname))
      return res.status(400).send({
        status: false,
        message: "Image format Must be in jpeg,jpg,png",
      });

    let productImgUrl = await uploadFile(files[0]);
    // data.productImage = productImgUrl

    let product = {
      title: data.title,
      description: description,
      price: price,
      currencyId: currencyId,
      currencyFormat: currencyFormat,
      productImage: productImgUrl,
      deletedAt: null,
    };

    //availableSizes validations
    if (Object.keys(data).some((a) => a === "availableSizes")) {
      // .some method iterate on the array and find the value and return the boolean value
      if (!availableSizes)
        return res
          .status(400)
          .send({ status: false, message: "available sizes can't be empty" });

      var sizeList = availableSizes
        .toUpperCase()
        .split(",")
        .map((x) => x.trim());

      for (let i = 0; i < sizeList.length; i++) {
        if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(sizeList[i]))
          return res.status(400).send({
            status: false,
            message:
              "Please Enter valid sizes, it should include only sizes from  (S,XS,M,X,L,XXL,XL) ",
          });
      }
    }
    product.availableSizes = sizeList;

    //isFreeShipping validation
    if (isFreeShipping) {
      isFreeShipping = isFreeShipping.trim();
      if (!(isFreeShipping == "true" || isFreeShipping == "false"))
        return res.status(400).send({
          status: false,
          message: "Please enter a boolean value for isFreeShipping",
        });

      product.isFreeShipping = isFreeShipping;
    }

    //installments validations
    if (installments) {
      if (!/^[0-9]+$/.test(installments))
        return res
          .status(400)
          .send({ status: false, message: "Invalid value for installments" });

      product.installments = installments;
    }

    //style validation
    if (style) {
      if (!isValid(style))
        return res.status(400).send({
          status: false,
          message: "Please enter style in correct format",
        });

      if (!isValidStyle(style.trim()))
        return res
          .status(400)
          .send({ status: false, message: "Enter a proper style" });
      product.style = style;
    }

    //create document
    const newProduct = await productModel.create(product);
    return res
      .status(201)
      .send({ status: "true", message: "Success", data: newProduct });
  } catch (err) {
    res.status(500).send({ status: false, message: err.message });
  }
};

// <<< === GET PRODUCT DETAILS === >>>
const getProductDetails = async function (req, res) {
  try {
    let data = req.query;
    let filter = { isDeleted: false };

    // validation for the empty body
    if (isValidRequestBody(data)) {
      let { size, name, priceGreaterThan, priceLessThan, priceSort } = data; 

      // validation for size
      if (size) {
        size = size.toUpperCase();
        if (!isValidSizes(size)) {
          let givenSizes = ["S", "XS", "M", "X", "L", "XXL", "XL"];
          return res.status(400).send({
            status: false,
            message: `size should be one from these only ${givenSizes}`,
          });
        } else {
          size = size.split(",");

          filter = { availableSizes: { $in: size } };
        }
      }
      // validation for name
      if (name) {
        name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
        filter["title"] = { $regex: name }; // check the substring
      }

      // validation for price
      if (priceGreaterThan || priceLessThan) {
        filter.price = {};

        if (priceGreaterThan) {
          if (!isValidPrice(priceGreaterThan))
            return res.status(400).send({
              status: false,
              message: "priceGreaterThan should be valid",
            });

          priceGreaterThan = Number(priceGreaterThan);
          filter.price.$gte = priceGreaterThan;
        }
        if (priceLessThan) {
          if (!isValidPrice(priceLessThan))
            return res.status(400).send({
              status: false,
              message: "priceLessThan should be valid",
            });

          priceLessThan = Number(priceLessThan);
          filter.price.$lte = priceLessThan;
        }
      }

      if (priceGreaterThan && priceLessThan && priceGreaterThan > priceLessThan)
        return res
          .status(400)
          .send({ status: false, message: "Invalid price range" });

      // validation for price sorting
      if (priceSort) {
        if (!(priceSort == 1 || priceSort == -1)) {
          return res.status(400).send({
            status: false,
            message: "In price sort it contains only 1 & -1",
          });
        }

        const products = await productModel
          .find(filter)
          .sort({ price: priceSort });

        if (!products)
          return res
            .status(404)
            .send({ status: false, message: "No products found" });

        return res
          .status(200)
          .send({ status: true, message: "Success", data: products });
      }
    }

    // find collection without filters
    const findData = await productModel.find(filter).sort({ price: 1 });
    if (findData.length == 0)
      return res
        .status(404)
        .send({ status: false, message: "No products found" });

    return res
      .status(200)
      .send({ status: true, message: "Success", data: findData });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

// <<< === GET PRODUCT DETAILS BY PRODUCTID === >>>
const getProductDetailsById = async function (req, res) {
  try {
    let productId = req.params.productId;

    //validation of productID
    if (!productId)
      return res.status.send({
        status: false,
        message: "Not a valid Product Id",
      });

    if (!isValidObjectId(productId))
      return res
        .status(400)
        .send({ status: false, message: "ProductId is  Invalid" });

    let productData = await productModel.findById({ _id: productId });

    if (!productData || productData.isDeleted === true)
      return res.status(404).send({ status: false, msg: "No product exits" });

    return res
      .status(200)
      .send({ status: true, message: "Success", data: productData });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

// <<< === UPDATE PRODUCT DETAILS === >>>
const productUpdate = async function (req, res) {
  try {
    let productId = req.params.productId;
    let files = req.files;
    let updateData = req.body;

    if (!isValidObjectId(productId))
      return res
        .status(400)
        .send({ status: false, message: "InValid ProductId" });

    if (!isValidRequestBody(updateData) && files == undefined)
      return res
        .status(400)
        .send({ status: false, message: "update Body can't be empty" });

    let {title, description,price,currencyId,currencyFormat,isFreeShipping, productImage, style, availableSizes, installments} = updateData;

    //validation of title
    if (Object.keys(updateData).some((a) => a === "title")) {
      if (!title)
        return res
          .status(400)
          .send({ status: false, message: "Enter Value in title Field " });
      if (!isValid(title))
        return res.status(400).send({
          status: false,
          message: "Please enter title in correct format",
        });

      updateData.title =
        title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();

      let findTitle = await productModel.findOne({ title: updateData.title });
      if (findTitle)
        return res
          .status(400)
          .send({ status: false, message: "This Title Is Alredy Used" });
    }

    //validation of description
    if (Object.keys(updateData).some((a) => a === "description")) {
      if (!description)
        return res.status(400).send({
          status: false,
          message: "Enter Value in description Field ",
        });
      if (!isValid(description))
        return res.status(400).send({
          status: false,
          message: "Please enter description in correct format",
        });
    }

    // validation of price
    if (Object.keys(updateData).some((a) => a === "price")) {
      if (!price)
        return res
          .status(400)
          .send({ status: false, message: "Enter Value in price Field " });

      if (!isValidPrice(price.trim()))
        return res
          .status(400)
          .send({ status: false, message: "Enter a proper price" });
    }

    //validation of currencyID
    if (Object.keys(updateData).some((a) => a === "currencyId")) {
      if (!currencyId)
        return res
          .status(400)
          .send({ status: false, message: "Enter Value in currencyId Field " });
      currencyId = currencyId.trim().toUpperCase();

      if (currencyId != "INR")
        return res
          .status(400)
          .send({ status: false, message: "currencyId invalid" });
    }

    // validation of currencyFormat
    if (Object.keys(updateData).some((a) => a === "currencyFormat")) {
      if (!currencyFormat)
        return res.status(400).send({
          status: false,
          message: "Enter Value in currencyFormat Field ",
        });

      if (currencyFormat != "₹")
        return res.status(400).send({
          status: false,
          message: "Please enter a valid currencyFormat",
        });
      //
    }
    if (Object.keys(updateData).some((a) => a === "isFreeShipping")) {
      if (!isFreeShipping)
        return res.status(400).send({
          status: false,
          message: "Enter Value in isFreeShipping Field ",
        });
      isFreeShipping = isFreeShipping.trim();
      if (!(isFreeShipping == "true" || isFreeShipping == "false"))
        return res.status(400).send({
          status: false,
          message: "Please enter a boolean value for isFreeShipping",
        });
    }

    if (productImage == "") {
      if (!productImage && files.length == 0) {
        return res.status(400).send({
          status: false,
          message: "Enter Value in productImage file ",
        });
      }
    }

    if (files.length > 0) {
      let fileExtension = files[0];
      if (!isValidImage(fileExtension.originalname))
        return res.status(400).send({
          status: false,
          message: "productImage format Must be in jpeg,jpg,png",
        });

      let uploadedImageURL = await uploadFile(files[0]);
      updateData.productImage = uploadedImageURL;
    }

    if (Object.keys(updateData).some((a) => a === "style")) {
      if (!style)
        return res
          .status(400)
          .send({ status: false, message: "Enter Value in style Field " });
      if (!isValid(style))
        return res.status(400).send({
          status: false,
          message: "Please enter style in correct format",
        });

      if (!isValidStyle(style.trim()))
        return res
          .status(400)
          .send({ status: false, message: "Enter a proper style" });
    }
    if (availableSizes) {
      let sizeList = availableSizes
        .toUpperCase()
        .split(",")
        .map((x) => x.trim());

      for (let i = 0; i < sizeList.length; i++) {
        if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(sizeList[i]))
          return res.status(400).send({
            status: false,
            message:
              "Please Enter valid sizes, it should include only sizes from  (S,XS,M,X,L,XXL,XL) ",
          });
      }
      updateData.availableSizes = sizeList;
    }
    if (Object.keys(updateData).some((a) => a === "installments")) {
      if (!installments)
        return res.status(400).send({
          status: false,
          message: "Enter Value in installments Field ",
        });
      if (!/^[0-9]+$/.test(installments))
        return res
          .status(400)
          .send({ status: false, message: "Invalid value for installments" });
    }

    let findProduct = await productModel.findById(productId);

    if (!findProduct)
      return res
        .status(404)
        .send({ status: false, message: "Product Not Found" });

    if (findProduct.isDeleted == true)
      return res
        .status(400)
        .send({ status: false, message: "This Product is Deleted" });

    let updatedProduct = await productModel.findByIdAndUpdate(
      { _id: productId },
      { $set: updateData },
      { new: true }
    );
    return res
      .status(200)
      .send({ status: true, message: "Success", data: updatedProduct });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

// <<< === DELETE PRODUCT DETAILS BY PRODUCTID === >>>

const deleteProductById = async function (req, res) {
  try {
    let productId = req.params.productId;

    if (!isValidObjectId(productId))
      return res
        .status(400)
        .send({ status: false, message: "ProductId is  Invalid" });

    let product = await productModel.findOne({ _id: productId });

    if (product.isDeleted == true)
      return res
        .status(400)
        .send({ status: true, message: "Product is already deleted" });

    if (!product)
      return res
        .status(404)
        .send({ status: false, message: " Product not found" });

    await productModel.findOneAndUpdate(
      { _id: productId, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: Date.now() } }
    );

    return res
      .status(200)
      .send({ status: true, message: "Product is deleted successfully..!!" });
  } catch (error) {
    res.status(500).send({ status: false, message: error.message });
  }
};

// = Exported all the function here === >>>
module.exports = { createProduct, getProductDetailsById, deleteProductById, getProductDetails, productUpdate};
