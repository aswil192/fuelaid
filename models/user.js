const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
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
	password: {
		type: String,
		required: true
	},
	role: {
		type: String,
		enum: ["admin", "customer", "mechanic", "fueldeliveryboy"],
		required: true
	},
	// Contact & Location
	address: {
		type: String
	},
	phone: {
		type: String,
		required: true
	},
	latitude: Number,
	longitude: Number,

	// Profile Details
	profilePic: String,
	gender: {
		type: String,
		enum: ["male", "female", "other"]
	},
	age: Number,

	// Identification & Verification
	acn: { // Aadhaar Card Number (optional)
		type: Number
	},
	dl: { // Driving License
		type: String
	},
	verification_status: {
		type: String,
		enum: ["Pending", "Verified", "Rejected"],
		default: "Pending"
	},

	// Mechanic/FuelBoy specific
	experience: {
		type: Number // years of experience
	},
	availability: {
		type: String // e.g., "9am - 6pm"
	},
	employer: {
		type: String
	},

	// Vehicle Info (if applicable)
	vehicleType: {
		type: String,
		enum: ['Bike', 'Car', 'Truck', 'Other']
	},
	vehicleModel: {
		type: String,
		trim: true
	},
	licensePlate: {
		type: String,
		sparse: true,
		unique: true
	},

	joinedTime: {
		type: Date,
		default: Date.now
	},

	// Salary/Earnings for Mechanics and Fuel Delivery Boys
	totalEarnings: {
		type: Number,
		default: 0
	},
	pendingEarnings: {
		type: Number,
		default: 0
	},
	commissionRate: {
		type: Number,
		default: 80 // Provider receives 80% of service fee
	},
	lastPaidAt: {
		type: Date,
		default: null
	}
});

const User = mongoose.model("users", userSchema);
module.exports = User;