# JanSankalp Backend

JanSankalp Backend is the server-side component for the JanSankalp platform, which aims to enable citizens and officials to communicate and collaborate on civic issues. This backend provides secure RESTful APIs to manage users, complaints, departments, comments, upvotes/downvotes, and post statuses.

## 🌐 Project Structure

```
JanSankalp-Backend/
├── config/              # Configuration files (e.g., DB, CORS, JWT)
├── controllers/         # Logic for handling routes
├── middleware/          # Authentication and validation middleware
├── models/              # Mongoose models (User, Post, Comment, etc.)
├── routes/              # Express route definitions
├── uploads/             # Uploaded images (profile pics, post media)
├── .env                 # Environment variables
├── .gitignore
├── index.js             # Main entry point
└── package.json
```

## 🚀 Features

- 👥 User & Official registration/login
- 🔐 JWT-based authentication
- 📷 Image upload (posts and profile)
- 📝 Post creation with description, location, hashtags, and department
- ⬆️⬇️ Voting system for posts
- 💬 Commenting system
- 📂 Department-wise post assignment
- 📈 Post status updates (In Progress, Marked, Completed)
- 🔍 Filter and sort posts by department, upvotes, etc.

## 🛠️ Tech Stack

- **Backend Framework:** Node.js, Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Authentication:** JSON Web Tokens (JWT)
- **File Uploads:** Multer
- **Environment Management:** dotenv

## ⚙️ Setup Instructions

### Prerequisites

- Node.js (v14+)
- MongoDB instance (local or remote)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/Suraj0834/JanSankalp-Backend.git
cd JanSankalp-Backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Create a `.env` file**

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/jansankalp
JWT_SECRET=your_secret_key
```

4. **Start the server**

```bash
npm start
```

Server should run on `http://localhost:5000`.

## 📬 API Endpoints

| Method | Endpoint                | Description                           |
|--------|-------------------------|---------------------------------------|
| POST   | /api/auth/register      | Register User/Official                |
| POST   | /api/auth/login         | Login with email & password           |
| POST   | /api/posts              | Create a new post (user)              |
| GET    | /api/posts              | Get all posts                         |
| PUT    | /api/posts/:id/status   | Update post status (officials only)   |
| PUT    | /api/posts/:id/upvote   | Upvote a post                         |
| PUT    | /api/posts/:id/downvote | Downvote a post                       |
| POST   | /api/comments/:postId   | Comment on a post                     |
| GET    | /api/official/posts     | View department-assigned posts        |

> Full API documentation coming soon via Swagger.

## 🧪 Testing

Use tools like **Postman** or **Thunder Client** to test API routes.

## 🤝 Contributing

1. Fork the repository
2. Create your branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add new feature'`
4. Push to the branch: `git push origin feature-name`
5. Open a pull request

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 👨‍💻 Maintainer

**Suraj Kumar**  
[GitHub Profile](https://github.com/Suraj0834)

---

Built with ❤️ for better civic engagement.
