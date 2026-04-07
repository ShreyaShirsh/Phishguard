const mongoose = require("mongoose");
const Simulation = require("./models/simulation");
const fs = require("fs");

const emailSims = JSON.parse(fs.readFileSync("./models/emailSimulation.json", "utf-8"));
const socialSims = JSON.parse(fs.readFileSync("./models/socialSimulation.json", "utf-8"));
const financialSims = JSON.parse(fs.readFileSync("./models/financialSimulation.json", "utf-8"));

mongoose.connect("mongodb://127.0.0.1:27017/phishguard")
    .then(async () => {
        console.log("Connected to MongoDB, migrating simulations...");

        await Simulation.deleteMany({});
        
        await Simulation.insertMany(emailSims);
        await Simulation.insertMany(socialSims);
        await Simulation.insertMany(financialSims);

        console.log("Simulation Data Seeded Successfully ✅");
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
