import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import VideoCallPage from "./pages/VideoCallPage";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useEffect, useState } from "react";

import { Loader } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { axiosInstance } from "./lib/axios";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, onlineUsers } = useAuthStore();
  const { theme } = useThemeStore();
  const [serverStatus, setServerStatus] = useState("connecting"); // "connecting" | "waking" | "connected"

  console.log({ onlineUsers });

  useEffect(() => {
    let active = true;
    let toastId = null;

    // Show a loading toast if the server takes more than 1.5 seconds to reply
    const timer = setTimeout(() => {
      if (active) {
        setServerStatus("waking");
        toastId = toast.loading(
          "Waking up the server... Please wait a moment (Render free servers go to sleep after inactivity and take up to 50 seconds to boot).",
          { duration: Infinity }
        );
      }
    }, 1500);

    axiosInstance.get("/health")
      .then(() => {
        clearTimeout(timer);
        if (active) setServerStatus("connected");
        if (toastId) {
          toast.dismiss(toastId);
          toast.success("Server is awake and connected!", { id: "server-status" });
        }
      })
      .catch((err) => {
        clearTimeout(timer);
        if (toastId) toast.dismiss(toastId);
        console.log("Health check completed or server is awake.");
      });

    checkAuth();

    return () => {
      active = false;
      clearTimeout(timer);
      if (toastId) toast.dismiss(toastId);
    };
  }, [checkAuth]);

  console.log({ authUser });

  if (isCheckingAuth && !authUser)
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-base-200">
        <div className="flex flex-col items-center gap-4 p-8 bg-base-100 rounded-2xl shadow-xl max-w-sm text-center mx-4 border border-base-300">
          <div className="relative">
            <Loader className="size-12 animate-spin text-primary" />
            <div className="absolute inset-0 size-12 rounded-full border-2 border-primary/20 animate-ping"></div>
          </div>
          <h1 className="text-xl font-bold">ChitChat</h1>
          <div className="space-y-2">
            <p className="text-sm font-medium text-base-content/85">
              {serverStatus === "connecting" && "Connecting to server..."}
              {serverStatus === "waking" && "Waking up server..."}
              {serverStatus === "connected" && "Awake! Loading chat session..."}
            </p>
            {serverStatus === "waking" && (
              <p className="text-xs text-base-content/60 leading-relaxed">
                Render free tier hosts go to sleep after 15 mins of inactivity. This process can take up to 50 seconds. Thanks for your patience!
              </p>
            )}
          </div>
        </div>
      </div>
    );

  return (
    <div data-theme={theme}>
      <Navbar />

      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
        <Route path="/video-call/:roomId" element={authUser ? <VideoCallPage /> : <Navigate to="/login" />} />
      </Routes>

      <Toaster />
    </div>
  );
};
export default App;
