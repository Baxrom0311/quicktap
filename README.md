# ⚡ QuickTap - Brutalist Speed Reflex Game

![QuickTap Banner](https://placehold.co/1200x400/0A0A0A/39FF14/png?text=QuickTap)

> **Test your reflexes.** Challenge your friends. Climb the leaderboard.
> A high-performance, competitive reaction game built for speed demons.

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22.11-339933?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8-010101?style=for-the-badge&logo=socketdotio)](https://socket.io/)

## 🚀 Features

- **⚡ Instant Feedback**: Zero-latency reaction timing down to the millisecond.
- **🎮 Multiple Difficulties**: Easy, Normal, and Hard modes with adaptive visual cues.
- **🌐 Real-time Multiplayer**: Challenge opponents worldwide in live lobbying rooms.
- **🏆 Global Leaderboards**: Compete for the top spot with persistent tracking.
- **🔒 Secure**: JWT authentication prevents score tampering and cheating.
- **🎨 Brutalist Design**: High-contrast, neon aesthetics for maximum focus.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Framer Motion, Tailwind CSS
- **Backend**: Express, Socket.io, Node.js
- **Database**: PostgreSQL (via Docker)
- **Security**: Helmet, Rate Limiting, JWT Auth

## 🏁 Getting Started

### Prerequisites

- Node.js (v18+)
- pnpm (v9+)
- Docker & Docker Compose

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/quicktap.git
    cd quicktap
    ```

2.  **Install dependencies**
    ```bash
    pnpm install
    ```

3.  **Setup Environment**
    Copy the example environment file and configure your secrets:
    ```bash
    cp .env.example .env
    ```
    *Edit `.env` and look for `JWT_SECRET` and `DB_PASSWORD`. Change them!*

4.  **Start Database**
    ```bash
    docker-compose up -d
    ```

5.  **Run Development Server**
    ```bash
    pnpm dev
    ```
    This will start both the frontend (Vite) and backend (Express) concurrently.

    - Frontend: `http://localhost:5173`
    - Backend: `http://localhost:3001`

## 🛡️ Security Note

This project uses:
- **Helmet** for secure HTTP headers.
- **Rate Limiting** to prevent API abuse.
- **JWT** to verify score submissions.

## 🤝 Contributing

Contributions are welcome! Please read the [contributing guidelines](CONTRIBUTING.md) first.

## 📄 License

MIT © [Your Name]
