const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: String,
    department: String,
    riskScore: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model("User", userSchema);