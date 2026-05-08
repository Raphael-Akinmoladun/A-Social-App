const Post = require('../models/post');

exports.getPublicPosts = async (req, res) => {
    try {
        let queryObj = { state: 'published' };

        // Search logic
        if (req.query.search) {
            queryObj.$or = [
                { title: { $regex: req.query.search, $options: 'i' } },
                { content: { $regex: req.query.search, $options: 'i' } },
                { tags: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        // Sorting logic
        let sortBy = req.query.sort_by ? req.query.sort_by : '-updatedAt';

        // Pagination math
        const page = parseInt(req.query.page, 10) || 1;
        // Keep your test limit of 2 here if you are still testing! Change to 20 for final submission.
        const limit = parseInt(req.query.limit, 10) || 20; 
        const skip = (page - 1) * limit;

        // Fetch posts
        const posts = await Post.find(queryObj)
            .populate('author', 'first_name last_name username followers following')
            .populate('comments.user', 'first_name last_name username')
            .sort(sortBy)
            .skip(skip)
            .limit(limit);

        // Count total posts
        const total = await Post.countDocuments(queryObj);

        return res.status(200).json({ 
            success: true, 
            count: posts.length, 
            pagination: {
                totalPosts: total,
                currentPage: page,
                totalPages: Math.ceil(total / limit)
            },
            data: posts 
        });

    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

exports.createPost = async (req, res) => {
    try {
        req.body.author = req.user.id; // From auth middleware
        const post = await Post.create(req.body);
        res.status(201).json({ success: true, data: post });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

exports.toggleLike = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

        const isLiked = post.likes.includes(req.user.id);
        
        if (isLiked) {
            post.likes.pull(req.user.id); // Unlike
            post.like_count -= 1;
        } else {
            post.likes.push(req.user.id); // Like
            post.like_count += 1;
        }

        await post.save();
        res.status(200).json({ success: true, like_count: post.like_count });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Get single published post
exports.getSinglePost = async (req, res) => {
    try {
        const post = await Post.findOne({ _id: req.params.id, state: 'published' })
            .populate('comments.user', 'first_name last_name username')
            .populate('comments.user', 'first_name last_name username');
        
        if (!post) return res.status(404).json({ success: false, message: 'Published post not found' });
        
        res.status(200).json({ success: true, data: post });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Owner gets their own posts (Draft & Published)
exports.getMyPosts = async (req, res) => {
    try {
        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const startIndex = (page - 1) * limit;

        // Filterable by state (if provided in query)
        let query = { author: req.user.id };
        if (req.query.state) {
            query.state = req.query.state; // 'draft' or 'published'
        }

        const posts = await Post.find(query).skip(startIndex).limit(limit);
        res.status(200).json({ success: true, count: posts.length, data: posts });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Update Post (Owner Only)
exports.updatePost = async (req, res) => {
    try {
        let post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

        // Ensure user is the owner
        if (post.author.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized to update this post' });
        }

        // Update post (Handles state change from draft to published, or content edits)
        post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.status(200).json({ success: true, data: post });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Delete Post (Owner Only)
exports.deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

        // Ensure user is the owner
        if (post.author.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized to delete this post' });
        }

        await post.deleteOne();
        res.status(200).json({ success: true, message: 'Post deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.addComment = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

        // Create the new comment object
        const newComment = {
            user: req.user.id,
            text: req.body.text
        };

        // Push it to the array and update the count
        post.comments.push(newComment);
        post.comment_count = post.comments.length;
        await post.save();

        // Populate the user info so we can send the commenter's name back to the frontend
        await post.populate('comments.user', 'first_name last_name username');

        // Return the very last comment in the array (the one we just added)
        res.status(200).json({ 
            success: true, 
            data: post.comments[post.comments.length - 1],
            comment_count: post.comment_count 
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Update Post (Owner Only)
exports.updatePost = async (req, res) => {
    try {
        let post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

        // Bulletproof check to ensure user is the owner
        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized to update this post' });
        }

        // Apply the edits
        post.title = req.body.title;
        post.content = req.body.content;
        post.tags = req.body.tags;
        post.state = req.body.state;

        // .save() ensures the 'updatedAt' timestamp is refreshed in the database
        await post.save();
        
        res.status(200).json({ success: true, data: post });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};