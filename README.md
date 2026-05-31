# ChitChat 💬

ChitChat is a modern, real-time MERN (MongoDB, Express, React, Node.js) stack chat application. It features secure user authentication, direct messaging, real-time online status tracking, image sharing via Cloudinary, group chat creation, and direct peer-to-peer WebRTC video calling with screen share capabilities.

---

## 🌟 Key Features

* **Real-time Chatting**: Instantly send and receive messages with active typing and online/offline user indicators powered by Socket.io.
* **Group Chats**: Create group rooms, select multiple users to join, and broadcast messages to all active group members.
* **Direct WebRTC Video Calls**: Initiate direct or group-wide video calls. Includes capabilities to toggle audio, video, and start/stop real-time **Screen Sharing**.
* **Image Sharing**: Capture and attach image files, which are processed, uploaded, and stored securely on Cloudinary.
* **Custom Themes**: Toggle between 32 different beautiful DaisyUI themes (light, dark, retro, cupcake, synthwave, etc.) that persist across sessions.
* **Secure Auth Session**: Register and login securely with password encryption (bcryptjs) and stateless session validation via HTTP-only JWT cookies.

---

## ⚙️ Technology Stack

* **Frontend**: React (Hooks, Context, Refs), Vite, Zustand (State Management), Tailwind CSS, DaisyUI, Lucide React (Icons).
* **Backend**: Node.js, Express, Socket.io, Mongoose (ODM), JWT (Authentication), Cookie-Parser.
* **Media & Storage**: Cloudinary API (image storage), MongoDB Atlas (data persistence).
* **Communication Protocol**: WebSockets (Signaling channel), WebRTC (direct peer-to-peer audio/video streaming).

---

## 🔄 System Architecture & Flow

The following diagram illustrates how components communicate to deliver real-time messages and negotiate WebRTC video streams:

```mermaid
sequenceDiagram
    autonumber
    actor Alice as User A (Alice)
    actor Bob as User B (Bob)
    participant ClientA as Alice's Browser
    participant ClientB as Bob's Browser
    participant Server as Node/Express/Socket Server
    participant DB as MongoDB Database

    %% User Interaction Flow
    Note over ClientA, Server: User Authentication
    ClientA->>Server: HTTP POST /api/auth/login
    Server-->>ClientA: Set HTTP-Only JWT Cookie & Return User Info
    ClientA->>Server: WebSocket Connect (query: userId)
    Server-->>ClientA: Update userSocketMap (Alice is Online)
    Server->>ClientB: Broadcast "getOnlineUsers" list

    Note over ClientA, Server: Direct Messaging
    ClientA->>Server: HTTP POST /api/messages/send/:bobId (Text/Image)
    Server->>DB: Save Message
    Server->>ClientB: socket.emit("newMessage", MessageData)
    ClientB-->>Bob: Update message state reactively

    Note over ClientA, Server: WebRTC Video Call Signaling Flow
    Alice->>ClientA: Clicks "Start Video Call"
    ClientA->>Server: socket.emit("startVideoCall", { userId: BobId })
    Server->>DB: Save "Video call started..." notification message
    Server->>ClientA: socket.emit("newMessage", CallNotification)
    Server->>ClientB: socket.emit("newMessage", CallNotification)
    
    Note over ClientA, ClientB: Users click Join Link and open Call Page
    ClientA->>Server: socket.emit("joinVideoRoom", roomId)
    ClientB->>Server: socket.emit("joinVideoRoom", roomId)
    Server->>ClientA: socket.to(roomId).emit("userJoined", { socketId: Bob_SocketId })
    
    Note over ClientA, ClientB: WebRTC Session Negotiation
    ClientA->>ClientA: Create RTCPeerConnection & Local Media Streams
    ClientA->>Server: socket.emit("videoOffer", { offer, to: Bob_SocketId })
    Server->>ClientB: Relay "videoOffer"
    ClientB->>ClientB: Create RTCPeerConnection & Local Media Streams
    ClientB->>Server: socket.emit("videoAnswer", { answer, to: Alice_SocketId })
    Server->>ClientA: Relay "videoAnswer"
    
    Note over ClientA, ClientB: ICE Candidates Exchange (Network Traversal)
    ClientA->>Server: socket.emit("iceCandidate", { candidate, to: Bob_SocketId })
    Server->>ClientB: Relay Candidate
    ClientB->>Server: socket.emit("iceCandidate", { candidate, to: Alice_SocketId })
    Server->>ClientA: Relay Candidate
    
    Note over ClientA, ClientB: Direct Peer-to-Peer Connection Established
    ClientA<->>ClientB: Direct RTP/UDP Video & Audio Media Streams
```

### Flow Breakdown

1. **Session Initialization & Auth Flow**:
   - The user visits the frontend. If no JWT token is stored in the user's cookies, `react-router-dom` redirects them to the `/login` or `/signup` page.
   - Upon logging in, the server generates a JSON Web Token and stores it in the client browser's cookies under `jwt`.
   - The client then calls the `connectSocket` helper, which opens a WebSocket connection to the backend server, sending their user ID as a query parameter.
   - The server registers the mapping of `{ userId: socketId }` and broadcasts the new online users list to all other active clients.

2. **Private Message Flow**:
   - Alice inputs a text message or selects an image.
   - If an image is selected, it is converted to a base64 string on the frontend.
   - The message is posted via Axios to `/api/messages/send/:id`.
   - The server uploads the base64 image string to Cloudinary, stores the resulting HTTPS URL and the message in MongoDB.
   - The server resolves the recipient socket ID via the active users map and emits a WebSocket event `newMessage` carrying the message payload to the recipient.
   - The recipient's store appends the message reactively, automatically scrolling the view.

3. **Group Message Flow**:
   - A user clicks the "Create" button on the Groups tab in the sidebar and enters a group name, selecting other members.
   - This sends an API post request to `/api/groups`.
   - Once created, group chat messages are emitted from the sender over WebSocket `sendGroupMessage`.
   - The backend checks database authorizations, uploads any attachments to Cloudinary, saves the message, and broadcasts `newGroupMessage` to all active sockets belonging to that group's members.

4. **WebRTC Video Signaling Flow**:
   - Clicking the camera icon sends a `startVideoCall` event to the socket server.
   - The server generates an ephemeral `roomId` and saves a system message containing the route `/video-call/${roomId}` in the chat logs.
   - When users click the link, they open the WebRTC screen.
   - Both browsers turn on their cameras and microphones using `navigator.mediaDevices.getUserMedia`.
   - The browsers exchange session configurations (Offer, Answer) and candidate addresses through the WebSocket signaling route.
   - Once successfully connected, media packets flow directly between the browsers, bypassing the backend server entirely to minimize latency.

---

## 📂 Project Structure

```text
├── backend
│   ├── src
│   │   ├── controllers    # Auth, Group, and Message controller logc
│   │   ├── lib            # Cloudinary, Database connection, and WebSocket helpers
│   │   ├── middleware     # Authentication protection middleware
│   │   ├── models         # Mongoose User, Message, and Group schemas
│   │   ├── routes         # Express API routes definition
│   │   └── index.js       # Main server entry point
│   ├── package.json
│   └── .env.example
├── frontend
│   ├── public             # Static assets (group/avatar fallbacks)
│   ├── src
│   │   ├── components     # Chat container, headers, inputs, navbar, skeletons
│   │   ├── constants      # App settings (theme configuration arrays)
│   │   ├── lib            # Axios client instances
│   │   ├── pages          # Auth pages, HomePage, Profile, Settings, VideoCall
│   │   ├── store          # Zustand Auth, Chat, and Theme global stores
│   │   ├── App.jsx        # Routing and entry page wrapper
│   │   ├── index.css      # Core styles & Tailwind utilities
│   │   └── main.jsx       # React application loader
│   ├── package.json
│   └── .env.example
├── package.json           # Root automation tasks runner
└── README.md
```

---

## 🛠️ Environment Configuration

Both the frontend and backend require local `.env` files to configure database connections, API keys, and server locations.

### 1. Backend Configuration
Create a file named `.env` in the `backend/` directory:
```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 2. Frontend Configuration
Create a file named `.env` in the `frontend/` directory:
```env
# URL pointing to your backend dev server (e.g. PORT=5001)
VITE_BACKEND_URL=http://localhost:5001
```

---

## 🚀 Getting Started

Follow these steps to download, install, configure, and launch ChitChat locally:

### Prerequisites
* **Node.js**: Version 18.x or above installed.
* **MongoDB**: A running local MongoDB instance or a MongoDB Atlas Cloud URL.
* **Cloudinary**: A free Cloudinary account for media upload features.

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/JayeshJoshi2005/ChitChat.git
   cd ChitChat
   ```

2. **Configure Environment Variables**:
   * Copy the environment examples as template:
     ```bash
     cp backend/.env.example backend/.env
     cp frontend/.env.example frontend/.env
     ```
   * Open `backend/.env` and insert your credentials.

3. **Install Dependencies**:
   * Run the root script to automatically install all packages for both server and client:
     ```bash
     npm run build
     ```
     *(This command runs `npm install` across subprojects and does a compilation checks).*

### Running locally (Development Mode)

To start the servers with live reload (nodemon and vite dev server):

1. **Start Backend Server** (Port `5001` default):
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend Client** (Port `5173` default):
   * Open a new terminal window:
   ```bash
   cd frontend
   npm run dev
   ```
   * Open your browser and navigate to `http://localhost:5173`.

---

## 🔒 Security Practices

* **HTTP-Only Cookies**: JWT tokens are transmitted using the `httpOnly: true` flag to protect against Cross-Site Scripting (XSS) attacks.
* **Strict SameSite**: Set to `sameSite: "strict"` to protect against Cross-Site Request Forgery (CSRF).
* **Password Encryption**: All password strings are hashed using `bcryptjs` with a work-factor (salt) of 10 before saving.
* **Express JSON Limits**: Payload sizes are restricted to `1mb` to prevent Denial of Service (DoS) memory overflow vectors.
