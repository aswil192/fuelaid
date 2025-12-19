const express = require("express");
const router = express.Router();
const middleware = require("../middleware/index.js");
const User = require("../models/user.js");
const ServiceRequest = require("../models/serviceRequest");
// const multer = require('multer');
// const mongoose = require('mongoose');
const { ExifImage } = require('exif');  // For extracting EXIF data to check geotag

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // or wherever you're storing files
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

const opencage = require("opencage-api-client");

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

router.get("/customer/dashboard", middleware.ensurecustomerLoggedIn, async (req,res) => {
	const customerId = req.user._id;
	const numPendingDonations = await ServiceRequest.countDocuments({ customer: customerId, status: "requested" });
	const numAcceptedDonations = await ServiceRequest.countDocuments({ customer: customerId, status: "accepted" });
	// const numAssignedDonations = await Donation.countDocuments({ customer: customerId, status: "assigned" });
	const numCollectedDonations = await ServiceRequest.countDocuments({ customer: customerId, status: "completed" });
	res.render("customer/dashboard", {
		title: "Dashboard",
		numPendingDonations, numAcceptedDonations, numCollectedDonations
	});
});
router.get("/customer/request-service", middleware.ensurecustomerLoggedIn, middleware.ensurecustomerVerified, (req, res) => {
    res.render("customer/request-service", { title: "Donate" });
});

router.post("/customer/request-service", upload.single("vehiclePhotoPath"), async (req, res) => {
	try {
		const {
			serviceCategory,
			subServices,
			quantity,
			address,
			phone,
			customerToMechanicMsg
		} = req.body.request;

		// Define base charges
const baseCharges = {
	"Battery Jump Start": 300,
	"Flat Tyre Repair": 250,
	"Lockout Assistance": 200,
	"Minor Repairs": 400,
	"Towing Services": 700,
	"Vehicle Custody": 150,
	"Periodic Maintenance": 600,
	"Vehicle Repair": 700,
	"Accessory Fitment": 500,
	"Engine Repair": 1000,
	// Fuel services
	"Petrol Delivery": 250, // Delivery base charge
	"Diesel Delivery": 250,
	"Fuel Tank Cleaning": 500,
	"Fuel Quality Testing": 300
  };
  
  // Split subservices string into array
  const subServicesArray = subServices.split(',');
  console.log(subServicesArray);
  
  // Calculate baseAmount
  let baseAmount = 0;
  subServicesArray.forEach(service => {
	if (baseCharges[service]) {
	  baseAmount += baseCharges[service];
	}
  });
  
		const geo= await geocodeAddress(address);

  if (!geo) {
    req.flash("error", "Unable to geocode your address.");
    return res.redirect("back");
  }
		// const subServicesArray = subServices.split(',');

		const newRequest = new ServiceRequest({
			customer: req.user._id,
			serviceCategory,
			subServices: subServicesArray,
			quantity: quantity || undefined,
			address,
			latitude: geo.latitude,
			longitude: geo.longitude,
			phone,
			vehiclePhotoPath: req.file ? req.file.path : undefined,
			customerToMechanicMsg,
			status: "requested",
			isFuelRequest: serviceCategory === "fuel",
			baseAmount: baseAmount
		});

		await newRequest.save();
		req.flash("success", "Request sent successfully.");
		// }

		res.redirect("/customer/services/requested");
	} catch (error) {
		console.error("Error submitting service request:", error);
		res.status(500).send("Something went wrong.");
	}
});

router.get("/customer/services/requested", middleware.ensurecustomerLoggedIn, async (req,res) => {
	try
	{
		const requestedServices = await ServiceRequest.find({
            customer: req.user._id,
            status: "requested"
        }).populate("mechanic"); // Optional: populate assigned mechanic if needed

        res.render("customer/requestedServices", {
            title: "Requested Services",
            requestedServices
        });
	}
	catch(err)
	{
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});



router.get("/customer/profile", middleware.ensurecustomerLoggedIn, (req,res) => {
	res.render("customer/profile", { title: "My Profile" });
});

router.put("/customer/profile", middleware.ensurecustomerLoggedIn, async (req,res) => {
	try
	{
		const id = req.user._id;
		const updateObj = req.body.customer;	// updateObj: {firstName, lastName, gender, address, phone}
		await User.findByIdAndUpdate(id, updateObj);
		
		req.flash("success", "Profile updated successfully");
		res.redirect("/customer/profile");
	}
	catch(err)
	{
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
	
});



  router.get("/customer/track", middleware.ensurecustomerLoggedIn, async (req, res) => {
	try {
	  const customerId = req.user._id;
		
	  // Fetch all requests made by customer
	  const requests = await ServiceRequest.find({ customer: customerId, status: { $ne: "requested" }})
		.populate("mechanic") // includes mechanic details
		.populate("fueldeliveryboy")
		.sort({ createdAt: -1 });

		// console.log("Fetched Requests:", requests);
		
		requests.forEach((request) => {
			if (request.mechanic) {
				request.providerType = "mechanic";
				request.providerId = request.mechanic._id;
				request.providerName = `${request.mechanic.firstName} ${request.mechanic.lastName}`;
			} else if (request.fueldeliveryboy) {
				request.providerType = "fuel";
				request.providerId = request.fueldeliveryboy._id;
				request.providerName = `${request.fueldeliveryboy.firstName} ${request.fueldeliveryboy.lastName}`;
			}
		});		

		// console.log("Requests with provider info:", requests); // 🔍 Confirm provider info is added

	  res.render("customer/track", {
		currentUser: req.user,
		requests,
	  });
	} catch (err) {
	  console.error("Error fetching tracking info:", err);
	  res.status(500).send("Server error");
	}
  });
  
  router.get("/mechanic-location/:id", async (req, res) => {
	try {
	  const mechanic = await User.findById(req.params.id);
	  if (!mechanic || !mechanic.latitude || !mechanic.longitude) {
		return res.status(404).json({ message: "Mechanic not found or missing location" });
	  }
  
	  res.json({
		lat: mechanic.latitude,
		lng: mechanic.longitude,
		name: `${mechanic.firstName} ${mechanic.lastName}`
	  });
	} catch (err) {
	  console.error("Error in mechanic-location API:", err);
	  res.status(500).json({ message: "Server error" });
	}
  });

  router.get("/fuel-location/:id", async (req, res) => {
	try {
	  const fueldeliveryboy = await User.findById(req.params.id);
	  if (!fueldeliveryboy || !fueldeliveryboy.latitude || !fueldeliveryboy.longitude) {
		return res.status(404).json({ message: "Fuel Delivery boy not found or missing location" });
	  }
  
	  res.json({
		lat: fueldeliveryboy.latitude,
		lng: fueldeliveryboy.longitude,
		name: `${fueldeliveryboy.firstName} ${fueldeliveryboy.lastName}`
	  });
	} catch (err) {
	  console.error("Error in fuel-location API:", err);
	  res.status(500).json({ message: "Server error" });
	}
  });

  router.post('/feedback/:id', middleware.ensurecustomerLoggedIn, async (req, res) => {
	try {
	  const { feedback, rating } = req.body;
	  await ServiceRequest.findByIdAndUpdate(req.params.id, {
		feedback,
		rating: parseInt(rating)
	  });
	  res.sendStatus(200);
	} catch (err) {
	  console.error(err);
	  res.sendStatus(500);
	}
  });
  
  router.post('/customer/pay/:id', middleware.ensurecustomerLoggedIn, async (req, res) => {
	try {
	  const requestId = req.params.id;
	  
	  // Update isPaid to true
	  await ServiceRequest.findByIdAndUpdate(requestId, { isPaid: true });
	  
	  // Redirect or show success
	  res.redirect('/customer/track'); // or any page you want
	} catch (error) {
	  console.error('Payment update error:', error);
	  res.status(500).send('Server error');
	}
  });

  router.get('/customer/viewHistory', middleware.ensurecustomerLoggedIn, async (req, res) => {
	try {
	  const services = await ServiceRequest.find({
		customer: req.user._id,
		isPaid: true
	  }).populate("mechanic")
	  .populate("fueldeliveryboy")
	    .sort({ createdAt: -1 }); // latest first
  
	  res.render('customer/viewHistory', { services });
	} catch (err) {
	  console.error(err);
	  res.status(500).send('Server error');
	}
  });

  const PDFDocument = require('pdfkit');
  router.get('/customer/receipt/:id', middleware.ensurecustomerLoggedIn, async (req, res) => {
	try {
	  const request = await ServiceRequest.findById(req.params.id).populate('mechanic').populate('fueldeliveryboy');
	  if (!request || !request.isPaid) return res.status(404).send('Receipt unavailable');
  
	  const doc = new PDFDocument();
	  const filename = `FuelAid_Receipt_${Date.now()}.pdf`;
  
	  res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
	  res.setHeader('Content-type', 'application/pdf');
	  const logoPath = path.join(__dirname, '../assets/images/FUEL_AID_logo_nobg.png');
  
	  doc.rect(0, 0, doc.page.width, doc.page.height).lineWidth(5).stroke('#000000');

    // Add the FuelAid Logo (ensure the path to the logo is correct)
    const logoWidth = 100; // Adjust width as needed
const logoHeight = 90; // Adjust height as needed
const logoX = doc.page.width / 2 - logoWidth / 2; // Center the logo horizontally
const logoY = 40; // Adjust the Y position to place the logo above the heading

// Add logo
doc.image(logoPath, logoX, logoY, { width: logoWidth, height: logoHeight });
doc.moveDown();
doc.moveDown();
doc.moveDown();
doc.moveDown();
doc.moveDown();// Title with underline and bold
	  doc.fontSize(20).font('Helvetica').text('FuelAid: Roadside Aid & Fuel Anytime!', {
		align: 'center',
		underline: true
	  });
  
	  doc.moveDown();
  
	  // Receipt ID Section with bold titles
	  doc.fontSize(16).font('Helvetica').text(`Receipt ID: ${request._id}`);
	  doc.fontSize(14).font('Helvetica').text(`Customer ID: ${req.user._id}`);
	  doc.moveDown();  // Add space between sections
  
	  // Service Details Section with bold titles and normal text
	  doc.fontSize(16).font('Helvetica').text('Service Details:', {underline: true});
	  doc.fontSize(14).font('Helvetica').text(`Service Type: ${request.serviceCategory}`);
	  doc.text(`Sub Services: ${request.subServices.join(', ')}`);
	  if (request.serviceCategory.toLowerCase() === 'fuel') {
		const fuelName = request.fueldeliveryboy
		  ? `${request.fueldeliveryboy.firstName} ${request.fueldeliveryboy.lastName}`
		  : "N/A";
		doc.text(`Fuel Delivery Boy Assigned: ${fuelName}`);
	  } else {
		const mechanicName = request.mechanic
		  ? `${request.mechanic.firstName} ${request.mechanic.lastName}`
		  : "N/A";
		doc.text(`Mechanic Assigned: ${mechanicName}`);
	  }
	  
	  const serviceDate = request.completedAt ? new Date(request.completedAt).toLocaleString() : new Date(request.createdAt).toLocaleString();
	  doc.text(`Date of Service: ${serviceDate}`);
	  doc.text(`Status: ${request.status}`);
	  
	  // Add a line separator
	  doc.moveDown();
	  doc.lineWidth(0.5).moveTo(40, doc.y).lineTo(570, doc.y).stroke();  // Horizontal line
  
	  // Payment Section with bold and larger text
	  doc.moveDown();
	  doc.fontSize(16).font('Helvetica').text('Payment Details:', {underline: true});
	  doc.fontSize(14).font('Helvetica').text(`Amount Paid: ₹${request.fee || request.baseAmount}`);
	  doc.text(`Payment Status: Paid`);
  
	  doc.moveDown(2);
    doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();

	  // Thank you message
	  doc.moveDown();
	  doc.fontSize(12).font('Helvetica').text("Thank you for choosing FuelAid!", {
		align: "center"
	  });
  
	  // Footer (Optional)
	  doc.moveDown();
	  doc.fontSize(10).font('Helvetica').text("Contact us: fuelaid@gmail.com | +91 9323929210", {
		align: 'center'
	  });
  
	  // Final PDF generation
	  doc.pipe(res);
	  doc.end();
	} catch (err) {
	  console.error(err);
	  res.status(500).send('Failed to generate receipt');
	}
  });
  
module.exports = router;

