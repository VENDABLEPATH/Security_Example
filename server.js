const fs = require('fs');
const path = require('path');

require('dotenv').config();

const https = require('https');
const express = require('express');
const passport = require('passport');
const  { Strategy } = require('passport-google-oauth20');

const helmet = require('helmet');

const PORT = 3000;

const config = {
    CLIENT_ID: process.env.CLIENT_ID,
    CLIENT_SECRET: process.env.CLIENT_SECRET
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

const app = express();

app.use(helmet());
app.use(passport.initialize());


function checkLoggedIn(req, res, next){
    const isLoggedIn = true; // TODO
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
    session: false
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