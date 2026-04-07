const mongoose = require("mongoose");
const User = require("./models/User");

async function run() {
    await mongoose.connect("mongodb://127.0.0.1:27017/phishguard");

    // 1. clear and create a user
    await User.deleteMany({ email: "testemp@gmail.com" });
    const emp = new User({ email: "testemp@gmail.com", role: "employee", department: "Finance" });
    await emp.save();
    console.log("Created emp, modules enabled?", emp.modules[0].enabled);

    // 2. run the logic
    const moduleCategory = "Email Scrutiny Phishing";
    const categoryMapping = {
        "Email Scrutiny Phishing": "email_phishing",
        "Financial Phishing": "financial",
        "Social Frauds": "social_media"
    };
    const activeModId = categoryMapping[moduleCategory];

    let filter = { role: "employee" };
    const targetedUsers = await User.find(filter);
    
    if (activeModId) {
        for (let u of targetedUsers) {
            if (u.modules) {
                const mIdx = u.modules.findIndex(m => m.moduleId === activeModId);
                if (mIdx >= 0) {
                    u.modules[mIdx].enabled = true;
                    u.markModified('modules');
                    await u.save();
                    console.log(`Unlocked for ${u.email}`);
                }
            }
        }
    }

    const check = await User.findOne({ email: "testemp@gmail.com" });
    console.log("After update, modules enabled?", check.modules[0].enabled);
    process.exit(0);
}

run();
