const mongoose = require("mongoose");
const geolib = require('geolib');
require('dotenv').config();

// Connect to DB
const connectDB = async () => {
    try {
        const db = process.env.MONGO_URI;
        await mongoose.connect(db);
        console.log("MongoDB connected...");
    } catch (err) {
        console.log("DB Connection Error:", err);
        process.exit(1);
    }
};

// Models
const User = require("./models/user.js");
const ServiceRequest = require("./models/serviceRequest.js");

async function debug() {
    await connectDB();

    try {
        console.log("Fetching fuel requests...");
        const fuelRequests = await ServiceRequest.find({ serviceCategory: "fuel", status: "requested" }).populate("customer");
        console.log(`Found ${fuelRequests.length} fuel requests.`);

        const fuelBoys = await User.find({ role: "fueldeliveryboy" });
        console.log(`Found ${fuelBoys.length} fuel boys.`);

        const updatedFuelRequests = [];

        for (let service of fuelRequests) {
            console.log(`Processing service request: ${service._id}`);
            console.log(`Service Location: ${service.latitude}, ${service.longitude}`);

            const serviceLocation = {
                latitude: service.latitude,
                longitude: service.longitude
            };

            const boysWithDistance = await Promise.all(
                fuelBoys.map(async (boy) => {
                    const ongoingDelivery = await ServiceRequest.findOne({
                        fueldeliveryboy: boy._id,
                        status: { $in: ["accepted", "assigned"] }
                    });

                    console.log(`Checking Fuel Boy ${boy._id} (${boy.firstName}). Location: ${boy.latitude}, ${boy.longitude}`);

                    const boyLocation = {
                        latitude: boy.latitude,
                        longitude: boy.longitude
                    };


                    // Fix: Check for valid coordinates
                    let distance = Infinity;
                    if (
                        serviceLocation.latitude != null && serviceLocation.longitude != null &&
                        boyLocation.latitude != null && boyLocation.longitude != null
                    ) {
                        try {
                            distance = geolib.getDistance(serviceLocation, boyLocation) / 1000; // in km
                        } catch (e) {
                            console.log("Error calculating distance:", e.message);
                        }
                    } else {
                        console.log("Missing coordinates for calculation.");
                    }

                    return {
                        _id: boy._id,
                        firstName: boy.firstName,
                        lastName: boy.lastName,
                        address: boy.address,
                        phone: boy.phone,
                        status: ongoingDelivery ? "Busy" : "Free",
                        distance: parseFloat(distance.toFixed(2))
                    };
                })
            );

            // Filter those within 50 km
            const nearbyBoys = boysWithDistance.filter(boy => boy.distance <= 50);

            // Sort: Free first, then by distance
            nearbyBoys.sort((a, b) => {
                if (a.status === b.status) {
                    return a.distance - b.distance;
                }
                return a.status === "Free" ? -1 : 1;
            });

            updatedFuelRequests.push({
                ...service._doc,
                fuelBoys: nearbyBoys
            });
        }
        console.log("Successfully processed all requests.");

    } catch (err) {
        console.log("CAUGHT ERROR:");
        console.error(err);
    } finally {
        console.log("Closing connection.");
        await mongoose.disconnect();
    }
}

debug();
