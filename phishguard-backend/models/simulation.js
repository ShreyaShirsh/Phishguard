const mongoose = require("mongoose");

const simulationSchema = new mongoose.Schema({
    category: String,
    title: String,
    emailContent: String,
    question: String,
    options: [String],
    answer: Number
});

module.exports = mongoose.model("Simulation", simulationSchema);