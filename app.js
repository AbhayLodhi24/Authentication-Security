//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oidc');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret : "My name is Abhay The Great.",
    resave : false,
    saveUninitialized : false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
    email : String,
    password : String,
    googleId : String
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env['CLIENT_ID'],
    clientSecret: process.env['CLIENT_SECRET'],
    callbackURL: 'http://localhost:3000/auth/google/secrets'
  },
  function(tokenset, userinfo, done) {
    console.log(userinfo);

    User.findOne({ googleId : userinfo.id})
    .then(function(user) {
        if (!user) {
          const newUser = new User({
            googleId: userinfo.id
          });

          return newUser.save();
        } else {
          return user;
        }
      })
      .then(function(user) {
        done(null, user);
      })
      .catch(function(err) {
        done(err);
      });
  }
));

app.get("/" , function(req , res){
    res.render("home");
});

app.get("/auth/google" , passport.authenticate("google",{
    scope: [ 'profile' ]
  }));

  app.get("/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login"}),
  function(req, res) {
    res.redirect("/secrets");
  });

app.get("/login" , function(req , res){
    res.render("login");
});

app.get("/register" , function(req , res){
    res.render("register");
});

app.get("/secrets" , function(req ,res){
    if(req.isAuthenticated())
    {
        res.render("secrets");
    }
    else
    {
        res.redirect("/login");
    }
});

app.get("/logout", function(req , res , next){
    req.logout(function(err){
        if(err)
        {return next(err) ;}
        res.redirect("/");
    });    
});

app.post("/register" , function(req , res){

    User.register({username : req.body.username}, req.body.password , function(err, user){
        if(err)
        {
            console.log(err);
           res.redirect("/register");
        }
        else
        {
            passport.authenticate("local")(req, res , function(){
                res.redirect("/secrets");
            })
        }
    })

});

app.post("/login", function(req ,res){

    const user = new User({
         username : req.body.username,
         password : req.body.password
    });

    req.login(user , function(err){
        if(err)
        {
            console.log(err);
        }
        else
        {
            passport.authenticate("local")(req , res , function(){
                res.redirect("/secrets");
            });
        }
    });
});

app.listen("3000", function(){
    console.log("Server running on port 3000");
});