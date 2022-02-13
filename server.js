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

const User = new mongoose.model("User", userSchema);

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
   const userID = req.body[":_id"] || req.params._id;
   const descriptionEntered = req.body.description;
   const durationEntered = req.body.duration;
   const dateEntered = req.body.date;

   console.log(userID, descriptionEntered, durationEntered, dateEntered);

   if (!userID) {
      res.json("Path `userID` is required.");
      return;
   }
   if (!descriptionEntered) {
      res.json("Path `description` is required.");
      return;
   }
   if (!durationEntered) {
      res.json("Path `duration` is required.");
      return;
   }

   User.findOne({ _id: userID }, (err, data) => {
      if (err) {
         res.json("Invalid userID");
         return console.log(err);
      }
      if (!data) {
         res.json("Unknown userID");
         return;
      } else {
         console.log(data);
         const usernameMatch = data.username;

         const newExercise = new Exercise({
            username: usernameMatch,
            description: descriptionEntered,
            duration: durationEntered,
         });

         if (dateEntered) {
            newExercise.date = dateEntered;
         }

         newExercise.save((err, data) => {
            if (error) return console.log(err);

            console.log(data);

            const exerciseObject = {
               _id: userID,
               username: data.username,
               date: data.date.toDateString(),
               duration: data.duration,
               description: data.description,
            };

            res.json(exerciseObject);
         });
      }
   });
});

const listener = app.listen(process.env.PORT || 3000, () => {
   console.log("Your app is listening on port " + listener.address().port);
});
