const { Router } = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const User = require('../models/users');

const router = Router();

router.get('/signin', (req, res) => {
    res.render("signin",{
        user: req.user,
    });
});

router.get('/signup', (req, res) => {
    return res.render("signup", {
        user: req.user,
    });
});

router.get('/logout', (req, res) => {
    res.clearCookie("token").redirect("/");
});

// Middleware to ensure upload directory exists
const ensureUploadDir2 = (req, res, next) => {
    
    const uploadDir = path.resolve(`./public/images`);
    fs.mkdir(uploadDir, { recursive: true }, (err) => {
        if (err) {
            return next(err);
        }
        next();
    });
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.resolve(`./public/images`);
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const filename = `${Date.now()}-${file.originalname}`;
        cb(null, filename);
    }
});

const upload = multer({ storage: storage });

router.post('/signin', async (req, res) => {
    const { email, password } = req.body;

    try {
        const token = await User.matchPasswordAndGenerateToken(email, password);
        return res.cookie("token", token).redirect('/');
    } catch (error) {
        return res.render("signin", {
            error: "Incorrect Password or Email"
        });
    }
});
router.post('/signup', ensureUploadDir2, upload.single('profileImageUrl'), async (req, res) => {
    const { fullName, email, password } = req.body;

    if (!req.file) {
        return res.render("signup", {
            error: "Profile image is required"
        });
    }

    try {
        // Create the user
        await User.create({
            fullName,
            email,
            password,
            profileImageUrl: `/images/${req.file.filename}`,
        });

        // Generate token for the newly created user
        const token = await User.matchPasswordAndGenerateToken(email, password);

        // Set the token as a cookie
        res.cookie("token", token);

        // Redirect the user to the homepage
        return res.redirect("/");
    } catch (error) {
        console.error("Error creating user:", error);
        return res.render("signup", {
            error: "Error creating user"
        });
    }
});



module.exports = router; 
