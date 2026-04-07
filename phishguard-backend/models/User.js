const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: String,
    department: String,
    riskScore: {
        type: Number,
        default: 0
    },
    phishingStats: {
        emailsReceived: { type: Number, default: 0 },
        linksClicked: { type: Number, default: 0 },
        reportsSubmitted: { type: Number, default: 0 }
    },
    categoryFails: { type: Object, default: {} },
    badges: { type: Array, default: [] },
    xp: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastTrainingDate: { type: Date, default: null },
    modules: {
        type: Array,
        default: [
            {
                moduleId: "email_phishing",
                title: "Email Scrutiny Phishing",
                enabled: false,
                tasks: [
                    { type: "video", name: "Video watching", xp: 30, completed: false },
                    { type: "quiz", name: "Quiz", xp: 50, completed: false },
                    { type: "simulation", name: "Simulation study", xp: 100, completed: false }
                ]
            },
            {
                moduleId: "social_media",
                title: "Social Media Phishing",
                enabled: false,
                tasks: [
                    { type: "video", name: "Video watching", xp: 30, completed: false },
                    { type: "quiz", name: "Quiz", xp: 50, completed: false },
                    { type: "simulation", name: "Simulation study", xp: 100, completed: false }
                ]
            },
            {
                moduleId: "financial",
                title: "Financial Phishing",
                enabled: false,
                tasks: [
                    { type: "video", name: "Video watching", xp: 30, completed: false },
                    { type: "quiz", name: "Quiz", xp: 50, completed: false },
                    { type: "simulation", name: "Simulation study", xp: 100, completed: false }
                ]
            }
        ]
    }
});

module.exports = mongoose.model("User", userSchema);