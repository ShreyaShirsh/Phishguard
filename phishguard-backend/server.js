const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const User = require("./models/User");
const Campaign = require("./models/campaign");

mongoose.connect("mongodb://127.0.0.1:27017/phishguard")
.then(() => console.log("MongoDB Connected ✅"))
.catch(err => console.log(err));

app.get("/", (req, res) => {
    res.send("PhishGuard Backend Running 🚀");
});

app.post("/register", async (req, res) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();
        res.json({ message: "User Registered Successfully ✅" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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

app.post("/campaign", async (req, res) => {
    try {
        const newCampaign = new Campaign(req.body);
        await newCampaign.save();
        res.json({ message: "Campaign Created Successfully ✅" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔥 NEW API
app.get("/campaigns", async (req, res) => {
    try {
        const campaigns = await Campaign.find();
        res.json(campaigns);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🗑 DELETE CAMPAIGN
app.delete("/campaign/:id", async (req, res) => {
    try {
        await Campaign.findByIdAndDelete(req.params.id);
        res.json({ message: "Campaign Deleted Successfully ✅" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});