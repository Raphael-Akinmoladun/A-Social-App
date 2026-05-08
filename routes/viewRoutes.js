const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); 

// Helper function
const isLoggedIn = (req) => {
    return req.cookies && req.cookies.jwt;
};

// 1. PUBLIC: Main Feed
router.get('/', async (req, res) => {
    try {
        let currentUserId = null;
        let currentUser = null;

        if (isLoggedIn(req)) {
            try {
                const decoded = jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);
                currentUserId = decoded.id;
                currentUser = await User.findById(currentUserId);
            } catch(e) {}
        }

        const protocol = req.protocol;
        const host = req.get('host');
        // This ensures page=2, search=xyz, etc. are passed to the API
        const queryString = new URLSearchParams(req.query).toString(); 
        
        const response = await axios.get(`${protocol}://${host}/api/posts?${queryString}`);

        console.log("PAGINATION DATA:", response.data.pagination);
        
        res.render('feed', { 
            posts: response.data.data, 
            pagination: response.data.pagination, //
            searchQuery: req.query.search || '', 
            currentUserId: currentUserId,
            loggedInUser: currentUser 
        });
    } catch (err) {
        console.error("Feed Error:", err.message);
        // Provide empty defaults if it fails
        res.render('feed', { 
            posts: [], 
            pagination: { currentPage: 1, totalPages: 1 }, 
            searchQuery: '', 
            currentUserId: null, 
            loggedInUser: null 
        });
    }
});

// 2. PUBLIC: Single Post (Requirement 6)
router.get('/post/:id', async (req, res) => {
    // NO LOGIN REDIRECT HERE EITHER!
    try {
        let currentUser = null;
        if (isLoggedIn(req)) {
            try {
                const decoded = jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);
                currentUser = await User.findById(decoded.id);
            } catch(e) {}
        }

        const protocol = req.protocol;
        const host = req.get('host');
        
        const response = await axios.get(`${protocol}://${host}/api/posts/${req.params.id}`);

        res.render('single-post', {
            post: response.data.data,
            loggedInUser: currentUser,
            currentUserId: currentUser ? currentUser._id.toString() : null
        });
    } catch (err) {
        console.error("Single Post Error:", err.message);
        // Instead of redirecting to login, show the actual error on the screen!
        res.status(404).send("Failed to load post. Error: " + (err.response ? JSON.stringify(err.response.data) : err.message));
    }
});

// 3. PUBLIC: Public Profile Showcase
router.get('/users/:username', async (req, res) => {
    const protocol = req.protocol;
    const host = req.get('host');
    
    try {
        let currentUser = null;
        if (isLoggedIn(req)) {
            try {
                const decoded = jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);
                currentUser = await User.findById(decoded.id);
            } catch(e) {} 
        }

        const username = req.params.username;
        const [profileResponse, postsResponse] = await Promise.all([
            axios.get(`${protocol}://${host}/api/users/${username}/profile`),
            axios.get(`${protocol}://${host}/api/users/${username}/posts/published`)
        ]);
        
        res.render('public-profile', { 
            profileUser: profileResponse.data.data, 
            posts: postsResponse.data.data,
            loggedInUser: currentUser,
            searchQuery: '' 
        });
    } catch (err) {
        res.status(404).send('User not found');
    }
});

// --- AUTH & PROTECTED ROUTES BELOW ---

router.get('/login', (req, res) => {
    if (isLoggedIn(req)) return res.redirect('/'); 
    res.render('login');
});

router.get('/signup', (req, res) => {
    if (isLoggedIn(req)) return res.redirect('/');
    res.render('signup');
});

router.get('/logout', (req, res) => {
    res.clearCookie('jwt'); 
    res.redirect('/login'); 
});

router.get('/profile', async (req, res) => {
    const token = req.cookies.jwt;
    if (!token) return res.redirect('/login');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const currentUser = await User.findById(decoded.id);

        const protocol = req.protocol;
        const host = req.get('host');
        
        const response = await axios.get(`${protocol}://${host}/api/users/me/posts`, {
            headers: { Cookie: `jwt=${token}` }
        });
        
        res.render('dashboard', { 
            posts: response.data.data, 
            loggedInUser: currentUser 
        });
    } catch (err) {
        res.redirect('/login');
    }
});

router.get('/posts/new', async (req, res) => {
    if (!isLoggedIn(req)) return res.redirect('/login');
    res.render('create-post');
});

module.exports = router;