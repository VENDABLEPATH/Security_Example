const fs = require('fs');
const path = require('path');
const https = require('https');
const helmet = require('helmet');
const express = require('express');
const passport = require('passport');
const cookieSession = require('cookie-session');
const  { Strategy } = require('passport-google-oauth20');

require('dotenv').config();

const PORT = 3000;

const config = {
    CLIENT_ID: process.env.CLIENT_ID,
    CLIENT_SECRET: process.env.CLIENT_SECRET,
    COOKIE_KEY_1: process.env.COOKIE_KEY_1,
    COOKIE_KEY_2: process.env.COOKIE_KEY_2
};

const AUTH_OPTIONS = {
    callbackURL: '/auth/google/callback',
    clientID: config.CLIENT_ID,
    clientSecret: config.CLIENT_SECRET
};

function verifyCallback(accessToken, refreshToken, profile, done){
    console.log(`Google profile:`, profile);
    done(null, profile);
};

passport.use(new Strategy(AUTH_OPTIONS, verifyCallback));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    done(null, id);
});

const app = express();

app.use(helmet());

app.use(cookieSession({
    name: 'session',
    maxAge: 60*60*24*1000, // 1 day
    keys: [ config.COOKIE_KEY_1, config.COOKIE_KEY_2 ]
}));

app.use((req, res, next) => { // this is a work-around for an error
    if (req.session && !req.session.regenerate){
        req.session.regenerate = (cb) => {
            cb();
        };
    };
    if (req.session && !req.session.save){
        req.session.save = (cb) => {
            cb();
        };
    };
    next();
});

app.use(passport.initialize());
app.use(passport.session());


function checkLoggedIn(req, res, next){
    const isLoggedIn = req.user;
    if (!isLoggedIn){
        return res.status(401).json({error: "User is not logged in"});
    };
    next();
};

app.get('/auth/google', passport.authenticate('google', {
    scope: ['email']
}));

app.get('/auth/google/callback', passport.authenticate('google', {
    failurRedirect: '/failure',
    successRedirect: '/',
    session: true
}), (req, res) => {
    console.log('Google called us back.');
});

app.get('/failure', (req, res) => {
    return res.send('Failed to log in.')
});

app.get('/auth/logout', (req, res) => {
    // TODO
});

app.get('/secret', checkLoggedIn, (req, res) => {
    console.log(req.user);
    return res.send('Your personal secret value is 42');
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = https.createServer({
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
}, app);

server.listen(PORT, () => {
    console.log(`https on port ${PORT}`);
});