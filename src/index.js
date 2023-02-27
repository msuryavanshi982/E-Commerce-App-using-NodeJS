const express = require("express");
const route = require("./routes/route.js");
const mongoose = require("mongoose");
const multer = require("multer");

const app = express();

// to parse json data from request object
app.use(express.json());
app.use(multer().any());

mongoose.set("strictQuery", false);

const port = process.env.PORT || 3000;
const url =
  "mongodb+srv://dailyrecord:dailyrecord@cluster0.lza23fb.mongodb.net/ecommerce";

// connect to database
mongoose
  .connect(url, { useNewUrlParser: true })
  .then(() => console.log("MongoDb is connected"))
  .catch((err) => console.log(err));

app.use("/", route);

app.use("/*", function (req, res) {
  res.status(400).send({ status: false, message: "invalid endpoint" });
});

app.listen(port, function () {
  console.log("Express app running on port " + port);
});
