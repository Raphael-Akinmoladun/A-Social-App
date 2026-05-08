const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Post = require('../models/post'); // Make sure this matches your exact filename spelling
require('dotenv').config();

// --- 1. THE ZERO-DATA SHIELD ---
// Grab your real URI from your .env file
let TEST_DB_URI = process.env.MONGODB_URI;

// Safely inject "_test_db" so it NEVER touches your real database!
if (TEST_DB_URI && TEST_DB_URI.includes('?')) {
    TEST_DB_URI = TEST_DB_URI.replace('?', '_test_db?');
} else if (TEST_DB_URI) {
    TEST_DB_URI = TEST_DB_URI + '_test_db';
} else {
    console.error("ERROR: MONGODB_URI is missing from your .env file!");
}

describe('Social App API Tests', () => {
    let token; // We will store the login token here
    let testPostId;

    // --- BEFORE TESTS RUN: Connect to the safe cloud test DB ---
    beforeAll(async () => {
        await mongoose.connect(TEST_DB_URI);
        await User.deleteMany({});
        await Post.deleteMany({});
    });

    // --- AFTER TESTS RUN: Clean up and disconnect ---
    afterAll(async () => {
        await mongoose.connection.dropDatabase(); // Wipes the test DB
        await mongoose.connection.close();
    });

    // 1. Test User Authentication
    describe('Authentication Endpoints', () => {
        it('should register a new user successfully', async () => {
            const res = await request(app)
                .post('/api/auth/signup')
                .send({
                    first_name: "Test",
                    last_name: "User",
                    username: "testuser123",
                    email: "test@example.com",
                    password: "password123"
                });
            
            expect(res.statusCode).toEqual(201);
            expect(res.body.success).toBe(true);
            expect(res.body.token).toBeDefined();
        });

        it('should login the user and return a cookie/token', async () => {
            const res = await request(app)
                .post('/api/auth/signin')
                .send({
                    email: "test@example.com",
                    password: "password123"
                });
            
            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            
            token = res.headers['set-cookie'][0];
        });
    });

    // 2. Test Post Creation (Protected Route)
    describe('Post Creation', () => {
        it('should create a published post when authenticated', async () => {
            const res = await request(app)
                .post('/api/posts')
                .set('Cookie', token) 
                .send({
                    title: "My Automated Test Post",
                    content: "This post was created by Jest!",
                    tags: ["testing", "jest"],
                    state: "published"
                });
            
            expect(res.statusCode).toEqual(201);
            expect(res.body.success).toBe(true);
            
            testPostId = res.body.data._id; 
        });
    });

    // 3. Test Requirement 5 & 22 (Public Feed & Pagination)
    describe('Public Post Retrieval (Requirements 5 & 22)', () => {
        it('should fetch a paginated list of published posts without needing a login', async () => {
            const res = await request(app).get('/api/posts');
            
            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.pagination).toBeDefined(); 
            expect(res.body.pagination.currentPage).toEqual(1);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBeGreaterThan(0);
        });
    });

    // 4. Test Requirement 6 (Single Post)
    describe('Single Post Retrieval (Requirement 6)', () => {
        it('should fetch a single published post by ID without needing a login', async () => {
            const res = await request(app).get(`/api/posts/${testPostId}`);
            
            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data._id).toEqual(testPostId);
            expect(res.body.data.title).toEqual("My Automated Test Post");
        });

        it('should return 404 if the post does not exist', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app).get(`/api/posts/${fakeId}`);
            
            expect(res.statusCode).toEqual(404);
            expect(res.body.success).toBe(false);
        });
    });
});