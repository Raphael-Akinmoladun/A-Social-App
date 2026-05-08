const express = require('express');
const router = express.Router();
const { signup, signin } = require('../controllers/authController');
const { protect, optionalAuth } = require('../middleware/auth');
const { 
    getPublicPosts, createPost, toggleLike, getSinglePost, 
    getMyPosts, updatePost, deletePost, addComment
} = require('../controllers/postController');
const { 
    followUser, unfollowUser, getFollowing, getFollowers,
    getUserPublicProfile, getUserPublishedPosts
} = require('../controllers/userController');

// --- Auth Routes ---
router.post('/auth/signup', signup);
router.post('/auth/signin', signin);

// --- Post Routes ---
// Public/Optional Auth Feed
router.get('/posts', getPublicPosts);
router.get('/posts/:id', getSinglePost);

// --- Public User Profile Routes (NEW) ---
router.get('/users/:username/profile', getUserPublicProfile);
router.get('/users/:username/posts/published', getUserPublishedPosts);

// --- Auth Routes ---
router.post('/auth/signup', signup);
router.post('/auth/signin', signin);

// ... protect middleware and other routes ...

// Protected Post Actions
router.post('/posts', protect, createPost);
router.get('/users/me/posts', protect, getMyPosts);
router.patch('/posts/:id', protect, updatePost); // Edit content or state
router.delete('/posts/:id', protect, deletePost);
router.post('/posts/:id/like', protect, toggleLike);
router.post('/posts/:id/comment', protect, addComment);

// --- User Follow Routes ---
router.post('/users/:id/follow', protect, followUser);
router.post('/users/:id/unfollow', protect, unfollowUser);
router.get('/users/:id/following', getFollowing); // Can be public or protected
router.get('/users/:id/followers', getFollowers);

module.exports = router;