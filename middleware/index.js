const middleware = {
	ensureLoggedIn: (req, res, next) => {
		if(req.isAuthenticated()) {
			return next();
		}
		req.flash("warning", "Please log in first to continue");
		res.redirect("/auth/login");
	},
	
	ensureAdminLoggedIn: (req, res, next) => {
		if(req.isUnauthenticated()) {
			req.session.returnTo = req.originalUrl;
			req.flash("warning", "Please log in first to continue");
			return res.redirect("/auth/login");
		}
		if(req.user.role != "admin") {
			req.flash("warning", "This route is allowed for admin only!!");
			return res.redirect("back");
		}
		next();
	},
	
	ensurecustomerLoggedIn: (req, res, next) => {
		if(req.isUnauthenticated()) {
			req.session.returnTo = req.originalUrl;
			req.flash("warning", "Please log in first to continue");
			return res.redirect("/auth/login");
		}
		if(req.user.role != "customer") {
			req.flash("warning", "This route is allowed for customer only!!");
			return res.redirect("back");
		}
		next();
	},
	
	ensuremechanicLoggedIn: (req, res, next) => {
		if(req.isUnauthenticated()) {
			req.session.returnTo = req.originalUrl;
			req.flash("warning", "Please log in first to continue");
			return res.redirect("/auth/login");
		}
		if(req.user.role != "mechanic") {
			req.flash("warning", "This route is allowed for mechanic only!!");
			return res.redirect("back");
		}
		next();
	},

	ensurefueldeliveryboyLoggedIn: (req, res, next) => {
		if(req.isUnauthenticated()) {
			req.session.returnTo = req.originalUrl;
			req.flash("warning", "Please log in first to continue");
			return res.redirect("/auth/login");
		}
		if(req.user.role != "fueldeliveryboy") {
			req.flash("warning", "This route is allowed for fuel delivery boy only!!");
			return res.redirect("back");
		}
		next();
	},
	
	ensureNotLoggedIn: (req, res, next) => {
		if(req.isAuthenticated()) {
			req.flash("warning", "Please logout first to continue");
			if(req.user.role == "admin")
				return res.redirect("/admin/dashboard");
			if(req.user.role == "customer")
				return res.redirect("/customer/dashboard");
			if(req.user.role == "mechanic")
				return res.redirect("/mechanic/dashboard");
		}
		next();
	},
	ensurecustomerVerified: (req, res, next) => {
		if (!req.user) {
			req.flash("warning", "Please log in first.");
			return res.redirect("/auth/login");
		}
		// Customers can access all features without verification
		return next();
	},
	ensuremechanicVerified: (req, res, next) => {
		if (!req.user) {
			req.flash("warning", "Please log in first.");
			return res.redirect("/auth/login");
		}
		if (req.user.verification_status === "Verified") {
			return next();
		} else if (req.user.verification_status === "Rejected") {
			req.flash("error", "Your account was rejected by the admin. Contact support for assistance.");
			return res.redirect("/mechanic/dashboard");
		} else {
			req.flash("warning", "Your account is pending verification.");
			return res.redirect("/mechanic/dashboard");
		}
	},
	ensurefueldeliveryboyVerified: (req, res, next) => {
		if (!req.user) {
			req.flash("warning", "Please log in first.");
			return res.redirect("/auth/login");
		}
		if (req.user.verification_status === "Verified") {
			return next();
		} else if (req.user.verification_status === "Rejected") {
			req.flash("error", "Your account was rejected by the admin. Contact support for assistance.");
			return res.redirect("/fueldeliveryboy/dashboard");
		} else {
			req.flash("warning", "Your account is pending verification.");
			return res.redirect("/fueldeliveryboy/dashboard");
		}
	}
	
}

module.exports = middleware;
