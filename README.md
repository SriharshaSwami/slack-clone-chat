# Slack Clone Chat Application

A full-stack, real-time chat application inspired by Slack. This project enables users to communicate in real-time using channels and direct messages, featuring a modern, responsive user interface and a robust backend.

## 🚀 Features

*   **Real-time Messaging:** Instant message delivery and updates powered by Socket.IO.
*   **User Authentication:** Secure registration and login using JWT (JSON Web Tokens) and bcrypt for password hashing.
*   **Channels:** Create and join public or private channels for group discussions.
*   **Direct Messages:** Private one-on-one messaging between users.
*   **Emoji Support:** Integrated emoji picker for expressive communication.
*   **Responsive Design:** A sleek, user-friendly interface that works across different screen sizes.

## 💻 Tech Stack

### Frontend
*   **Framework:** React (bootstrapped with Vite)
*   **Routing:** React Router DOM
*   **Real-time Client:** Socket.IO Client
*   **UI Components:** Custom UI with Emoji Picker React & Jimp

### Backend
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** MongoDB (via Mongoose)
*   **Caching & Pub/Sub:** Redis
*   **Real-time Server:** Socket.IO
*   **Authentication:** JWT (jsonwebtoken) & bcryptjs

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed:
*   [Node.js](https://nodejs.org/) (v16 or higher recommended)
*   [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas)
*   [Redis](https://redis.io/) (Local instance or cloud Redis)

## 🛠️ Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/SriharshaSwami/slack-clone-chat
cd slack-chat-clone
```

### 2. Backend Setup
Navigate to the backend directory, install dependencies, and start the development server.

```bash
cd backend
npm install
```

**Environment Variables:**
Create a `.env` file in the `backend` directory and add the following variables:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
REDIS_URL=your_redis_connection_string
CLIENT_URL=http://localhost:5173
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal window, navigate to the frontend directory, install dependencies, and start the Vite development server.

```bash
cd frontend
npm install
```

**Environment Variables:**
Create a `.env` file in the `frontend` directory and add the following variable:
```env
VITE_API_URL=http://localhost:5000
```

Start the frontend server:
```bash
npm run dev
```

## 🧪 Sample Login Credentials

Use the following credentials to log in and test the application. Replace the placeholders with valid credentials once they are set up.

| Role | Email | Password |
| :--- | :--- | :--- |
| **Test User 1** | `testuser1@gmail.com` | `testuser1` |
| **Test User 2** | `testuser2@gmail.com` | `testuser2` |
| **Admin**| `testadmin@gmail.com` | `testadmin` |

## 📜 License
This project is licensed under the ISC License.
