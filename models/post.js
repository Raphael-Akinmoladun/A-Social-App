const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tags: [{ type: String }],
    state: { type: String, enum: ['draft', 'published'], default: 'draft' },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Tracks WHO liked it
    like_count: { type: Number, default: 0 },
    comment_count: { type: Number, default: 0 },
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Post', PostSchema);