const mongoose = require("mongoose");
const User = require("./models/User");

mongoose.connect("mongodb://127.0.0.1:27017/phishguard")
.then(async () => {
    // We will find all users, unset trainings, and they will get the default modules next time they are saved/instantiated?
    // Mongoose apply defaults on find:
    const users = await User.find({});
    for(let u of users) {
        if(u.trainings) {
            u.trainings = undefined;
        }
        await u.save();
    }
    console.log("Migrated Users to modular system!");
    process.exit(0);
});
