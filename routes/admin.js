const express = require("express");
const router = express.Router();
const middleware = require("../middleware/index.js");
const User = require("../models/user.js");
const Hire = require("../models/hiring.js");
const Donation = require("../models/serviceRequest.js");
const ServiceRequest = require("../models/serviceRequest.js");
const Payment = require("../models/payment.js");
const geolib = require('geolib'); // npm install geolib


router.get("/admin/dashboard", middleware.ensureAdminLoggedIn, async (req, res) => {
	const numcustomers = await User.countDocuments({ role: "customer" });
	const nummechanics = await User.countDocuments({ role: "mechanic" });
	const numfueldeliveryboy = await User.countDocuments({ role: "fueldeliveryboy" });
	const numPendingDonations = await Donation.countDocuments({ status: "requested" });
	const numAcceptedDonations = await Donation.countDocuments({ status: "accepted" });
	const numCollectedDonations = await Donation.countDocuments({ status: "completed" });
	res.render("admin/dashboard", {
		title: "Dashboard",
		numcustomers, nummechanics, numfueldeliveryboy, numPendingDonations, numAcceptedDonations, numCollectedDonations
	});
});

router.get("/admin/donations/pending", middleware.ensureAdminLoggedIn, async (req, res) => {
	try {
		const pendingDonations = await Donation.find({ status: ["requested"] }).populate("customer");
		const mechanics = await User.find({ role: "mechanic" });
		res.render("admin/pendingDonations", { title: "Pending Deliveries", pendingDonations, mechanics });
	}
	catch (err) {
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});

router.get("/admin/donations/previous", middleware.ensureAdminLoggedIn, async (req, res) => {
	try {
		const previousDonations = await Donation.find({ status: "completed" }).populate("customer");
		res.render("admin/previousDonations", { title: "Previous Deliveries", previousDonations });
	}
	catch (err) {
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});

router.get("/admin/donation/view/:donationId", middleware.ensureAdminLoggedIn, async (req, res) => {
	try {
		const donationId = req.params.donationId;
		const donation = await Donation.findById(donationId).populate("customer").populate("mechanic").populate("fueldeliveryboy");
		res.render("admin/donation", { title: "Delivery details", donation });
	}
	catch (err) {
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});

router.get("/admin/mechanic/view/:mechanicId", middleware.ensureAdminLoggedIn, async (req, res) => {
	try {
		const mechanicId = req.params.mechanicId;
		const mechanic = await User.findById(mechanicId);
		res.render("admin/mechanic-detail", { title: "Mechanic details", mechanic });
	}
	catch (err) {
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});

router.get("/admin/delivery/view/:deliveryId", middleware.ensureAdminLoggedIn, async (req, res) => {
	try {
		const deliveryId = req.params.deliveryId;
		const delivery = await User.findById(deliveryId);
		res.render("admin/delivery", { title: "Fuel Delivery Boy details", delivery });
	}
	catch (err) {
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});

router.get("/admin/donation/accept/:donationId", middleware.ensureAdminLoggedIn, async (req, res) => {
	try {
		const donationId = req.params.donationId;
		await Donation.findByIdAndUpdate(donationId, { status: "accepted" });
		req.flash("success", "Delivery accepted successfully");
		res.redirect(`/admin/donation/view/${donationId}`);
	}
	catch (err) {
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});

router.get("/admin/donation/reject/:donationId", middleware.ensureAdminLoggedIn, async (req, res) => {
	try {
		const donationId = req.params.donationId;
		await Donation.findByIdAndUpdate(donationId, { status: "rejected" });
		req.flash("success", "Delivery rejected successfully");
		res.redirect(`/admin/donation/view/${donationId}`);
	}
	catch (err) {
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});

router.get("/admin/donation/assign/:donationId", middleware.ensureAdminLoggedIn, async (req, res) => {
	try {
		const donationId = req.params.donationId;
		const mechanics = await User.find({ role: "mechanic" });
		const donation = await Donation.findById(donationId).populate("customer");
		res.render("admin/assignmechanic", { title: "Assign mechanic", donation, mechanics });
	}
	catch (err) {
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});

router.post("/admin/donation/assign/:donationId", middleware.ensureAdminLoggedIn, async (req, res) => {
	try {
		const donationId = req.params.donationId;
		const { mechanic, adminTomechanicMsg } = req.body;
		await Donation.findByIdAndUpdate(donationId, { status: "assigned", mechanic, adminTomechanicMsg });
		req.flash("success", "mechanic assigned successfully");
		res.redirect(`/admin/donation/view/${donationId}`);
	}
	catch (err) {
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});

router.get("/admin/mechanics", middleware.ensureAdminLoggedIn, async (req, res) => {
	try {
		const mechanics = await User.find({ role: "mechanic" });
		res.render("admin/mechanics", { title: "List of mechanics", mechanics });
	}
	catch (err) {
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});

router.get("/admin/fueldeliveryboys", middleware.ensureAdminLoggedIn, async (req, res) => {
	try {
		const fueldeliveryboys = await User.find({
			role: "fueldeliveryboy",
		});

		res.render("admin/fueldeliveryboys", { title: "Fuel Delivery Boys", fueldeliveryboys });
	} catch (err) {
		console.log(err);
		req.flash("error", "Unable to load fuel delivery boys.");
		res.redirect("back");
	}
});

router.get("/admin/fuelrequests", middleware.ensureAdminLoggedIn, async (req, res) => {
	try {
		const fuelRequests = await ServiceRequest.find({ serviceCategory: "fuel", status: "requested" }).populate("customer");
		const fuelBoys = await User.find({ role: "fueldeliveryboy" });

		const updatedFuelRequests = [];

		for (let service of fuelRequests) {
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

					const boyLocation = {
						latitude: boy.latitude,
						longitude: boy.longitude
					};


					// Fix: Check for valid coordinates
					let distance = Infinity;
					if (serviceLocation.latitude && serviceLocation.longitude &&
						boyLocation.latitude && boyLocation.longitude) {
						try {
							distance = geolib.getDistance(serviceLocation, boyLocation) / 1000; // in km
						} catch (e) {
							console.error("Error calculating distance:", e);
						}
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

			// Show all boys if either location is missing coordinates, otherwise filter by 50km
			const nearbyBoys = boysWithDistance.filter(boy => {
				if (boy.distance === Infinity) {
					return true; // Include boys with unknown distance
				}
				return boy.distance <= 50;
			});

			// Sort: Free first, then by distance
			nearbyBoys.sort((a, b) => {
				if (a.status === b.status) {
					// If both have infinite distance, maintain order; otherwise sort by distance
					if (a.distance === Infinity && b.distance === Infinity) return 0;
					if (a.distance === Infinity) return 1;
					if (b.distance === Infinity) return -1;
					return a.distance - b.distance;
				}
				return a.status === "Free" ? -1 : 1;
			});

			updatedFuelRequests.push({
				...service._doc,
				fuelBoys: nearbyBoys
			});
		}

		res.render("admin/fuelrequests", { title: "Fuel Delivery Requests", fuelRequests: updatedFuelRequests });

	} catch (err) {
		console.log(err);
		req.flash("error", "Error fetching fuel delivery requests.");
		res.redirect("back");
	}
});


router.post("/admin/assign-fuel-boy/:serviceId", middleware.ensureAdminLoggedIn, async (req, res) => {
	try {
		const { serviceId } = req.params;
		const { fuelBoyId } = req.body;

		await Donation.findByIdAndUpdate(serviceId, {
			fueldeliveryboy: fuelBoyId,
			status: "accepted"
		});

		res.redirect("/admin/fuelrequests");
	} catch (err) {
		console.error(err);
		res.status(500).send("Error assigning delivery boy");
	}
});

router.get("/admin/acceptedfuelrequests", middleware.ensureAdminLoggedIn, async (req, res) => {
	try {
		const acceptedfuel = await ServiceRequest.find({
			serviceCategory: "fuel",
			status: "completed"
		})
			.populate("customer")
			.populate("fueldeliveryboy");
		console.log(acceptedfuel);

		res.render("admin/acceptedfuelrequests", {
			title: "Complete Fuel Requests",
			acceptedfuel
		});
	} catch (err) {
		console.log(err);
		req.flash("error", "Error fetching accepted fuel delivery requests.");
		res.redirect("back");
	}
});

router.post("/admin/service/complete/:id", middleware.ensureAdminLoggedIn, async (req, res) => {
	try {
		const serviceId = req.params.id;

		// Find the service by ID and check if it's assigned to the current mechanic
		const service = await Donation.findOne({
			_id: serviceId,
			// fueldeliveryboy: req.user._id,
			status: "accepted"
		});

		if (!service) {
			req.flash("error", "Service not found or not authorized.");
			return res.redirect("back");
		}

		// Update status to 'completed'
		service.status = "completed";
		await service.save();

		req.flash("success", "Service marked as completed.");
		res.redirect("/admin/acceptedfuelrequests");
	} catch (err) {
		console.error(err);
		req.flash("error", "Error marking service as completed.");
		res.redirect("back");
	}
});

router.post("/admin/service/inprogress/:id", middleware.ensureAdminLoggedIn, async (req, res) => {
	try {
		const service = await Donation.findById(req.params.id);
		if (!service) {
			req.flash("error", "Service request not found.");
			return res.redirect("back");
		}

		service.status = "in-progress";
		await service.save();

		req.flash("success", "Service marked as In-Progress.");
		res.redirect("/admin/acceptedfuelrequests");
	} catch (err) {
		console.error(err);
		req.flash("error", "Something went wrong.");
		res.redirect("back");
	}
});


router.get("/admin/profile", middleware.ensureAdminLoggedIn, (req, res) => {
	res.render("admin/profile", { title: "My profile" });
});

router.put("/admin/profile", middleware.ensureAdminLoggedIn, async (req, res) => {
	try {
		const id = req.user._id;
		const updateObj = req.body.admin;	// updateObj: {firstName, lastName, gender, address, phone}
		await User.findByIdAndUpdate(id, updateObj);

		req.flash("success", "Profile updated successfully");
		res.redirect("/admin/profile");
	}
	catch (err) {
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}

});

router.get("/admin/verify-users", middleware.ensureAdminLoggedIn, async (req, res) => {
	try {
		const pendingUsers = await User.find({
			verification_status: "Pending",
			role: { $in: ["customer", "mechanic"] }
		});
		const pendingHires = await Hire.find({ verification_status: "Pending" });

		// Combine both lists
		const combinedPendingUsers = [...pendingUsers, ...pendingHires];

		res.render("admin/verify-users", {
			title: "Verify Users",
			pendingUsers: combinedPendingUsers
		});
	} catch (err) {
		console.log(err);
		req.flash("error", "Some error occurred on the server.");
		res.redirect("back");
	}
});

// Approve user
router.post("/admin/verify-users/approve/:userId", middleware.ensureAdminLoggedIn, async (req, res) => {
	try {
		const { type } = req.body;
		const userId = req.params.userId;
		console.log("Body received:", req.body);

		if (type === "customer" || type === "mechanic") {
			await User.findByIdAndUpdate(userId, { verification_status: "Verified" });
		} else if (type === "fuelboy") {
			await Hire.findByIdAndUpdate(userId, { verification_status: "Verified" });
		} else {
			req.flash("error", "Invalid user type");
			return res.redirect("back");
		}

		req.flash("success", "User approved successfully");
		res.redirect("/admin/verify-users");
	} catch (err) {
		console.log(err);
		req.flash("error", "Error approving user");
		res.redirect("back");
	}
});

// Reject user
router.post("/admin/verify-users/reject/:userId", middleware.ensureAdminLoggedIn, async (req, res) => {
	try {
		const { type } = req.body;
		const userId = req.params.userId;

		if (type === "customer" || type === "mechanic") {
			await User.findByIdAndUpdate(userId, { verification_status: "Rejected" });
		} else if (type === "fuelboy") {
			await Hire.findByIdAndUpdate(userId, { verification_status: "Rejected" });
		} else {
			req.flash("error", "Invalid user type");
			return res.redirect("back");
		}

		req.flash("success", "User rejected successfully");
		res.redirect("/admin/verify-users");
	} catch (err) {
		console.log(err);
		req.flash("error", "Error rejecting user");
		res.redirect("back");
	}
});


// Payments Management
router.get("/admin/payments", middleware.ensureAdminLoggedIn, async (req, res) => {
	try {
		// Fetch all payments with populated data
		const payments = await Payment.find()
			.populate('customer', 'firstName lastName phone profilePic')
			.populate('provider', 'firstName lastName phone profilePic')
			.populate('serviceRequest', 'serviceCategory subServices')
			.sort({ createdAt: -1 });

		// Calculate statistics
		const completedPayments = await Payment.countDocuments({ status: 'completed' });
		const pendingPayments = await Payment.countDocuments({ status: 'pending' });

		// Calculate total revenue
		const revenueResult = await Payment.aggregate([
			{ $match: { status: 'completed' } },
			{ $group: { _id: null, total: { $sum: '$amount' } } }
		]);
		const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

		// Get total active providers (mechanics + fuel delivery boys)
		const totalProviders = await User.countDocuments({
			role: { $in: ['mechanic', 'fueldeliveryboy'] },
			verification_status: 'Verified'
		});
		
		// Calculate total paid to providers (their earnings)
		const providerEarningsResult = await User.aggregate([
			{ $match: { role: { $in: ['mechanic', 'fueldeliveryboy'] } } },
			{ $group: { _id: null, total: { $sum: '$totalEarnings' } } }
		]);
		const totalPaidToProviders = providerEarningsResult.length > 0 ? providerEarningsResult[0].total : 0;
		
		// Calculate remaining revenue (profit)
		const remainingRevenue = totalRevenue - totalPaidToProviders;

		res.render("admin/payments", {
			title: "Payment Management",
			payments,
			completedPayments,
			pendingPayments,
			totalRevenue,
			totalProviders,
			totalPaidToProviders,
			remainingRevenue
		});
	} catch (err) {
		console.error("Error fetching payments:", err);
		req.flash("error", "Error loading payments.");
		res.redirect("/admin/dashboard");
	}
});

// Provider Salary Management
router.get("/admin/salaries", middleware.ensureAdminLoggedIn, async (req, res) => {
	try {
		// Fetch all mechanics and fuel delivery boys with earnings
		const providers = await User.find({
			role: { $in: ['mechanic', 'fueldeliveryboy'] }
		}).sort({ pendingEarnings: -1 });

		// Calculate totals
		const totalPendingPayout = providers.reduce((sum, p) => sum + (p.pendingEarnings || 0), 0);
		const totalPaidOut = providers.reduce((sum, p) => sum + ((p.totalEarnings || 0) - (p.pendingEarnings || 0)), 0);

		res.render("admin/salaries", {
			title: "Salary Management",
			providers,
			totalPendingPayout,
			totalPaidOut
		});
	} catch (err) {
		console.error("Error fetching salaries:", err);
		req.flash("error", "Error loading salary data.");
		res.redirect("/admin/dashboard");
	}
});

// Process salary payout
router.post("/admin/payout/:providerId", middleware.ensureAdminLoggedIn, async (req, res) => {
	try {
		const { providerId } = req.params;
		const { amount } = req.body;

		const provider = await User.findById(providerId);
		if (!provider) {
			req.flash("error", "Provider not found.");
			return res.redirect("/admin/salaries");
		}

		const payoutAmount = parseFloat(amount) || provider.pendingEarnings;

		if (payoutAmount > provider.pendingEarnings) {
			req.flash("error", "Payout amount exceeds pending earnings.");
			return res.redirect("/admin/salaries");
		}

		// Update provider's earnings
		await User.findByIdAndUpdate(providerId, {
			$inc: { pendingEarnings: -payoutAmount },
			lastPaidAt: new Date()
		});

		req.flash("success", `Successfully paid ₹${payoutAmount} to ${provider.firstName} ${provider.lastName}`);
		res.redirect("/admin/salaries");
	} catch (err) {
		console.error("Error processing payout:", err);
		req.flash("error", "Error processing payout.");
		res.redirect("/admin/salaries");
	}
});


module.exports = router;