const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

// MIDDLEWARE

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// DB AND MODELS
const mongoose = require("mongoose");
const { Schema, model } = mongoose;

mongoose.connect(process.env.MONGO_URI, { useUnifiedTopology: true });

const exerciseSchema = new Schema({
  userId: {
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
    required: true,
  },
});

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
  },
});

const User = model("User", userSchema);
const Exercise = model("Exercise", exerciseSchema);

// HELPER FUNCTIONS AND GLOBAL VARS

const MIN_DATE = "0000-01-01";
const MAX_DATE = "9999-12-31";

function toDateStringUTC(dateObj) {
  // replacement for `Date.prototype.toDateString()` that returns time in UTC timezone instead of local time zone
  const dateParts = dateObj
    .toUTCString()
    .slice(0, 16)
    .replace(",", "")
    .split(" ");
  return [dateParts[0], dateParts[2], dateParts[1], dateParts[3]].join(" ");
}

// ROUTES

const API_ROOT = "/api/users";

// route - users
app
  .route(`${API_ROOT}/?`)
  .post((req, res) => {
    const { username } = req.body;
    User.create({ username: username })
      .then((data) => {
        console.log(`POST to ${API_ROOT}/?`);
        const response = {
          username: String(data.username),
          _id: String(data._id),
        };
        console.log(response);
        res.json(response);
      })
      .catch((err) => console.error(err));
  })
  .get(async (req, res) => {
    try {
      const data = await User.find({}).select("-__v").lean().exec();
      console.log(`GET to ${API_ROOT}/?`);
      const response = data.map((data) => {
        return {
          _id: String(data._id),
          username: String(data.username),
        };
      });
      console.log(response);
      res.json(response);
    } catch (err) {
      console.error(err);
    }
  });

// route - exercises
app.post(`${API_ROOT}/:_id/exercises/?`, async (req, res) => {
  try {
    const userId = req.params["_id"];
    const { description, duration, date } = req.body;
    const isEmptyDate = String(date) === "" || date == undefined;
    const currDate = new Date().toISOString().substring(0, 10);

    const user = await User.findById(userId).select("username").exec();

    const exercise = await Exercise.create({
      userId,
      description,
      duration: parseInt(duration),
      date: isEmptyDate ? currDate : date,
    });
    const response = {
      _id: String(user._id),
      username: String(user.username),
      date: toDateStringUTC(new Date(exercise.date)),
      duration: parseInt(exercise.duration),
      description: String(exercise.description),
    };
    console.log(`POST to ${API_ROOT}/:_id/exercises/?`);
    console.log(response);
    res.json(response);
  } catch (err) {
    console.error(err);
  }
});

// route - logs
app.get(`${API_ROOT}/:_id/logs/?`, async (req, res) => {
  try {
    const userId = req.params["_id"];
    let from = req.query.from || MIN_DATE;
    let to = req.query.to || MAX_DATE;
    let limit = parseInt(req.query.limit) || Number.MAX_SAFE_INTEGER;

    const user = await User.findById(userId).select("username").lean().exec();

    const findFilter = {
      userId: String(user._id),
      date: {
        $gte: from,
        $lte: to,
      },
    };
    const selectFilter = "-_id description duration date";
    const exercisesQuery = await Exercise.find(findFilter)
      .select(selectFilter)
      .limit(limit)
      .lean()
      .exec();
    const count = await Exercise.find(findFilter)
      .select(selectFilter)
      .limit(limit)
      .countDocuments()
      .lean()
      .exec();

    const response = {
      _id: String(user._id),
      username: String(user.username),
      count: parseInt(count),
      log: exercisesQuery
        ? exercisesQuery.map((exercise) => {
            return {
              description: exercise.description,
              duration: parseInt(exercise.duration),
              date: toDateStringUTC(new Date(exercise.date)),
            };
          })
        : [],
    };
    console.log(`GET to ${API_ROOT}/:_id/logs/?`);
    console.log(response);
    res.json(response);
  } catch (err) {
    console.error(err);
  }
});

// start server

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
