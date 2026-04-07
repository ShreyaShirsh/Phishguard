const mongoose = require('mongoose');

const UrlChallengeSchema = new mongoose.Schema({
    category: { type: String, default: "url" },
    url: String,
    correctAnswer: String
});

const EmailChallengeSchema = new mongoose.Schema({
    category: { type: String, default: "email" },
    email: {
        from: String,
        sub: String,
        content: String
    },
    headers: [{
        text: String,
        isMalicious: Boolean,
        hint: String
    }]
});

const AttachmentChallengeSchema = new mongoose.Schema({
    category: { type: String, default: "attachment" },
    fileName: String,
    safe: Boolean
});

const SocialChallengeSchema = new mongoose.Schema({
    category: { type: String, default: "social" },
    nodes: mongoose.Schema.Types.Mixed // For the JSON tree structure
});

const UserActionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    category: String,
    action: String,
    userAnswer: String,
    correct: Boolean,
    timeTaken: Number,
    timestamp: { type: Date, default: Date.now }
});

module.exports = {
    UrlChallenge: mongoose.model('UrlChallenge', UrlChallengeSchema),
    EmailChallenge: mongoose.model('EmailChallenge', EmailChallengeSchema),
    AttachmentChallenge: mongoose.model('AttachmentChallenge', AttachmentChallengeSchema),
    SocialChallenge: mongoose.model('SocialChallenge', SocialChallengeSchema),
    UserAction: mongoose.model('UserAction', UserActionSchema)
};
