const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
    serviceRequest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "servicerequests",
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    providerType: {
        type: String,
        enum: ["mechanic", "fueldeliveryboy"],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ["cash", "upi", "card", "online"],
        default: "cash"
    },
    transactionId: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ["pending", "completed", "failed", "refunded"],
        default: "pending"
    },
    paidAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Payment = mongoose.model("payments", paymentSchema);
module.exports = Payment;
