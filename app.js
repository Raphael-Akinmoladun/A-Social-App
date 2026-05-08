const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const apiRoutes = require('./routes/apiRoutes');
const viewRoutes = require('./routes/viewRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Mount Routes
app.use('/api', apiRoutes);
app.use('/', viewRoutes);

module.exports = app;