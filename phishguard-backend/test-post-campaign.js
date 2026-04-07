const mongoose = require("mongoose");
const User = require("./models/User");

async function run() {
    await mongoose.connect("mongodb://127.0.0.1:27017/phishguard");

    // Clear test user
    await User.deleteMany({ email: "frontendtest@gmail.com" });
    const emp = new User({ email: "frontendtest@gmail.com", role: "employee", department: "Testing", password: "123" });
    await emp.save();

    // Emulate POST /campaign payload exactly
    const payload = {
        campaignName: "Test 1",
        template: "Email Scrutiny Phishing",
        category: "Email",
        moduleCategory: "Email Scrutiny Phishing",
        department: "Testing",
        createdBy: "admin@gmail.com"
    };

    const categoryMapping = {
        "Email Scrutiny Phishing": "email_phishing",
        "Financial Phishing": "financial",
        "Social Frauds": "social_media"
    };
    const activeModId = categoryMapping[payload.moduleCategory];

    let filter = { role: "employee" };
    if (payload.department !== "All" && payload.department) filter.department = payload.department;

    const targetedUsers = await User.find(filter);
    
    let unlocked = 0;
    if (activeModId) {
        for (let u of targetedUsers) {
            if (u.modules) {
                const mIdx = u.modules.findIndex(m => m.moduleId === activeModId);
                if (mIdx >= 0) {
                    u.modules[mIdx].enabled = true;
                    u.markModified('modules');
                    await u.save();
                    unlocked++;
                }
            }
        }
    }

    const check = await User.findOne({ email: "frontendtest@gmail.com" });
    console.log("Unlocked count:", unlocked);
    console.log("Modules enabled?", check.modules[0].enabled);
    process.exit(0);
}
run();
