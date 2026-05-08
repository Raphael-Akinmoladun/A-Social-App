const User = require('../models/User');
const Post = require('../models/post');

// ... rest of your code ...

exports.followUser = async (req, res) => {
    try {
        const userToFollowId = req.params.id;
        const currentUserId = req.user.id;

        if (userToFollowId === currentUserId) {
            return res.status(400).json({ success: false, message: "You cannot follow yourself" });
        }

        const userToFollow = await User.findById(userToFollowId);
        if (!userToFollow) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        await User.findByIdAndUpdate(currentUserId, { $addToSet: { following: userToFollowId } });
        
        // We use { new: true } to grab the updated user document so we can count the new followers
        const updatedUser = await User.findByIdAndUpdate(userToFollowId, { $addToSet: { followers: currentUserId } }, { new: true });

        res.status(200).json({ 
            success: true, 
            message: "User followed successfully",
            followerCount: updatedUser.followers.length // Send the new count back to the screen
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.unfollowUser = async (req, res) => {
    try {
        const userToUnfollowId = req.params.id;
        const currentUserId = req.user.id;

        // Remove the IDs from the arrays
        await User.findByIdAndUpdate(currentUserId, { $pull: { following: userToUnfollowId } });
        
        // Grab the updated user to get the new, lower follower count
        const updatedUser = await User.findByIdAndUpdate(userToUnfollowId, { $pull: { followers: currentUserId } }, { new: true });

        res.status(200).json({ 
            success: true, 
            message: "User unfollowed successfully",
            followerCount: updatedUser.followers.length // Send the new count back
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getFollowing = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('following', 'first_name last_name username');
        res.status(200).json({ success: true, count: user.following.length, data: user.following });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getFollowers = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('followers', 'first_name last_name username');
        res.status(200).json({ success: true, count: user.followers.length, data: user.followers });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// controllers/userController.js

// Public Profile - returns basic user info and public stats
exports.getUserPublicProfile = async (req, res) => {
    try {
        // Find the user by username, selecting only the necessary public fields
        const user = await User.findOne({ username: req.params.username })
            .select('first_name last_name username followers following');
        
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        
        res.status(200).json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Returns only the PUBLISHED posts of a specific user by username
exports.getUserPublishedPosts = async (req, res) => {
    try {
        // 1. First find the user's ID
        const user = await User.findOne({ username: req.params.username });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        
        // 2. Then find all their published posts, populating the author info
        const posts = await Post.find({ author: user._id, state: 'published' })
            .populate('author', 'first_name last_name username')
            .sort('-createdAt'); // Sort by newest first
            
        res.status(200).json({ success: true, count: posts.length, data: posts });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};