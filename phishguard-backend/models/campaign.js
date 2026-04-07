const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema({
    campaignName: String,
    template: String,
    category: { type: String, default: "General" },
    department: String,
    createdBy: String,
    targetedEmployees: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Campaign", campaignSchema);