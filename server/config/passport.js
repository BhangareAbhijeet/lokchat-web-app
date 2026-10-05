const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const CustomStrategy = require("passport-custom").Strategy; // for mock Apple login
const User = require("../models/user");

// -------------------- GOOGLE --------------------
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = new User({
            googleId: profile.id,
            email: profile.emails[0].value,
            emailVerified: true,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            profilePic: profile.photos[0].value,
          });
          await user.save();
        }
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

// -------------------- FACEBOOK --------------------
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: "/auth/facebook/callback",
      profileFields: ["id", "emails", "name", "picture.type(large)"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ facebookId: profile.id });
        if (!user) {
          user = new User({
            facebookId: profile.id,
            email: profile.emails[0].value,
            emailVerified: true,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            profilePic: profile.photos[0].value,
          });
          await user.save();
        }
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

// -------------------- APPLE (MOCK LOGIN FOR DEV) --------------------
passport.use(
  "apple",
  new CustomStrategy(async (req, done) => {
    try {
      let user = await User.findOne({ appleId: "apple-test-id-123" });
      if (!user) {
        user = new User({
          appleId: "apple-test-id-123",
          email: "testuser@apple.com",
          emailVerified: true,
          firstName: "Test",
          lastName: "User",
        });
        await user.save();
      }
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  })
);

// -------------------- SERIALIZE & DESERIALIZE --------------------
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
