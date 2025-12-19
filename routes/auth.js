const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/user.js");
const Hire = require("../models/hiring.js");
const passport = require("passport");
const middleware = require("../middleware/index.js")

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


router.get("/auth/signup", middleware.ensureNotLoggedIn, (req,res) => {
	res.render("auth/signup", { title: "User Signup" });
});

router.post("/auth/signup", middleware.ensureNotLoggedIn, async (req,res) => {
	
	const { firstName, lastName, email, dl, phone, password1, password2, role } = req.body;
	let errors = [];
	// Address is now optional - no need to geocode
	
	if (!firstName || !lastName || !email || !phone ||!password1 || !password2) {
		errors.push({ msg: "Please fill in all the fields" });
	}
	// Driving license is required only for customers
	if (role === 'customer' && !dl) {
		errors.push({ msg: "Driving License Number is required for customers" });
	}
	if (password1 != password2) {
		errors.push({ msg: "Passwords are not matching" });
	}
	if (password1.length < 4) {
		errors.push({ msg: "Password length should be atleast 4 characters" });
	}
	if(errors.length > 0) {
		return res.render("auth/signup", {
			title: "User Signup",
			errors, firstName, lastName, email, password1, password2
		});
	}
	
	try
	{
		const user = await User.findOne({ email: email });
		if(user)
		{
			errors.push({msg: "This Email is already registered. Please try another email."});
			return res.render("auth/signup", {
				title: "User Signup",
				firstName, lastName, errors, email, dl, phone, password1, password2
			});
		}
		
		const newUser = new User({ firstName, lastName, email, dl, phone, password:password1, role });
		const salt = bcrypt.genSaltSync(10);
		const hash = bcrypt.hashSync(newUser.password, salt);
		newUser.password = hash;
		await newUser.save();
		req.flash("success", "You are successfully registered and can log in.");
		res.redirect("/auth/login");
	}
	catch(err)
	{
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
	
});

router.get("/auth/login", middleware.ensureNotLoggedIn, (req,res) => {
	res.render("auth/login", { title: "User login" });
});

router.post("/auth/login", middleware.ensureNotLoggedIn,
	passport.authenticate('local', {
		failureRedirect: "/auth/login",
		failureFlash: true,
		successFlash: true
	}), (req,res) => {
		res.redirect(req.session.returnTo || `/${req.user.role}/dashboard`);
	}
);

router.get("/auth/logout", (req,res) => {
	req.logout();
	req.flash("success", "Logged-out successfully")
	res.redirect("/");
});

router.get("/auth/fueldel", (req,res) => {
	res.render("auth/fueldel", { title: "Fuel Delivery Boy Joining form" });
});

router.post("/auth/fueldel", async (req,res) => {
	
	const { firstName, lastName, email, acn, age, address, phone, experience, employer, vehicleType, vehicleNumber, role} = req.body;
	let errors = [];
	
	if (!firstName || !lastName || !email || !acn ||!age || !address || !phone || !experience || !employer || !vehicleType || !vehicleNumber || !role) {
		errors.push({ msg: "Please fill in all the fields" });
	}
	if(errors.length > 0) {
		return res.render("auth/fueldel", {
			title: "Joining form",
			errors, firstName, lastName, email, age, address
		});
	}
	
	try
	{
		const hire = await Hire.findOne({ email: email });
		if(hire)
		{
			errors.push({msg: "This Email is already registered. Please try another email."});
			return res.render("auth/fueldel", {
				title: "Joining form",
				firstName, lastName, errors, email, acn, age, address, phone, experience, employer, vehicleType, vehicleNumber, role
			});
		}
		
		const newHire = new Hire({ firstName, lastName, email, acn, age, address, phone, experience, employer, vehicleType, vehicleNumber, role });
		await newHire.save();
		req.flash("success", "You are successfully registered");
		res.redirect("/");
	}
	catch(err)
	{
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
	
});

module.exports = router;