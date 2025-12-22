const express = require("express");
const router = express.Router();
const middleware = require("../middleware/index.js");
const User = require("../models/user.js");
const ServiceRequest = require("../models/serviceRequest.js");
const Payment = require("../models/payment.js");
const PDFDocument = require('pdfkit'); // For PDF generation
const fs = require('fs');
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const haversine = require("haversine-distance");
const opencage = require("opencage-api-client");

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'public/uploads/');
	},
	filename: function (req, file, cb) {
		cb(null, Date.now() + path.extname(file.originalname)); // e.g., 1711111.png
	}
});

const upload = multer({ storage: storage });

async function geocodeAddress(address) {
	try {
		const data = await opencage.geocode({ q: address, key: process.env.OPENCAGE_API_KEY });

		if (data && data.results && data.results.length > 0) {
			const { lat, lng } = data.results[0].geometry;
			return { latitude: lat, longitude: lng };
		} else {
			throw new Error("No geocode results found.");
		}
	} catch (error) {
		console.error("Geocoding error:", error.message);
		return null;
	}
}

router.get("/fueldeliveryboy/dashboard", middleware.ensurefueldeliveryboyLoggedIn, async (req, res) => {
	try {
		const fuelId = req.user._id;

		const fueldeliveryboy = await User.findById(fuelId);
		if (!fueldeliveryboy || fueldeliveryboy.role !== 'fueldeliveryboy') {
			return res.status(403).send('Unauthorized');
		}

		// Get completed jobs count
		const completedJobs = await ServiceRequest.countDocuments({
			fueldeliveryboy: fuelId,
			status: 'completed'
		});

		// Get pending/assigned jobs count
		const pendingJobs = await ServiceRequest.countDocuments({
			fueldeliveryboy: fuelId,
			status: 'assigned',
			serviceCategory: 'fuel'
		});

		// Get accepted/active jobs count
		const acceptedJobs = await ServiceRequest.countDocuments({
			fueldeliveryboy: fuelId,
			status: { $in: ['accepted', 'in-progress'] }
		});

		// Calculate average rating (default to 5.0 if no ratings yet)
		const rating = fueldeliveryboy.rating || 5.0;

		res.render("fueldeliveryboy/dashboard", {
			fueldeliveryboy,
			completedJobs,
			pendingJobs,
			acceptedJobs,
			rating
		});

	} catch (error) {
		console.error('Dashboard error:', error);
		res.status(500).send('Server error');
	}
});

router.get("/fueldeliveryboy/profile", middleware.ensurefueldeliveryboyLoggedIn, (req, res) => {
	res.render("fueldeliveryboy/profile", { title: "My Profile" });
});

router.put("/fueldeliveryboy/profile", upload.single('profilePic'), middleware.ensurefueldeliveryboyLoggedIn, async (req, res) => {
	try {
		const id = req.user._id;
		const updateObj = req.body.fueldeliveryboy || {};  // Get fueldeliveryboy object or empty object

		// If updateObj is still empty, get all body fields
		if (Object.keys(updateObj).length === 0) {
			Object.assign(updateObj, req.body);
		}

		// Remove empty strings to avoid unique constraint violations (e.g., licensePlate: "")
		Object.keys(updateObj).forEach(key => {
			if (updateObj[key] === "") {
				delete updateObj[key];
			}
		});

		// Handle profile picture
		if (req.file) {
			updateObj.profilePic = `/uploads/${req.file.filename}`;
		}

		// Geocode the updated address if it exists
		if (updateObj.address) {
			const geo = await geocodeAddress(updateObj.address);

			if (geo) {
				updateObj.latitude = geo.latitude;
				updateObj.longitude = geo.longitude;
			} else {
				updateObj.latitude = null;
				updateObj.longitude = null;
			}
		}

		// Update the fuel delivery boy's profile
		await User.findByIdAndUpdate(id, updateObj);

		req.flash("success", "Profile updated successfully");
		res.redirect("/fueldeliveryboy/profile");
	} catch (err) {
		console.log("Profile update error:", err);
		req.flash("error", "Some error occurred on the server.");
		res.redirect("back");
	}
});

function convertTo24Hour(timeStr) {
	const [time, meridian] = timeStr.toLowerCase().split(/(am|pm)/);
	let [hours, minutes] = time.split(':');
	minutes = minutes || '00';
	hours = parseInt(hours);
	if (meridian === 'pm' && hours !== 12) hours += 12;
	if (meridian === 'am' && hours === 12) hours = 0;
	return `${String(hours).padStart(2, '0')}:${minutes}`;
}

function isTimeWithinRange(requestDate, rangeStr) {
	const [start, end] = rangeStr.split('-').map(t => convertTo24Hour(t));
	const reqTime = requestDate.toTimeString().slice(0, 5); // 'HH:MM'
	return reqTime >= start && reqTime <= end;
}
function isWithinLastNMinutes(date, minutes) {
	const now = new Date();
	return (now - new Date(date)) / (1000 * 60) <= minutes;
}

router.get("/fueldeliveryboy/viewRequests", middleware.ensurefueldeliveryboyLoggedIn, async (req, res) => {
	try {
		// Update fuel delivery boy's location before fetching requests (if needed)
		const fuelLocation = {
			lat: req.user.latitude,
			lon: req.user.longitude
		};

		if (!fuelLocation.lat || !fuelLocation.lon) {
			// If location is missing, ask for it (you can also update this on the frontend)
			res.render('fueldeliveryboy/viewRequests', {
				title: "View Requests",
				error: "Please enable location services."
			});
			return; // Exit early to avoid reloading the same page
		}

		//   Get fuel delivery boy's availability (e.g., "10am-8pm")
		const fuelAvailability = req.user.availability;
		const allFuelRequests = await ServiceRequest.find({ serviceCategory: "fuel", status: "assigned", fueldeliveryboy: req.user._id, });

		// Fetch requested services with populated customer data
		const requestedServices = await ServiceRequest.find({
			status: "assigned", // Only assigned to the fuel delivery boy
			fueldeliveryboy: req.user._id, // Specifically for this fuel delivery boy
			serviceCategory: "fuel" // Only fuel-related services
		}).populate('customer', 'firstName lastName phone address');

		// Filter services based on the fuel delivery boy's availability and category
		const filteredServices = requestedServices
			.filter(service => {
				return (
					service.serviceCategory?.toLowerCase() === 'fuel' &&
					isTimeWithinRange(service.createdAt, fuelAvailability) // Ensure request time falls within the mechanic's availability
				);
			})
			.map(service => {
				const customerLocation = {
					lat: service.latitude,
					lon: service.longitude
				};

				// Calculate the distance between fuel delivery boy and customer
				const distance = haversine(fuelLocation, customerLocation);

				// Return the service with the distance included
				return {
					...service.toObject(),
					distance
				};
			})
			.sort((a, b) => {
				// First, sort by distance, then by the time the request was created (newest first)
				if (a.distance !== b.distance) return a.distance - b.distance;
				return new Date(b.createdAt) - new Date(a.createdAt);
			});

		// Render the view with filtered services
		res.render("fueldeliveryboy/viewRequests", {
			title: "View Requests",
			requestedServices: requestedServices
		});

	} catch (err) {
		console.error(err);
		req.flash("error", "Error retrieving service requests.");
		res.redirect("back");
	}
});

router.post("/fueldeliveryboy/updateLocation", middleware.ensurefueldeliveryboyLoggedIn, async (req, res) => {
	try {
		// Get the location from the request body
		const { latitude, longitude } = req.body;

		// Update fueldeliveryboy's location in the User schema
		const fueldeliveryboy = await User.findByIdAndUpdate(req.user._id, { latitude, longitude }, { new: true });

		// Optionally, log them in again to refresh the session with updated data
		req.login(fueldeliveryboy, (err) => {
			if (err) {
				console.error("Error during login after location update:", err);
				res.status(500).send("Location update failed.");
				return;
			}
			res.send("Location updated successfully.");
		});
	} catch (err) {
		console.error("Error updating fueldeliveryboy location:", err);
		res.status(500).send("Failed to update location.");
	}
});
// fueldeliveryboy accepts a service request
// router.post("/fueldeliveryboy/service/accept/:id", middleware.ensurefueldeliveryboyLoggedIn, async (req, res) => {
// 	try {
// 		const request = await ServiceRequest.findById(req.params.id);
// 		if (!request) {
// 			req.flash("error", "Service request not found.");
// 			return res.redirect("/fueldeliveryboy/viewRequests");
// 		}

// 		// Update status and assign fueldeliveryboy
// 		request.status = "accepted";
// 		request.fueldeliveryboy = req.user._id;
// 		await request.save();

// 		req.flash("success", "You have accepted the service request.");
// 		res.redirect("/fueldeliveryboy/viewRequests");
// 	} catch (err) {
// 		console.error(err);
// 		req.flash("error", "Error processing the acceptance.");
// 		res.redirect("/fueldeliveryboy/viewRequests");
// 	}
// });

// // fueldeliveryboy rejects a service request
// router.post("/fueldeliveryboy/service/reject/:id", middleware.ensurefueldeliveryboyLoggedIn, async (req, res) => {
// 	try {
// 		const request = await ServiceRequest.findById(req.params.id);
// 		if (!request) {
// 			req.flash("error", "Service request not found.");
// 			return res.redirect("/fueldeliveryboy/viewRequests");
// 		}

// 		// Reset status and remove fueldeliveryboy assignment
// 		request.status = "requested";
// 		request.fueldeliveryboy = null;
// 		await request.save();

// 		req.flash("success", "You have rejected the request. It's available for others now.");
// 		res.redirect("/fueldeliveryboy/viewRequests");
// 	} catch (err) {
// 		console.error(err);
// 		req.flash("error", "Error processing the rejection.");
// 		res.redirect("/fueldeliveryboy/viewRequests");
// 	}
// });


router.get("/fueldeliveryboy/accepted", middleware.ensurefueldeliveryboyLoggedIn, async (req, res) => {
	try {
		// Fetch all services that are accepted and assigned to the current fueldeliveryboy
		const acceptedServices = await ServiceRequest.find({
			status: "accepted",
			fueldeliveryboy: req.user._id, // Assuming only the logged-in fueldeliveryboy's accepted requests should be shown
			serviceCategory: "fuel"
		}).populate('customer', 'firstName lastName phone address');

		res.render("fueldeliveryboy/accepted", {
			title: "Accepted Requests",
			acceptedServices
		});
	} catch (err) {
		console.error(err);
		req.flash("error", "Error retrieving accepted service requests.");
		res.redirect("back");
	}
});

router.get("/fueldeliveryboy/completed", middleware.ensurefueldeliveryboyLoggedIn, async (req, res) => {
	try {
		// Fetch all services that are accepted and assigned to the current mechanic
		const completedServices = await ServiceRequest.find({
			status: "completed",
			fueldeliveryboy: req.user._id // Assuming only the logged-in mechanic's accepted requests should be shown
		}).populate('customer', 'firstName lastName phone address');

		res.render("fueldeliveryboy/completed", {
			title: "Completed Requests",
			completedServices
		});
	} catch (err) {
		console.error(err);
		req.flash("error", "Error retrieving completed service requests.");
		res.redirect("back");
	}
});

router.post("/fueldeliveryboy/service/complete/:id", middleware.ensurefueldeliveryboyLoggedIn, async (req, res) => {
	try {
		const serviceId = req.params.id;

		// Find the service by ID and check if it's assigned to the current fueldeliveryboy
		const service = await ServiceRequest.findOne({
			_id: serviceId,
			fueldeliveryboy: req.user._id,
			status: "accepted"
		});

		if (!service) {
			req.flash("error", "Service not found or not authorized.");
			return res.redirect("back");
		}
		service.completedAt = new Date();  // Set this when the fueldeliveryboy completes the service
		// Update status to 'completed'
		service.status = "completed";
		await service.save();

		req.flash("success", "Service marked as completed.");
		res.redirect("/fueldeliveryboy/accepted");
	} catch (err) {
		console.error(err);
		req.flash("error", "Error marking service as completed.");
		res.redirect("back");
	}
});

router.post("/fueldeliveryboy/service/inprogress/:id", middleware.ensurefueldeliveryboyLoggedIn, async (req, res) => {
	try {
		const service = await ServiceRequest.findById(req.params.id);
		if (!service) {
			req.flash("error", "Service request not found.");
			return res.redirect("back");
		}

		service.status = "in-progress";
		await service.save();

		req.flash("success", "Service marked as In-Progress.");
		res.redirect("/fueldeliveryboy/accepted");
	} catch (err) {
		console.error(err);
		req.flash("error", "Something went wrong.");
		res.redirect("back");
	}
});

router.post('/fueldeliveryboy/note/:id', middleware.ensurefueldeliveryboyLoggedIn, async (req, res) => {
	try {
		const serviceId = req.params.id;
		const { fuelNote } = req.body;

		await ServiceRequest.findByIdAndUpdate(serviceId, { fuelNote });

		res.status(200).json({ message: 'Note saved' });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Failed to save note' });
	}
});


router.get("/fueldeliveryboy/liveTrack", middleware.ensurefueldeliveryboyLoggedIn, async (req, res) => {
	try {
		const fuelId = req.user._id;

		// Fetch all service requests assigned to this mechanic
		const requests = await ServiceRequest.find({
			fueldeliveryboy: fuelId,
			status: { $in: ["accepted", "in-progress"] }
		})
			.populate("customer") // so you can show customer info if needed
			.populate("fueldeliveryboy")
			.sort({ createdAt: -1 });

		res.render("fueldeliveryboy/liveTrack", {
			currentUser: req.user,
			requests,
		});
	} catch (err) {
		console.error("Error fetching fuel delivery boy tracking info:", err);
		res.status(500).send("Server error");
	}
});

// Fuel Delivery Boy Earnings Page
router.get("/fueldeliveryboy/earnings", middleware.ensurefueldeliveryboyLoggedIn, async (req, res) => {
	try {
		const fuelId = req.user._id;

		// Get completed jobs count
		const completedJobs = await ServiceRequest.countDocuments({
			fueldeliveryboy: fuelId,
			status: 'completed'
		});

		// Get recent payments
		const recentPayments = await Payment.find({
			provider: fuelId,
			status: 'completed'
		})
		.populate('serviceRequest', 'serviceCategory')
		.sort({ paidAt: -1 })
		.limit(10);

		res.render("fueldeliveryboy/earnings", {
			title: "My Earnings",
			completedJobs,
			recentPayments
		});
	} catch (err) {
		console.error("Error fetching earnings:", err);
		req.flash("error", "Error loading earnings page.");
		res.redirect("/fueldeliveryboy/dashboard");
	}
});

module.exports = router;