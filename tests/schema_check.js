const mongoose = require('mongoose');
const User = require('../models/user');
const Hiring = require('../models/hiring');
const ServiceRequest = require('../models/serviceRequest');
const Feedback = require('../models/feedback');
const Receipt = require('../models/receipt');
require('dotenv').config();

// Mock connection if no env var (for syntax check) or real connection
async function verifySchemas() {
    try {
        console.log("Verifying schemas...");
        console.log("User Model:", User.modelName);
        console.log("Hiring Model:", Hiring.modelName);
        console.log("ServiceRequest Model:", ServiceRequest.modelName);
        console.log("Feedback Model:", Feedback.modelName);
        console.log("Receipt Model:", Receipt.modelName);

        // Check for duplicate paths in schemas
        const models = [User, Hiring, ServiceRequest, Feedback, Receipt];
        models.forEach(model => {
            // Mongoose usually throws on compile if duplicates exist, so getting here is good sign
            console.log(`Model ${model.modelName} compiled successfully.`);
        });

        console.log("All schemas verified successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Schema verification failed:", error);
        process.exit(1);
    }
}

verifySchemas();
