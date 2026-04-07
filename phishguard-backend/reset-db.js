const mongoose = require("mongoose");
const User = require("./models/User");

mongoose.connect("mongodb://127.0.0.1:27017/phishguard")
.then(async () => {
    const users = await User.find({});
    for(let u of users) {
        // Reset and clear legacy so Mongoose defaults are pulled
        u.modules = undefined; 
        u.riskScore = 0;
        await u.save();
    }
    console.log("Database reset to safe 0-risk state with locked modules!");
    process.exit(0);
});
