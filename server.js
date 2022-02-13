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
   username: String
});

const exerciseSchema = new mongoose.Schema({
   _id: String,
   description: String,
   duration: Number,
   date: Date,
});

const User = new mongoose.model("User", userSchema);
const Exercise = new mongoose.model("Exercise", exerciseSchema);

app.get("/", (req, res) => {
   res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/users", (req, res) => {
   User.find({}, (err, foundUsers) => {
      if (err || !foundUsers) return console.log(err);
      else res.json(foundUsers);
   });
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

app.post("/api/users/:_id/exercises", (req, res) => {
   const { _id, description, duration, date } = req.body;

   if (req.body.date === "") req.body.date = new Date().toDateString();

   User.findById(_id, (err, data) => {
      if (err || !data) res.send(err);
      else {
         const newExercise = new Exercise({
            _id,
            description,
            duration,
            date,
         });

         newExercise.save((err, data) => {
            if (err) return console.log(err);
            else {
               res.json({
                  _id,
                  username: data.username,
                  description,
                  duration,
                  date,
               });
            }
         });
      }
   });
});

const listener = app.listen(process.env.PORT || 3000, () => {
   console.log("Your app is listening on port " + listener.address().port);
});
