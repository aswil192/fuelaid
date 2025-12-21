const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Connect to MongoDB
const connectDB = async () => {
	try {
		const db = process.env.MONGO_URI;
		await mongoose.connect(db);
		console.log("MongoDB connected...");
	} catch (err) {
		console.log(err);
		process.exit(1);
	}
};

// Define User schema (copy from models/user.js)
const userSchema = new mongoose.Schema({
	firstName: String,
	lastName: String,
	email: String,
	password: String,
	phone: String,
	dl: String,
	role: {
		type: String,
		enum: ["admin", "customer", "mechanic", "fueldeliveryboy"],
		default: "customer"
	},
	createdAt: {
		type: Date,
		default: Date.now
	}
});

const User = mongoose.model("User", userSchema);

// Create admin account
const createAdminAccount = async () => {
	try {
		// Check if admin already exists
		const existingAdmin = await User.findOne({ email: "admin@yandex.com" });
		if (existingAdmin) {
			console.log("Admin account already exists!");
			process.exit(0);
		}

		// Create new admin account
		const adminUser = new User({
			firstName: "Admin",
			lastName: "User",
			email: "admin@yandex.com",
			phone: "9999999999",
			password: "admin@123",
			role: "admin"
		});

		// Hash the password
		const salt = bcrypt.genSaltSync(10);
		const hash = bcrypt.hashSync(adminUser.password, salt);
		adminUser.password = hash;

		// Save to database
		await adminUser.save();
		console.log("✅ Admin account created successfully!");
		console.log("Email: admin@yandex.com");
		console.log("Password: admin@123");
		process.exit(0);
	} catch (err) {
		console.error("Error creating admin account:", err);
		process.exit(1);
	}
};

// Run the script
connectDB().then(() => {
	createAdminAccount();
});
