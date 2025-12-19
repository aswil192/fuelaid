const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
    serviceRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "servicerequests",
        required: true
    },
    reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    reviewed: { // The mechanic or fuel boy being reviewed
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    review: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Feedback = mongoose.model("feedbacks", feedbackSchema);
module.exports = Feedback;
