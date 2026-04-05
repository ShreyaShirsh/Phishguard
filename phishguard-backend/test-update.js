const mongoose = require("mongoose");
const User = require("./models/User");

mongoose.connect("mongodb://127.0.0.1:27017/phishguard")
.then(() => {
    console.log("✅ Tester Connected to MongoDB");
    console.log("⏳ Waiting to update an employee's score every 6 seconds...");
    
    // Periodically update the first employee found in the database
    setInterval(async () => {
        try {
            const employees = await User.find({ role: "employee" });
            if (employees.length > 0) {
                // Pick the first employee (this will be the one you log in as)
                const emp = employees[0];
                
                // Generate a random score between 0 and 100
                const newScore = Math.floor(Math.random() * 100);
                
                // Update and save
                emp.riskScore = newScore;
                await emp.save();
                
                console.log(`🔄 UPDATED: ${emp.name} (${emp.email}) risk score is now [${newScore}]`);
            } else {
                console.log("❌ No employees found in DB yet! Please register an account first.");
            }
        } catch (err) {
            console.error("Error connecting:", err);
        }
    }, 6000); // 6 seconds
})
.catch(err => console.error(err));
