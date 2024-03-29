const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const User = require("../models/user");
const Post = require("../models/post");
const { clearImage } = require("../util/file.js");

// A resolver gives back the data. Like controller in REST
module.exports = {
	createUser: async function ({ userInput }, req) {
		// const email = args.userInput.email;

		// Validation:
		const errors = [];
		if (!validator.isEmail(userInput.email)) {
			errors.push({ message: "Invalid email!" });
		}
		if (
			validator.isEmpty(userInput.password) ||
			!validator.isLength(userInput.password, { min: 5 })
		) {
			errors.push({ message: "Invalid password!" });
		}
		if (errors.length > 0) {
			const error = new Error("Invalid input!");
			error.data = errors;
			error.code = 422;
			throw error;
		}

		// First we check if user already exists. Is there a email already matching the one ccoming in?
		const existingUser = await User.findOne({ email: userInput.email });
		// If user already exists:
		if (existingUser) {
			const error = new Error("User already exists!");
			throw error;
		}
		// If user can be created, first hash pw with 12 salting rounds:
		const hashedPw = await bcrypt.hash(userInput.password, 12);

		// Now creating new user objeect:
		const user = new User({
			email: userInput.email,
			name: userInput.name,
			password: hashedPw,
		});

		// And save it to DB:
		const createdUser = await user.save();

		// Then we have to return what was defined n our mutation in the schema: The user object
		return { ...createdUser._doc, _id: createdUser._id.toString() }; // Returning only user data with _doc. And converting _id to string
	},

	login: async function ({ email, password }) {
		// First find  the user. Email in DB should match incoming email
		const user = await User.findOne({ email: email });
		// If there is no user:
		if (!user) {
			const error = new Error("Could not find user!");
			error.code = 401; // User could not authenticate
			throw error;
		}
		// If we pass to here we have a user. Now checking password. Incomingg pw vs pw from DB
		const isEqual = await bcrypt.compare(password, user.password);
		// If its not equal user entered wrong pw:
		if (!isEqual) {
			const error = new Error("Wrong password!");
			error.code = 401; // User could not authenticate
			throw error;
		}
		// If we pass to here we have correct credentials. Now creating token:
		// 1. arg: What is included. 2. arg: Secret. 3. arg: Expiration period
		const token = jwt.sign(
			{
				userId: user._id.toString(),
				email: user.email,
			},
			process.env.JWT_SECRET,
			{ expiresIn: "1h" }
		);
		// Now we have to return what was needed in the login query in the schema in AuthData:
		return { token: token, userId: user._id.toString(), name: user.name };
	},

	createPost: async function ({ postInput }, req) {
		// Checking if user is authenticated:
		if (!req.isAuth) {
			const error = new Error("User is not authenticated.");
			error.code = 401;
			throw error;
		}

		// Validation:
		const errors = [];
		// Checking title:
		if (
			validator.isEmpty(postInput.title) ||
			!validator.isLength(postInput.title, { min: 5 })
		) {
			errors.push("Title is invalid.");
		}
		// Checking content:
		if (
			validator.isEmpty(postInput.content) ||
			!validator.isLength(postInput.content, { min: 5 })
		) {
			errors.push("Content is invalid.");
		}
		if (errors.length > 0) {
			const error = new Error("Invalid input!");
			error.data = errors;
			error.code = 422;
			throw error;
		}

		// Getting authenticated user from DB:
		const user = await User.findById(req.userId);
		// Check if there is a user:
		if (!user) {
			const error = new Error("No user found!");
			error.code = 401;
			throw error;
		}

		// Now we have valid data and can create a post:
		const post = new Post({
			title: postInput.title,
			content: postInput.content,
			imageUrl: postInput.imageUrl,
			creator: user,
		});
		const createdPost = await post.save();
		// Add post to users posts array
		user.posts.push(createdPost);
		await user.save();

		return {
			...createdPost._doc,
			_id: createdPost._id.toString(), // Has to be string not MG Objct Id
			createdAt: createdPost.createdAt.toISOString(), // GQ can't read date. Therefore has to be string
			updatedAt: createdPost.updatedAt.toISOString(),
		};
	},
	getPosts: async function ({ page }, req) {
		// Checking if user is authenticated:
		if (!req.isAuth) {
			const error = new Error("User is not authenticated.");
			error.code = 401;
			throw error;
		}
		if (!page) {
			page = 1;
		}
		const perPage = 2; // Items shown per page hardcoded
		const totalPosts = await Post.find().countDocuments();
		const posts = await Post.find()
			.sort({ createdAt: -1 })
			.skip((page - 1) * perPage) // If i'm on page 2: 2-1 = 1 -> *2 = 2. The 2 items from page 1 will be skipped
			.limit(perPage) // Only 2 items will be fetched
			.populate("creator");

		// Now returning the object as defined in the schema under postData
		return {
			posts: posts.map((post) => {
				return {
					...post._doc,
					_id: post._id.toString(), // Transformation: GQ doesn't know MG ID Object
					createdAt: post.createdAt.toISOString(), // Transformation: GQ doesn't know Date Object
					updatedAt: post.updatedAt.toISOString(),
				};
			}),
			totalPosts: totalPosts,
		};
	},

	getPost: async function ({ id }, req) {
		// Checking if user is authenticated:
		if (!req.isAuth) {
			const error = new Error("User is not authenticated.");
			error.code = 401;
			throw error;
		}
		// Then gettingg the post from DB:
		const post = await Post.findById(id).populate("creator");
		if (!post) {
			const error = new Error("No post found!");
			error.code = 404;
			throw error;
		}
		// Then returning the post
		return {
			...post._doc,
			id: post._id.toString(),
			createdAt: post.createdAt.toISOString(),
			updatedAt: post.updatedAt.toISOString(),
		};
	},

	updatePost: async function ({ id, postInput }, req) {
		// Checking if user is authenticated:
		if (!req.isAuth) {
			const error = new Error("User is not authenticated.");
			error.code = 401;
			throw error;
		}
		const post = await Post.findById(id).populate("creator");
		if (!post) {
			const error = new Error("No post found!");
			error.code = 404;
			throw error;
		}
		// Validation:
		const errors = [];
		// Checking title:
		if (
			validator.isEmpty(postInput.title) ||
			!validator.isLength(postInput.title, { min: 5 })
		) {
			errors.push("Title is invalid.");
		}
		// Checking content:
		if (
			validator.isEmpty(postInput.content) ||
			!validator.isLength(postInput.content, { min: 5 })
		) {
			errors.push("Content is invalid.");
		}
		if (errors.length > 0) {
			const error = new Error("Invalid input!");
			error.data = errors;
			error.code = 422;
			throw error;
		}
		// Check if the user trying to edt is also the creator:
		if (post.creator._id.toString() !== req.userId.toString()) {
			const error = new Error("User is not authorized!");
			error.code = 403;
			throw error;
		}
		// Now i know input is valid and user is authorized. I can create the updated pos:
		post.title = postInput.title;
		post.content = postInput.content;
		// Check if image was changged:
		if (postInput.imageUrl !== "undefined") {
			// Has to b checked against a string "undefined"
			post.imageUrl = postInput.imageUrl;
		}
		// And save it:
		const updatedPost = await post.save();
		// return:
		return {
			...updatedPost._doc,
			id: post._id.toString(),
			createdAt: post.createdAt.toISOString(),
			updatedAt: post.updatedAt.toISOString(),
		};
	},

	deletePost: async function ({ id }, req) {
		// Checking if user is authenticated:
		if (!req.isAuth) {
			const error = new Error("User is not authenticated.");
			error.code = 401;
			throw error;
		}
		// Getting the post which should be deleted from DB
		const post = await Post.findById(id);
		if (!post) {
			const error = new Error("No post found!");
			error.code = 404;
			throw error;
		}
		// Check if the user trying to edit is also the creator:
		// We didn't populate the creator therefore we grab the creator id directly
		if (post.creator.toString() !== req.userId.toString()) {
			const error = new Error("User is not authorized!");
			error.code = 403;
			throw error;
		}
		// Deleting the image:
		clearImage(post.imageUrl);
		// Now deleting post from DB:
		await Post.findByIdAndRemove(id);
		// First getting user to delete post from user
		const user = await User.findById(req.userId);
		// Now deleting post from user:
		user.posts.pull(id);
		// And saving user again:
		await user.save();
		// And returning the needed Boolean value:
		return true;
	},

	user: async function (args, req) {
		// Checking if user is authenticated:
		if (!req.isAuth) {
			const error = new Error("User is not authenticated.");
			error.code = 401;
			throw error;
		}
		const user = await User.findById(req.userId);
		if (!user) {
			const error = new Error("No user found!");
			error.code = 404;
			throw error;
		}
		return {
			...user._doc,
			_id: user._id.toString(),
		};
	},

	updateStatus: async function ({ status }, req) {
		// Checking if user is authenticated:
		if (!req.isAuth) {
			const error = new Error("User is not authenticated.");
			error.code = 401;
			throw error;
		}
		const user = await User.findById(req.userId);
		if (!user) {
			const error = new Error("No user found!");
			error.code = 404;
			throw error;
		}
		user.status = status;
		await user.save();
		return {
			...user._doc,
			_id: user._id.toString(),
		};
	},
};
