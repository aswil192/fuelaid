const mongoose = require("mongoose");

const receiptSchema = new mongoose.Schema({
    serviceRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "servicerequests",
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: "INR"
    },
    paymentMethod: {
        type: String,
        default: "Cash"
    },
    pdfPath: {
        type: String, // Path to the generated PDF file
        required: true
    },
    generatedAt: {
        type: Date,
        default: Date.now
    }
});

const Receipt = mongoose.model("receipts", receiptSchema);
module.exports = Receipt;
