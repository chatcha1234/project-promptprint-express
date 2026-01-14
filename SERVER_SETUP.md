# Backend Server Setup Guide

This document outlines the steps taken to set up the Node.js/Express backend server for the PromptPrint project.

## 1. Project Initialization

The server was initialized in the `server` directory using standard Node.js practices.

```bash
cd server
npm init -y
```

## 2. Dependencies

We installed the following necessary packages:

- **Production Dependencies:**

  - `express`: Web framework for Node.js.
  - `cors`: Middleware to enable Cross-Origin Resource Sharing (allows Frontend to request Backend).
  - `dotenv`: Module to load environment variables from a `.env` file.
  - `mongoose`: ODM library for MongoDB connection and modeling.

- **Development Dependencies:**
  - `nodemon`: Hot-reloading tool that automatically restarts the server when file changes are detected.

```bash
npm install express cors dotenv mongoose
npm install --save-dev nodemon
```

## 3. Configuration

A `.env` file was created to manage sensitive configuration.

**File:** `server/.env`

```env
PORT=5000
# Example for Local MongoDB
# MONGODB_URI=mongodb://127.0.0.1:27017/promptprint

# Example for MongoDB Atlas (Cloud) - REPLACE <username>, <password>, <cluster-url>
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/promptprint?retryWrites=true&w=majority
```

> **Important:** If you see an `authentication failed` error, ensure you have replaced `<username>`, `<password>`, and `<cluster-url>` with your actual MongoDB Atlas credentials in the `.env` file.

## 4. Scripts

We added scripts to `package.json` for easy execution:

```json
"scripts": {
  "start": "node server.js",    // For production
  "dev": "nodemon server.js"    // For development (auto-restart)
}
```

## 5. Core Server Code (`server.js`)

The `server.js` file controls the application logic:

1.  **Imports**: Loads Express, Mongoose, CORS, and Dotenv.
2.  **Middleware**: Sets up JSON parsing and CORS.
3.  **Database**: Connects to MongoDB using the URI from `.env`.
4.  **Routes**:
    - `GET /`: Health check route.
    - `POST /api/generate-design`: Mock API for the AI design feature.
5.  **Listen**: Starts the server on port 5000.

## 6. How to Run

To start the backend server in development mode:

1.  Open a terminal.
2.  Navigate to the server directory:
    ```bash
    cd server
    ```
3.  Run the development script:
    ```bash
    npm run dev
    ```

Successful output should look like:

```text
Server is running on http://localhost:5000
MongoDB Connected
```
