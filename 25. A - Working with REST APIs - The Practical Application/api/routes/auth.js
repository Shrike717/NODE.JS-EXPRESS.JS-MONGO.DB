const express = require("express");
const { body } = require("express-validator");

const authController = require("../controller/auth");
const User = require("../models/user"); // Needed to check if user email alrady exists in DB
const isAuth = require("../middleware/is-auth");

const router = express.Router(); // Creating the router

router.put(
	"/signup",
	[
		body("name").trim().not().isEmpty(),
		body("email")
			.trim()
			.normalizeEmail()
			.isEmail()
			.withMessage("Please enter a valid email")
			.custom((value, { req }) => {
				// Checking if email already exists in DB
				return User.findOne({ email: value }).then((userDoc) => {
					if (userDoc) {
						return Promise.reject("Email already exists!");
					}
				});
			}),
		body("password").trim().isLength({ min: 5 }),
	],
	authController.putSignup
);

router.post("/login", authController.postLogin);

// Fetching status:
router.get("/status", isAuth, authController.getUserStatus);

// Updating user status:
router.patch(
	"/status",
	isAuth,
	[body("status").trim().notEmpty()],
	authController.patchUpdateUserStatus
);

module.exports = router;
