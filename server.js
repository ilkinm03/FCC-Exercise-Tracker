require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const e = require("express");

mongoose.connect(process.env.ATLAS_URI);

const app = express();

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

const userSchema = new mongoose.Schema({
   username: String,
});

const exerciseSchema = new mongoose.Schema({
   description: String,
   duration: Number,
   date: String,
});

const User = new mongoose.model("User", userSchema);
const Exercise = new mongoose.model("Exercise", exerciseSchema);

app.get("/", (req, res) => {
   res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/users", (req, res) => {
   User.find({}, (err, foundUsers) => {
      if (err || !foundUsers) res.send(err);
      else res.json(foundUsers);
   });
});

app.post("/api/users", (req, res) => {
   const newUser = new User({
      username: req.body.username,
   });

   newUser.save((err) => {
      if (err) res.send(err);
      else res.json(newUser);
   });
});

app.post("/api/users/:_id/exercises", (req, res) => {
   const requestedId = req.params._id;

   if (!req.body.date) {
    req.body.date = new Date().toDateString();
  }
  

   User.findById(requestedId, (err, foundUser) => {
      if (err || !foundUser) res.send(err);
      else {
         const newExercise = new Exercise({
            _id: req.body._id,
            description: req.body.description,
            duration: req.body.duration,
            date: req.body.date,
         });

         newExercise.save((err) => {
            if (err) return console.log(err);
         });

         res.json({
            _id: foundUser._id,
            username: foundUser.username,
            date: newExercise.date,
            duration: newExercise.duration,
            description: newExercise.description,
         });
      }
   });
});

const listener = app.listen(process.env.PORT || 3000, () => {
   console.log("Your app is listening on port " + listener.address().port);
});
