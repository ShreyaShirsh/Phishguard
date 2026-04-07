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
    trainings: {
        type: Array,
        default: [
            {
                id: "email_scrutiny",
                name: "Email Scrutiny Basics",
                status: "pending", // pending | completed | failed
                dueDate: "3 days",
                score: 0,                 // performance score (0–100)
                attempts: 0,              // how many times attempted
                completedAt: null,        // date of completion
                difficulty: "easy",       // easy | medium | hard
                type: "simulation",       // simulation | quiz | video
                duration: "10 min",       // estimated time
                progress: 0,              // % completed
                feedback: "",             // system feedback
                isMandatory: true         // required training
            },
            {
                id: "safe_browsing",
                name: "Safe Browsing Habits",
                status: "pending",
                dueDate: "5 days",
                score: 0,
                attempts: 0,
                completedAt: null,
                difficulty: "easy",
                type: "video",
                duration: "8 min",
                progress: 0,
                feedback: "",
                isMandatory: true
            },
            {
                id: "password_hygiene",
                name: "Password Hygiene",
                status: "pending",
                dueDate: "1 week",
                score: 0,
                attempts: 0,
                completedAt: null,
                difficulty: "medium",
                type: "quiz",
                duration: "12 min",
                progress: 0,
                feedback: "",
                isMandatory: true
            },
            // 🔥 ADVANCED MODULES
            {
                id: "phishing_detection",
                name: "Phishing Detection Advanced",
                status: "pending",
                dueDate: "1 week",
                score: 0,
                attempts: 0,
                completedAt: null,
                difficulty: "hard",
                type: "simulation",
                duration: "15 min",
                progress: 0,
                feedback: "",
                isMandatory: true
            },
            {
                id: "social_engineering",
                name: "Social Engineering Awareness",
                status: "pending",
                dueDate: "10 days",
                score: 0,
                attempts: 0,
                completedAt: null,
                difficulty: "medium",
                type: "video",
                duration: "10 min",
                progress: 0,
                feedback: "",
                isMandatory: false
            },
            {
                id: "incident_response",
                name: "Incident Reporting Process",
                status: "pending",
                dueDate: "3 days",
                score: 0,
                attempts: 0,
                completedAt: null,
                difficulty: "easy",
                type: "quiz",
                duration: "7 min",
                progress: 0,
                feedback: "",
                isMandatory: true
            }
        ]
    }
});

module.exports = mongoose.model("User", userSchema);