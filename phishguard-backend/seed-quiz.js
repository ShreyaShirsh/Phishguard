const mongoose = require("mongoose");
const Quiz = require("./models/quiz");
const fs = require("fs");

const emailQuiz = JSON.parse(fs.readFileSync("./models/quizemail.json", "utf-8"));
const socialQuiz = JSON.parse(fs.readFileSync("./models/socialQuiz.json", "utf-8"));
const financialQuiz = JSON.parse(fs.readFileSync("./models/financialQuiz.json", "utf-8"));

mongoose.connect("mongodb://127.0.0.1:27017/phishguard")
    .then(async () => {
        console.log("Connected to MongoDB, migrating quizzes...");

        await Quiz.deleteMany({});
        
        await Quiz.insertMany(emailQuiz);
        await Quiz.insertMany(socialQuiz);
        await Quiz.insertMany(financialQuiz);

        console.log("Quiz Data Seeded Successfully ✅");
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
