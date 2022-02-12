require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

mongoose.connect(process.env.ATLAS_URI);

const app = express();

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

const userSchema = new mongoose.Schema({
   username: String,
});

const User = new mongoose.model("User", userSchema);

app.get("/", (req, res) => {
   res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", (req, res) => {
   const newUser = new User({
      username: req.body.username,
   });

   newUser.save((err) => {
      if (err) return console.log(err);
      else res.json(newUser);
   });
});

const listener = app.listen(process.env.PORT || 3000, () => {
   console.log("Your app is listening on port " + listener.address().port);
});
