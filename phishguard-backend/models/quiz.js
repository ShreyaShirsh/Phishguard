const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema({
  category: String,
  question: String,
  scenario: String,
  options: [String],
  answer: Number
});

module.exports = mongoose.model("Quiz", quizSchema);