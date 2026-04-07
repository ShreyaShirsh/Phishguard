const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { UrlChallenge, EmailChallenge, AttachmentChallenge, SocialChallenge } = require("./models/TrainingData");

mongoose.connect("mongodb://127.0.0.1:27017/phishguard")
.then(async () => {
    console.log("MongoDB Connected for Seeding ✅");

    // Clear existing
    await UrlChallenge.deleteMany({});
    await EmailChallenge.deleteMany({});
    await AttachmentChallenge.deleteMany({});
    await SocialChallenge.deleteMany({});

    // Read files
    const urls = JSON.parse(fs.readFileSync(path.join(__dirname, "models/URLChallengeData.json"), "utf8"));
    const emails = JSON.parse(fs.readFileSync(path.join(__dirname, "models/EmailTrainingData.json"), "utf8"));
    const attachments = JSON.parse(fs.readFileSync(path.join(__dirname, "models/AttachmentGameData.json"), "utf8"));
    const social = JSON.parse(fs.readFileSync(path.join(__dirname, "models/SocialEngineeringData.json"), "utf8"));

    // Insert
    await UrlChallenge.insertMany(urls);
    await EmailChallenge.insertMany(emails);
    await AttachmentChallenge.insertMany(attachments);
    await SocialChallenge.create({ category: "social", nodes: social });

    console.log("Training Data Seeded Successfully ✅");
    process.exit(0);
})
.catch(err => {
    console.error(err);
    process.exit(1);
});
