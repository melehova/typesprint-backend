# Typesprint Backend

Welcome to the backend of **Typesprint**, a real-time multiplayer game platform built with TypeScript and Node.js. This project demonstrates best practices in scalable backend architecture, robust authentication, and efficient state management for interactive applications.

## Features
- **Real-time multiplayer rooms**: Efficient room management and state synchronization.
- **JWT Authentication**: Secure user authentication and session management.
- **Modular architecture**: Clean separation of concerns for scalability and maintainability.
- **Extensible handlers and middleware**: Easy to add new features and endpoints.
- **In-memory caching**: Fast access to frequently used data.

## Tech Stack
- **Node.js**
- **TypeScript**
- **Socket.io** (for real-time communication)
- **Express** (for HTTP APIs)
- **JWT** (for authentication)

## Setup & Installation
1. **Clone the repository:**
   ```sh
   git clone https://github.com/melehova/typesprint-backend.git
   cd typesprint-backend
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Configure environment:**
   - Copy `.env.example` to `.env` and set your environment variables.
4. **Run the server:**
   ```sh
   npm start
   ```

## Development
- **Type safety:** All code is written in TypeScript for reliability and maintainability.
- **Linting & formatting:** Pre-configured with ESLint and Prettier for code quality.
- **Hot reload:** Use `npm run dev` for live development with automatic restarts.

### Game State
- Real-time updates via Socket.io events

## Contributing
We welcome contributions! Please follow our code style and submit pull requests with clear descriptions.

## License
This project is licensed under the MIT License.

---

_Crafted with care by the Veronika Melekhova. If you have questions or suggestions, feel free to open an issue or reach out!_
