// Load environment variables from .env file
require('dotenv').config();

const { createNodeMiddleware, createProbot } = require('probot');
const app = require('./src/index.js');

// Function to determine if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Initialize the probot application with options for development mode
const probot = isDevelopment 
  ? createProbot({
      // In development mode, we can bypass the GitHub App authentication
      defaults: {
        githubToken: 'test-token-for-development-only'
      }
    })
  : createProbot();

// Create an Express server
const express = require('express');
const server = express();

// Add the Probot middleware to the server
server.use(createNodeMiddleware(app, { probot }));

// Explicitly set the port
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});