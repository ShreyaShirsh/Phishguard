const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import User Model
const User = require("./models/User");


// 🔗 MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/phishguard")
.then(() => console.log("MongoDB Connected ✅"))
.catch(err => console.log(err));


// 🧪 Test Route
app.get("/", (req, res) => {
    res.send("PhishGuard Backend Running 🚀");
});


// 👤 REGISTER API
app.post("/register", async (req, res) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();

        res.json({ message: "User Registered Successfully ✅" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// 🔑 LOGIN API
app.post("/login", async (req, res) => {
    try {
        const user = await User.findOne({
            email: req.body.email,
            password: req.body.password
        });

        if (user) {
            res.json({
                message: "Login Successful ✅",
                user: user
            });
        } else {
            res.json({
                message: "Invalid Email or Password ❌"
            });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// 🚀 Start Server
app.listen(5000, () => {
    console.log("Server running on port 5000");
});