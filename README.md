# Drone API Server (Assignment #1)

REST API Server built with Node.js and Express.js for fetching drone configurations, status, and managing temperature logs.

## Setup & Run

1. Install dependencies:
   npm install

2. Create a `.env` file based on `.env.example` and configure your environment variables:
   PORT=3000
   CONFIG_URL=<your-config-server-url>
   LOG_URL=<your-log-server-url>
   LOG_API_TOKEN=<your-api-token>

3. Start the server:
   npm start