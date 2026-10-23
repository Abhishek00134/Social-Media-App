# 💬 Chat Application - Backend Progress & Architecture

> A high-performance real-time chat application backend built with Node.js, Express, and MongoDB.

---

## 📌 Table of Contents
- [Tech Stack](#-tech-stack)
- [Folder Structure](#-folder-structure)
- [Authentication Flow](#-authentication-flow)
- [Detailed Changelog](#-detailed-changelog)
- [API Endpoints Guide](#-api-endpoints-guide)
- [Roadmap & Checklist](#-roadmap--checklist)

---

## 🛠️ Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **Node.js + Express** | Web application framework |
| **MongoDB + Mongoose** | NoSQL database & object modeling |
| **JSON Web Tokens (JWT)** | Stateless authentication with access & refresh tokens |
| **Bcrypt.js** | Secure password hashing |
| **Cookie-Parser** | HTTP-only cookie management |
| **CORS** | Cross-origin resource sharing with frontend |

---

## 📁 Folder Structure

```text
Chat-App/
├── Backend/
│   ├── config/
│   │   └── db.js                 # Database connection logic
│   ├── Controller/
│   │   └── user.controller.js    # User auth & profile logic
│   ├── middleware/
│   │   └── auth.middleware.js    # JWT verification middleware
│   ├── models/
│   │   └── user.js               # User schema & database model
│   ├── routes/
│   │   └── user.routes.js        # Auth and user endpoint routes
│   ├── .env                      # Environment secrets & config
│   ├── app.js                    # Express application configuration
│   ├── package.json              # Project scripts & dependencies
│   └── server.js                 # Entry point & server listener
└── PROGRESS.md                   # This project tracker & documentation
```

---

## 🔐 Authentication Flow

We use an industry-standard **Dual-Token Strategy** (`accessToken` + `refreshToken`) to balance security and seamless user experience.

### How It Works:

```text
[ Client ]  ─── 1. Login (email + password) ───▶ [ Server ]
[ Client ]  ◀── 2. Access Token (15m) +      ─── [ Server ]
                   Refresh Token (7d)
                   (in httpOnly Cookies & JSON)
                   
[ Client ]  ─── 3. Request /profile          ───▶ [ Server (auth.middleware) ]
                (Passes accessToken)             Validates JWT ──▶ Returns User

[ Client ]  ─── 4. Access Token Expired?     ───▶ [ Server (/refresh-token) ]
                (Passes refreshToken)             Verifies DB match ──▶ Issues new accessToken

[ Client ]  ─── 5. Logout                    ───▶ [ Server (/logout) ]
                                                  Clears DB token + Clears Cookies
```

### Token Breakdown:

| Property | Access Token | Refresh Token |
| :--- | :--- | :--- |
| **Lifetime** | `15 minutes` | `7 days` |
| **Storage (Client)** | `httpOnly` Cookie / Auth Header | `httpOnly` Cookie |
| **Storage (Server)** | Stateless (verified via secret) | Stored in MongoDB on `user.refreshToken` |
| **Purpose** | Fast, short-lived authorization | Long-lived session renewal & revocation |

---

## 📝 Detailed Changelog

### 1. [user.controller.js](file:///c:/Chat-App/Backend/Controller/user.controller.js)
- **`registerUser`**:
  - Validates required fields (`FullName`, `email`, `password`).
  - Hashes passwords using `bcrypt.hash(password, 10)`.
  - Fixes a reference bug where `user._id` was accessed prior to document creation.
  - Generates both tokens, saves `refreshToken` to DB, and sets `httpOnly` cookies.
- **`loginUser`**:
  - Finds user by email and compares hashed passwords via `bcrypt.compare()`.
  - Generates both access and refresh tokens upon success.
- **`refreshAccessToken`**:
  - Verifies the incoming refresh token against `REFRESH_TOKEN_SECRET`.
  - Verifies token matches the one stored in MongoDB (prevents revoked session reuse).
  - Issues a new `accessToken` (15m).
- **`logoutUser`**:
  - Removes the stored `refreshToken` from the database.
  - Clears both `accessToken` and `refreshToken` cookies from the client browser.
- **`getUserProfile`**:
  - Returns authenticated user details excluding password and refresh token.

---

### 2. [auth.middleware.js](file:///c:/Chat-App/Backend/middleware/auth.middleware.js)
- Created the **`protectRoute`** middleware function.
- Reads `accessToken` from `req.cookies.accessToken`, `req.headers.authorization`, or legacy `req.cookies.token`.
- Decodes and validates the token signature using `ACCESS_TOKEN_SECRET`.
- Attaches the sanitized user to `req.user` for downstream controllers.

---

### 3. [user.routes.js](file:///c:/Chat-App/Backend/routes/user.routes.js)
- Defined the routing endpoints:
  - `POST /api/users/signup`
  - `POST /api/users/register`
  - `POST /api/users/login`
  - `POST /api/users/logout`
  - `POST /api/users/refresh-token`
  - `GET  /api/users/profile` (Protected with `protectRoute`)

---

### 4. [models/user.js](file:///c:/Chat-App/Backend/models/user.js)
- Enhanced schema definitions:
  - Added `refreshToken` field for token revocation on logout.
  - Formatted `email` with `lowercase: true`, `trim: true`, and `unique: true`.
  - Set `password` with `minlength: 6`.
  - Made `profilePic` optional with default `""`.
  - Added `{ timestamps: true }` to automatically track `createdAt` and `updatedAt`.

---

### 5. [app.js](file:///c:/Chat-App/Backend/app.js) & [server.js](file:///c:/Chat-App/Backend/server.js)
- **`app.js`**:
  - Added `cors` middleware with `credentials: true` for cookie handling with frontend (`http://localhost:5173`).
  - Added `cookieParser()`, `express.json()`, and `express.urlencoded()`.
  - Mounted `user.routes.js` at `/api/users`.
- **`server.js`**:
  - Automatically initializes `DBConnect()` before listening.
  - Uses fallback port `5000` if `PORT` is not defined.

---

### 6. Configuration & Dependencies
- **[config/db.js](file:///c:/Chat-App/Backend/config/db.js)**:
  - Robust database connector checking both `MONGO_URI` and `MONGOURI`.
- **[package.json](file:///c:/Chat-App/Backend/package.json)**:
  - Added `"type": "module"` to natively support ES module imports.
  - Added scripts: `"start": "node server.js"` and `"dev": "node --watch server.js"`.
- **[.env](file:///c:/Chat-App/Backend/.env)**:
  - Added dedicated secrets for `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET`.

---

## 📡 API Endpoints Guide

### 1. Register User
- **URL**: `POST /api/users/register`
- **Body**:
  ```json
  {
    "FullName": "John Doe",
    "email": "john@example.com",
    "password": "secretPassword123"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "message": "User created successfully",
    "user": {
      "_id": "6716a5b...",
      "FullName": "John Doe",
      "email": "john@example.com",
      "profilePic": ""
    },
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
  ```

---

### 2. Login User
- **URL**: `POST /api/users/login`
- **Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "secretPassword123"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "message": "Logged in successfully",
    "user": {
      "_id": "6716a5b...",
      "FullName": "John Doe",
      "email": "john@example.com",
      "profilePic": ""
    },
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
  ```

---

### 3. Refresh Access Token
- **URL**: `POST /api/users/refresh-token`
- **Body** *(Optional if sent via cookie)*:
  ```json
  {
    "refreshToken": "eyJhbG..."
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "message": "Access token refreshed successfully",
    "accessToken": "eyJhbG..."
  }
  ```

---

### 4. Logout User
- **URL**: `POST /api/users/logout`
- **Response** (`200 OK`):
  ```json
  {
    "message": "Logged out successfully"
  }
  ```

---

### 5. Get User Profile *(Protected)*
- **URL**: `GET /api/users/profile`
- **Headers**: `Authorization: Bearer <accessToken>` *(or automatically via cookie)*
- **Response** (`200 OK`):
  ```json
  {
    "user": {
      "_id": "6716a5b...",
      "FullName": "John Doe",
      "email": "john@example.com",
      "profilePic": "",
      "createdAt": "2026-10-21T16:20:00.000Z",
      "updatedAt": "2026-10-21T16:20:00.000Z"
    }
  }
  ```

---

## 🎯 Roadmap & Checklist

- [x] Database connection with environment variables
- [x] User registration with password encryption (`bcryptjs`)
- [x] Dual-token authentication (`accessToken` + `refreshToken`)
- [x] Persistent refresh token storage for secure revocation
- [x] Automatic session renewal endpoint (`/refresh-token`)
- [x] User logout and cookie clearance
- [x] Protected profile endpoint (`/profile`)
- [x] Route authentication middleware (`protectRoute`)
- [x] Frontend React + Vite setup with React Router DOM
- [x] Frontend Auth Context (`useAuth`) with login, signup, logout, and auth verification
- [x] Frontend Route Guards (`ProtectedRoute` & `PublicRoute`)
- [x] High-end split-screen Login Page (password toggle, quick autofill demo credentials, live chat mock preview)
- [x] High-end split-screen Signup Page (preset avatar selector, live password strength meter, feature highlights)
- [x] Redesigned Chat App User Profile (status chips, tactile Edit Bio pill button, real account details, settings toggles)
- [x] Facebook-style Social Feed Home Page (Create Post, Stories bar, photo/video attachments, Like, Dislike, Comment stream, Share)
- [x] Integrated Messenger Contacts Sidebar with floating bottom-right chat popup
- [x] Full Frontend-to-Backend connection with Vite Proxy (`/api` -> `http://localhost:3000`)
- [x] Resilient API client (`apiFetch`) with automatic session renewal on expired tokens
- [x] CORS with credentials enabled for `http://localhost:5173`
- [x] User registration, login, logout, and protected profile working end-to-end
- [ ] Backend Post and Feed APIs with media upload
- [ ] Message schema and conversation models
- [ ] Real-time communication with Socket.io (online users, live chats)
- [ ] Profile photo upload (Cloudinary / Multer)





