const mongoose = require("mongoose");

const hiringSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    // Contact & Location
    address: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    latitude: Number,
    longitude: Number,

    // Details
    gender: {
        type: String,
        enum: ["male", "female"]
    },
    age: Number,
    acn: {
        type: Number,
        required: true
    },
    dl: {
        type: String
    },
    profilePic: String,

    // Professional
    role: {
        type: String,
        enum: ["fuelboy"],
        required: true
    },
    verification_status: {
        type: String,
        enum: ["Pending", "Verified", "Rejected"],
        default: "Pending"
    },
    experience: {
        type: Number // years of experience
    },
    availability: {
        type: String // e.g., "9am - 6pm"
    },
    employer: {
        type: String,
    },

    // Vehicle
    vehicleType: {
        type: String,
        enum: ['Bike', 'Car', 'Truck', 'Scooter', 'Other']
    },
    vehicleModel: {
        type: String,
        trim: true
    },
    vehicleNumber: {
        type: String,
    },

    joinedTime: {
        type: Date,
        default: Date.now
    }
});

const Hire = mongoose.model("hires", hiringSchema);
module.exports = Hire;