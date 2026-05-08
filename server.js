require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

// SHIELD 1: Only connect to the real database if NOT testing
if (process.env.NODE_ENV !== 'test') {
    connectDB();
}

const PORT = process.env.PORT || 3000;

// SHIELD 2: Only start the live server on port 3000 if NOT testing
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}