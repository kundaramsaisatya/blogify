const { Router } = require("express");
const multer = require("multer");
const Blog = require('../models/blog');
const Comment = require('../models/comment');

const path = require("path");
const fs = require("fs");

const router = Router();

//Middleware to ensure upload directory exists
const ensureUploadDir = (req, res, next) => {
    const uploadDir = path.resolve(`./public/uploads/${req.user.email}`);
    fs.mkdir(uploadDir, { recursive: true }, (err) => {
        if (err) {
            return next(err);
        }
        next();
    });
};

router.get('/add-blog', (req, res) => {
    return res.render("addblog", {
        user: req.user
    });
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.resolve(`./public/uploads/`);
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const filename = `${Date.now()}-${file.originalname}`;
        cb(null, filename);
    }
});

const upload = multer({ storage: storage });

router.get("/:id",async(req,res)=>{
    const blog = await Blog.findById(req.params.id).populate("createdBy");
    const comments = await Comment.find({ blogId: req.params.id }).populate("createdBy");
    console.log("comments",comments)
    console.log("blog",blog);
    return res.render("blog",{
        user:req.user,
        blog,
        comments,
    })
})


router.post("/", ensureUploadDir ,upload.single('coverImageUrl'), async(req, res) => {
    const {title, body} = req.body;
    const blog = await Blog.create({
        body,
        title,
        createdBy: req.user._id,
        coverImageUrl: `/uploads/${req.file.filename}`,
    });

    return res.redirect(`/blog/${blog._id}`);
});

router.post('/comment/:blogId', async(req,res)=>{
    try {
        await Comment.create({
           content: req.body.content,
           blogId: req.params.blogId,
           createdBy: req.user._id,
       });
       return res.redirect(`/blog/${req.params.blogId}#comments-section`)
    } catch (error) {
        const blog = await Blog.findById(req.params.blogId).populate('createdBy');
        const comments = await Comment.find({blogId: req.params.blogId}).populate('createdBy');;

        return res.render("blog",{
            blog,
            comments,
            user:req.user,
            error: "There was an error adding your comment. Please try again."
        });
        
    }
});




module.exports = router;
