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

const userSchema = new Schema({
   username: {
      type: String,
      required: true,
   },
});

const exerciseSchema = new mongoose.Schema({
   username: {
      type: String,
      required: true,
   },
   description: {
      type: String,
      required: true,
   },
   duration: {
      type: Number,
      required: true,
   },
   date: {
      type: Date,
      default: Date.now(),
   },
});

const User = new mongoose.model("User", userSchema);
const Exercise = new mongoose.model("Exercise", exerciseSchema);

app.get("/", (req, res) => {
   res.sendFile(__dirname + "/views/index.html");
});

app.route("/api/users")
   .get((req, res) => {
      User.find({}, (error, data) => {
         res.json(data);
      });
   })
   .post((req, res) => {
      const potentialUsername = req.body.username;
      console.log("potential username:", potentialUsername);

      User.findOne({ username: potentialUsername }, (error, data) => {
         if (error) {
            res.send("Unknown userID");
            return console.log(error);
         }

         if (!data) {
            const newUser = new User({
               username: potentialUsername,
            });

            newUser.save((error, data) => {
               if (error) return console.log(error);
               const reducedData = {
                  username: data.username,
                  _id: data._id,
               };
               res.json(reducedData);
               console.log(reducedData);
            });
         } else {
            res.send(`Username ${potentialUsername} already exists.`);
            console.log(`Username ${potentialUsername} already exists.`);
         }
      });
   });

app.post("/api/users/:_id/exercises", (req, res) => {
   // Get data from form
   const userID = req.body[":_id"] || req.params._id;
   const descriptionEntered = req.body.description;
   const durationEntered = req.body.duration;
   const dateEntered = req.body.date;

   // Print statement for debugging
   console.log(userID, descriptionEntered, durationEntered, dateEntered);

   // Make sure the user has entered in an id, a description, and a duration
   // Set the date entered to now if the date is not entered
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

   // Check if user ID is in the User model
   User.findOne({ _id: userID }, (error, data) => {
      if (error) {
         res.json("Invalid userID");
         return console.log(error);
      }
      if (!data) {
         res.json("Unknown userID");
         return;
      } else {
         console.log(data);
         const usernameMatch = data.username;

         // Create an Exercise object
         const newExercise = new Exercise({
            username: usernameMatch,
            description: descriptionEntered,
            duration: durationEntered,
         });

         // Set the date of the Exercise object if the date was entered
         if (dateEntered) {
            newExercise.date = dateEntered;
         }

         // Save the exercise
         newExercise.save((error, data) => {
            if (error) return console.log(error);

            console.log(data);

            // Create JSON object to be sent to the response
            const exerciseObject = {
               _id: userID,
               username: data.username,
               date: data.date.toDateString(),
               duration: data.duration,
               description: data.description,
            };

            // Send JSON object to the response
            res.json(exerciseObject);
         });
      }
   });
});

// PATH /api/users/:_id/logs?[from][&to][&limit]
app.get("/api/users/:_id/logs", (req, res) => {
   const id = req.body["_id"] || req.params._id;
   var fromDate = req.query.from;
   var toDate = req.query.to;
   var limit = req.query.limit;

   console.log(id, fromDate, toDate, limit);

   // Validate the query parameters
   if (fromDate) {
      fromDate = new Date(fromDate);
      if (fromDate == "Invalid Date") {
         res.json("Invalid Date Entered");
         return;
      }
   }

   if (toDate) {
      toDate = new Date(toDate);
      if (toDate == "Invalid Date") {
         res.json("Invalid Date Entered");
         return;
      }
   }

   if (limit) {
      limit = new Number(limit);
      if (isNaN(limit)) {
         res.json("Invalid Limit Entered");
         return;
      }
   }

   // Get the user's information
   User.findOne({ _id: id }, (error, data) => {
      if (error) {
         res.json("Invalid UserID");
         return console.log(error);
      }
      if (!data) {
         res.json("Invalid UserID");
      } else {
         // Initialize the object to be returned
         const usernameFound = data.username;
         var objToReturn = { _id: id, username: usernameFound };

         // Initialize filters for the count() and find() methods
         var findFilter = { username: usernameFound };
         var dateFilter = {};

         // Add to and from keys to the object if available
         // Add date limits to the date filter to be used in the find() method on the Exercise model
         if (fromDate) {
            objToReturn["from"] = fromDate.toDateString();
            dateFilter["$gte"] = fromDate;
            if (toDate) {
               objToReturn["to"] = toDate.toDateString();
               dateFilter["$lt"] = toDate;
            } else {
               dateFilter["$lt"] = Date.now();
            }
         }

         if (toDate) {
            objToReturn["to"] = toDate.toDateString();
            dateFilter["$lt"] = toDate;
            dateFilter["$gte"] = new Date("1960-01-01");
         }

         // Add dateFilter to findFilter if either date is provided
         if (toDate || fromDate) {
            findFilter.date = dateFilter;
         }

         // console.log(findFilter);
         // console.log(dateFilter);

         // Add the count entered or find the count between dates
         Exercise.count(findFilter, (error, data) => {
            if (error) {
               res.json("Invalid Date Entered");
               return console.log(error);
            }
            // Add the count key
            var count = data;
            if (limit && limit < count) {
               count = limit;
            }
            objToReturn["count"] = count;

            // Find the exercises and add a log key linked to an array of exercises
            Exercise.find(findFilter, (error, data) => {
               if (error) return console.log(error);

               // console.log(data);

               var logArray = [];
               var objectSubset = {};
               var count = 0;

               // Iterate through data array for description, duration, and date keys
               data.forEach(function (val) {
                  count += 1;
                  if (!limit || count <= limit) {
                     objectSubset = {};
                     objectSubset.description = val.description;
                     objectSubset.duration = val.duration;
                     objectSubset.date = val.date.toDateString();
                     console.log(objectSubset);
                     logArray.push(objectSubset);
                  }
               });

               // Add the log array of objects to the object to return
               objToReturn["log"] = logArray;

               // Return the completed JSON object
               res.json(objToReturn);
            });
         });
      }
   });
});

const listener = app.listen(process.env.PORT || 3000, () => {
   console.log("Your app is listening on port " + listener.address().port);
});
