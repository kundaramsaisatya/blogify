require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const userRoute = require('./routes/user');
const blogRoute = require('./routes/blog');//neww



const { checkForAuthenticationCookie } = require("./middleware/auth");

const Blog = require('./models/blog');

const app = express();

//middleware to acces image form public
app.use(express.static(path.resolve('./public')))
//middlewares

app.use(express.urlencoded({extended:false}));
app.use(cookieParser());
app.use(checkForAuthenticationCookie('token'));
//view engine:
app.set("view engine","ejs");
app.set("views",path.resolve("./views"));

mongoose.connect(process.env.MONGO_URL)//'mongodb://127.0.0.1:27017/blogify'
.then(e=>console.log("Mongodb Connected Successfully"));

//3rd step
app.get("/", async (req,res)=>{

    const allBlogs = await Blog.find().sort({"createdAt" : -1});
    // db.restaurants.find().sort( { "borough": 1, "_id": 1 } )

    res.render("home",{
        user: req.user,
        blogs: allBlogs,
    })
})

app.get('/blog/search', async (req, res) => {
    try {
        const search = req.query.search;
        const blogs = await Blog.find({ title: { $regex: new RegExp(search, 'i') } }).populate('createdBy');
        //return res.render('search-results', { blogs, search, user:req.user});
        return res.render('home', { blogs, user:req.user});
    } catch (error) {
        console.error('Error searching blogs:', error);
        return res.status(500).send('Internal Server Error');
    }
});

app.use('/user',userRoute,blogRoute);
app.use('/blog',blogRoute); //neww

const PORT = process.env.PORT || 8000;

app.listen(PORT,()=>console.log(`Listening on port- ${PORT}`));