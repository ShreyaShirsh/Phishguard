const mongoose = require("mongoose");
const User = require("./models/User");

mongoose.connect("mongodb://127.0.0.1:27017/phishguard")
    .then(async () => {
        const emp = await User.findOne({ role: "employee" });
        if (!emp) {
            console.log("No employee found.");
            process.exit(0);
        }
        
        console.log("Before:", emp.modules[0].enabled);

        const activeModId = "email_phishing";
        const mIdx = emp.modules.findIndex(m => m.moduleId === activeModId);
        
        if (mIdx >= 0) {
            emp.modules[mIdx].enabled = true;
            emp.markModified('modules');
            await emp.save();
            console.log("Saved.");
        }
        
        const verify = await User.findOne({ email: emp.email });
        console.log("After:", verify.modules[0].enabled);
        
        process.exit(0);
    })
    .catch(console.error);
