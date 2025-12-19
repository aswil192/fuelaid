const express = require("express");
const router = express.Router();
const middleware = require("../middleware/index.js");
const User = require("../models/user.js");
const ServiceRequest = require("../models/serviceRequest.js");
const PDFDocument = require('pdfkit'); // For PDF generation
const fs = require('fs');
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const haversine = require("haversine-distance");
const opencage = require("opencage-api-client");

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function(req, file, cb) {
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

router.get("/mechanic/dashboard", middleware.ensuremechanicLoggedIn, async (req, res) => {
	try {
		const mechanicId = req.user._id; // Assuming logged-in mechanic's ID is stored here
	
	
		const mechanic = await User.findById(mechanicId);
		if (!mechanic || mechanic.role !== 'mechanic') {
		  return res.status(403).send('Unauthorized');
		}
	
	
		const completedRequests = await ServiceRequest.find({
		  mechanicId,
		  status: 'completed'
		});
	
		const pendingRequests = await ServiceRequest.find({
		  mechanicId,
		  status: 'requested'
		});
	
	
	
		res.render("mechanic/dashboard", {
		  mechanic,
		  numCompRequests: completedRequests.length,
		  numPendingRequests: pendingRequests.length
		//   distanceTravelled: distanceTravelled.toFixed(2)
		});
	
	  } catch (error) {
		console.error('Dashboard error:', error);
		res.status(500).send('Server error');
	  }
  });
  
  

router.get("/mechanic/profile", middleware.ensuremechanicLoggedIn, (req,res) => {
	res.render("mechanic/profile", { title: "My Profile" });
});

router.put("/mechanic/profile", upload.single('profilePic'), middleware.ensuremechanicLoggedIn, async (req, res) => {
    try {
        const id = req.user._id;
        const updateObj = req.body.mechanic;  // updateObj: {firstName, lastName, gender, address, phone}
		if (req.file) {
            updateObj.profilePic = `/uploads/${req.file.filename}`;
        }

        
        // Geocode the updated address
        const geo = await geocodeAddress(updateObj.address);
        
        if (geo) {
            // If geocoding is successful, add latitude and longitude to the update object
            updateObj.latitude = geo.latitude;
            updateObj.longitude = geo.longitude;
        } else {
            // If geocoding fails, set latitude and longitude to null (optional, based on your requirements)
            updateObj.latitude = null;
            updateObj.longitude = null;
        }

        // Update the mechanic's profile
        await User.findByIdAndUpdate(id, updateObj);

        req.flash("success", "Profile updated successfully");
        res.redirect("/mechanic/profile");
    } catch (err) {
        console.log(err);
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

router.get("/mechanic/viewRequests", middleware.ensuremechanicLoggedIn, middleware.ensuremechanicVerified, async (req, res) => {
	try {
		const mechanicLocation = {
			lat: req.user.latitude,
			lon: req.user.longitude
		};

		if (!mechanicLocation.lat || !mechanicLocation.lon) {
			return res.render('mechanic/viewRequests', { 
				title: "View Requests",
				requestedServices: [],
				error: "Please enable location services." 
			});
		}

		const mechanicAvailability = req.user.availability; // e.g., "10am-6pm"

		const requestedServices = await ServiceRequest.find({ status: "requested" })
			.populate('customer', 'firstName lastName phone address');

		const filteredServices = requestedServices
			.filter(service => {
				const createdAt = new Date(service.createdAt);
				const isNonFuel = service.serviceCategory?.toLowerCase() !== 'fuel';
				const withinTimeLimit = isWithinLastNMinutes(createdAt, 20);
				const matchesAvailability = isTimeWithinRange(createdAt, mechanicAvailability);

				return isNonFuel && withinTimeLimit && matchesAvailability;
			})
			.map(service => {
				const customerLocation = {
					lat: service.latitude,
					lon: service.longitude
				};

				const distance = haversine(mechanicLocation, customerLocation); // meters

				return {
					...service.toObject(),
					distance
				};
			})
			.filter(service => service.distance <= 100000) // 100 km max
			.sort((a, b) => {
				if (a.distance !== b.distance) return a.distance - b.distance;
				return new Date(b.createdAt) - new Date(a.createdAt);
			});

		res.render("mechanic/viewRequests", {
			title: "View Requests",
			requestedServices: filteredServices
		});

	} catch (err) {
		console.error(err);
		req.flash("error", "Error retrieving service requests.");
		res.redirect("back");
	}
});

// function convertTo24Hour(timeStr) {
// 	const [time, meridian] = timeStr.toLowerCase().split(/(am|pm)/);
// 	let [hours, minutes] = time.split(':');
// 	minutes = minutes || '00';
// 	hours = parseInt(hours);
// 	if (meridian === 'pm' && hours !== 12) hours += 12;
// 	if (meridian === 'am' && hours === 12) hours = 0;
// 	return `${String(hours).padStart(2, '0')}:${minutes}`;
//   }
  
//   function isTimeWithinRange(requestDate, rangeStr) {
// 	const [start, end] = rangeStr.split('-').map(t => convertTo24Hour(t));
// 	const reqTime = requestDate.toTimeString().slice(0, 5); // 'HH:MM'
// 	return reqTime >= start && reqTime <= end;
//   }

  
//   router.get("/mechanic/viewRequests", middleware.ensuremechanicLoggedIn, async (req, res) => {
// 	try {
// 	  // Update mechanic's location before fetching requests (if needed)
// 	  const mechanicLocation = {
// 		lat: req.user.latitude,
// 		lon: req.user.longitude
// 	  };

// 	  if (!mechanicLocation.lat || !mechanicLocation.lon) {
// 		// If location is missing, ask for it (you can also update this on the frontend)
// 		res.render('mechanic/viewRequests', { 
// 		  title: "View Requests",
// 		  error: "Please enable location services." 
// 		});
// 		return; // Exit early to avoid reloading the same page
// 	  }
  
// 	  // Get mechanic's availability (e.g., "10am-8pm")
// 	  const mechanicAvailability = req.user.availability; 
  
// 	  // Fetch requested service requests
// 	  const requestedServices = await ServiceRequest.find({ status: "requested" }).populate('customer', 'firstName lastName phone address');
  
// 	  // Filter services based on the mechanic's availability and category
// 	  const filteredServices = requestedServices
// 		.filter(service => {
// 		  return (
// 			service.serviceCategory?.toLowerCase() !== 'fuel' &&
// 			isTimeWithinRange(service.createdAt, mechanicAvailability) // Ensure request time falls within the mechanic's availability
// 		  );
// 		})
// 		.map(service => {
// 		  const customerLocation = {
// 			lat: service.latitude,
// 			lon: service.longitude
// 		  };
  
// 		  // Calculate the distance between mechanic and customer
// 		  const distance = haversine(mechanicLocation, customerLocation);
  
// 		  // Return the service with the distance included
// 		  return {
// 			...service.toObject(),
// 			distance
// 		  };
// 		})
// 		.sort((a, b) => {
// 		  // First, sort by distance, then by the time the request was created (newest first)
// 		  if (a.distance !== b.distance) return a.distance - b.distance;
// 		  return new Date(b.createdAt) - new Date(a.createdAt);
// 		});
  
// 	  // Render the view with filtered services
// 	  res.render("mechanic/viewRequests", {
// 		title: "View Requests",
// 		requestedServices: filteredServices
// 	  });
	  
// 	} catch (err) {
// 	  console.error(err);
// 	  req.flash("error", "Error retrieving service requests.");
// 	  res.redirect("back");
// 	}
//   });

  router.post("/mechanic/updateLocation", middleware.ensuremechanicLoggedIn, async (req, res) => {
	try {
	  // Get the location from the request body
	  const { latitude, longitude } = req.body;
  
	  // Update mechanic's location in the User schema
	  const mechanic = await User.findByIdAndUpdate(req.user._id, { latitude, longitude }, { new: true });
  
	  // Optionally, log them in again to refresh the session with updated data
	  req.login(mechanic, (err) => {
		if (err) {
		  console.error("Error during login after location update:", err);
		  res.status(500).send("Location update failed.");
		  return;
		}
		res.send("Location updated successfully.");
	  });
	} catch (err) {
	  console.error("Error updating mechanic location:", err);
	  res.status(500).send("Failed to update location.");
	}
  });
  
  
// Mechanic accepts a service request
router.post("/mechanic/service/accept/:id", middleware.ensuremechanicLoggedIn, async (req, res) => {
	try {
		const request = await ServiceRequest.findById(req.params.id);
		if (!request) {
			req.flash("error", "Service request not found.");
			return res.redirect("/mechanic/viewRequests");
		}

		// Update status and assign mechanic
		request.status = "accepted";
		request.mechanic = req.user._id;
		await request.save();

		req.flash("success", "You have accepted the service request.");
		res.redirect("/mechanic/viewRequests");
	} catch (err) {
		console.error(err);
		req.flash("error", "Error processing the acceptance.");
		res.redirect("/mechanic/viewRequests");
	}
});

// Mechanic rejects a service request
router.post("/mechanic/service/reject/:id", middleware.ensuremechanicLoggedIn, async (req, res) => {
	try {
		const request = await ServiceRequest.findById(req.params.id);
		if (!request) {
			req.flash("error", "Service request not found.");
			return res.redirect("/mechanic/viewRequests");
		}

		// Reset status and remove mechanic assignment
		request.status = "requested";
		request.mechanic = null;
		await request.save();

		req.flash("success", "You have rejected the request. It's available for others now.");
		res.redirect("/mechanic/viewRequests");
	} catch (err) {
		console.error(err);
		req.flash("error", "Error processing the rejection.");
		res.redirect("/mechanic/viewRequests");
	}
});


router.get("/mechanic/accepted", middleware.ensuremechanicLoggedIn, async (req, res) => {
	try {
	  // Fetch all services that are accepted and assigned to the current mechanic
	  const acceptedServices = await ServiceRequest.find({
		status: "accepted",
		mechanic: req.user._id // Assuming only the logged-in mechanic's accepted requests should be shown
	  }).populate('customer', 'firstName lastName phone address');
  
	  res.render("mechanic/accepted", {
		title: "Accepted Requests",
		acceptedServices
	  });
	} catch (err) {
	  console.error(err);
	  req.flash("error", "Error retrieving accepted service requests.");
	  res.redirect("back");
	}
  });

  router.get("/mechanic/completed", middleware.ensuremechanicLoggedIn, async (req, res) => {
	try {
	  // Fetch all services that are accepted and assigned to the current mechanic
	  const completedServices = await ServiceRequest.find({
		status: "completed",
		mechanic: req.user._id // Assuming only the logged-in mechanic's accepted requests should be shown
	  }).populate('customer', 'firstName lastName phone address');
  
	  res.render("mechanic/completed", {
		title: "Completed Requests",
		completedServices
	  });
	} catch (err) {
	  console.error(err);
	  req.flash("error", "Error retrieving completed service requests.");
	  res.redirect("back");
	}
  });

  router.post("/mechanic/service/complete/:id", middleware.ensuremechanicLoggedIn, async (req, res) => {
	try {
	  const serviceId = req.params.id;
  
	  // Find the service by ID and check if it's assigned to the current mechanic
	  const service = await ServiceRequest.findOne({
		_id: serviceId,
		mechanic: req.user._id,
		status: "accepted"
	  });
  
	  if (!service) {
		req.flash("error", "Service not found or not authorized.");
		return res.redirect("back");
	  }
  
	  service.completedAt = new Date();  // Set this when the mechanic completes the service

	  // Update status to 'completed'
	  service.status = "completed";
	  await service.save();
  
	  req.flash("success", "Service marked as completed.");
	  res.redirect("/mechanic/accepted");
	} catch (err) {
	  console.error(err);
	  req.flash("error", "Error marking service as completed.");
	  res.redirect("back");
	}
  });

  router.post("/mechanic/service/inprogress/:id", middleware.ensuremechanicLoggedIn, async (req, res) => {
	try {
	  const service = await ServiceRequest.findById(req.params.id);
	  if (!service) {
		req.flash("error", "Service request not found.");
		return res.redirect("back");
	  }
  
	  service.status = "in-progress";
	  await service.save();
  
	  req.flash("success", "Service marked as In-Progress.");
	  res.redirect("/mechanic/accepted");
	} catch (err) {
	  console.error(err);
	  req.flash("error", "Something went wrong.");
	  res.redirect("back");
	}
  });
  
  router.post('/mechanic/note/:id', middleware.ensuremechanicLoggedIn, async (req, res) => {
	try {
	  const serviceId = req.params.id;
	  const { mechanicNote } = req.body;
  
	  await ServiceRequest.findByIdAndUpdate(serviceId, { mechanicNote });
  
	  res.status(200).json({ message: 'Note saved' });
	} catch (err) {
	  console.error(err);
	  res.status(500).json({ error: 'Failed to save note' });
	}
  });
  
  
  router.get("/mechanic/liveTrack", middleware.ensuremechanicLoggedIn, async (req, res) => {
	try {
	  const mechanicId = req.user._id;
  
	  // Fetch all service requests assigned to this mechanic
	  const requests = await ServiceRequest.find({ mechanic: mechanicId, status: { $in: ["accepted", "in-progress"]} })
		.populate("customer") // so you can show customer info if needed
		.populate("mechanic")
		.sort({ createdAt: -1 });
  
	  res.render("mechanic/liveTrack", {
		currentUser: req.user,
		requests,
	  });
	} catch (err) {
	  console.error("Error fetching mechanic tracking info:", err);
	  res.status(500).send("Server error");
	}
  });
  
module.exports = router;