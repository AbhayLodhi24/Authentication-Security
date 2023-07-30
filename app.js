//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10 ;

const app = express();

// console.log(process.env.API_KEY);

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
    email : String,
    password : String
});


const User = mongoose.model("User", userSchema);

app.get("/" , function(req , res){
    res.render("home");
});

app.get("/login" , function(req , res){
    res.render("login");
});

app.get("/register" , function(req , res){
    res.render("register");
});

app.post("/register" , function(req , res){

    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        const user = new User({
            email : req.body.username,
            password : hash
        });
    
        user.save().then(()=>{res.render("secrets");}).catch((err)=>{
            res.send(err);
        });
    });

});

app.post("/login", function(req ,res){
    const email = req.body.username;
    const password = req.body.password;

    User.findOne({email : email}).then((foundUser)=>{
        bcrypt.compare(password, foundUser.password, function(err, result) {
            if(result === true)
            {
                 res.render("secrets");
            }
            else
            {
            console.log("No matching email and password found!");
            }
        });
          
    }).catch((err)=>{
        console.log(err);
    });
});

app.listen("3000", function(){
    console.log("Server running on port 3000");
});