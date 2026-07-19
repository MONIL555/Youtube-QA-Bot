<h1 align="center">FIY-Talks (Youtube-QA-Bot) 🤖</h1>

<p align="center">
  <strong>The Ultimate AI QA Assistant for YouTube, Instagram, and Local Documents.</strong><br>
  Built with Next.js, Node.js, Express, MongoDB, and powered by Gemini AI.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active-success.svg" alt="Status">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License">
  <img src="https://img.shields.io/badge/Contributions-Welcome-orange.svg" alt="Contributions">
</p>

---

## 🌟 About The Project

**FIY-Talks** is an advanced AI-powered web application that allows users to have contextual, intelligent conversations about various forms of media. Whether you want to summarize a 2-hour YouTube video, analyze an Instagram post, or extract insights from a local PDF document, FIY-Talks acts as your personal research assistant. 

It uses Google's powerful Gemini AI models on the backend to parse content, retain chat history, and stream intelligent responses directly to a beautiful, glassmorphic UI.

---

## 💻 Tech Stack

### Frontend
<p>
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS" />
</p>

### Backend
<p>
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
</p>

### Tools & Deployment
<p>
  <img src="https://img.shields.io/badge/NPM-CB3837?style=for-the-badge&logo=npm&logoColor=white" alt="NPM" />
  <img src="https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white" alt="Git" />
  <img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
</p>

---

## ✨ Key Features

- **📺 YouTube Talks:** Paste a YouTube URL and immediately start chatting about the video's content.
- **📱 Insta Talks:** Analyze and discuss Instagram posts.
- **📄 File Talks:** Upload local PDF documents and let the AI extract and explain the text.
- **🔐 Secure Authentication:** JWT-based user authentication (Access & Refresh tokens) with secure HTTP-only cookies.
- **🎨 Glassmorphic UI:** A stunning, modern, fully responsive dashboard built with custom CSS.
- **⚡ Performance Optimized:** Uses `React.memo`, `useCallback`, and skeleton loaders for a buttery smooth experience.
- **🛡️ Rate Limiting & Security:** Built-in protection against brute force attacks and spam using `express-rate-limit` and `helmet`.

---

## 🚀 Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) and [MongoDB](https://www.mongodb.com/) installed on your machine. You will also need an API key from Google Gemini.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/MONIL555/Youtube-QA-Bot.git
   cd Youtube-QA-Bot
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Setup**
   
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_ACCESS_SECRET=your_access_secret
   JWT_REFRESH_SECRET=your_refresh_secret
   JWT_ACCESS_EXPIRY=15m
   JWT_REFRESH_EXPIRY=7d
   GEMINI_API_KEY=your_gemini_api_key
   FRONTEND_URL=http://localhost:3000
   NODE_ENV=development
   ```

   Create a `.env.local` file in the `frontend` directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

5. **Run the Application**
   
   From the root folder, use the concurrent script to start both servers:
   ```bash
   npm run dev
   ```
   *Frontend will run on `http://localhost:3000` (or `3001` if occupied)*
   *Backend will run on `http://localhost:5000`*

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! 
Feel free to check the [issues page](https://github.com/MONIL555/Youtube-QA-Bot/issues).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 👨‍💻 Author

**Monil Solanki**

- Portfolio: [https://monil-portfolio.netlify.app](https://monil-portfolio.netlify.app)
- Email: [monilsolanki30@gmail.com](mailto:monilsolanki30@gmail.com)
- GitHub: [@MONIL555](https://github.com/MONIL555)

---

<p align="center">
  Made with ❤️ by Monil Solanki
</p>
