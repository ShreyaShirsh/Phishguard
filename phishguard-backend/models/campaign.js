const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema({
    campaignName: String,
    template: String,
    department: String,
    createdBy: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Campaign", campaignSchema);