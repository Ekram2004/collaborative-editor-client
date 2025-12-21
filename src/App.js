import * as awarenessProtocol from "y-protocols/awareness";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useParams,
  useNavigate,
} from "react-router-dom";
import { v4 as uuidV4 } from "uuid";
import React, { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";
import { io } from "socket.io-client";

// --- CONFIGURATION ---
const socket = io("https://collaborative-editor-server.onrender.com");
const COLORS = [
  "#FF5733",
  "#33FF57",
  "#3357FF",
  "#F333FF",
  "#FF33A8",
  "#FFD700",
];
const MY_COLOR = COLORS[Math.floor(Math.random() * COLORS.length)];
const MY_NAME =
  localStorage.getItem("username") ||
  `Guest_${Math.floor(Math.random() * 100)}`;

const EXTENSIONS = {
  javascript: "js",
  python: "py",
  cpp: "cpp",
  html: "html",
  css: "css",
};

// --- HELPER: AUTH CHECK ---
const isAuthenticated = () => !!localStorage.getItem("token");

// --- LOGIN & SIGNUP COMPONENT ---
function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? "login" : "register";
    try {
      // Change this:
      // const response = await fetch('http://localhost:3001/auth/register', { ... });

      // To this (Your Render URL):
      const response = await fetch(
        "https://collaborative-editor-server.onrender.com/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username);
        navigate("/");
      } else {
        setError(data.message || "Authentication failed");
      }
    } catch (err) {
      setError("Server error. Is the backend running?");
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#1e1e1e",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: "#252526",
          padding: "40px",
          borderRadius: "8px",
          width: "300px",
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          border: "1px solid #333",
        }}
      >
        <h2 style={{ textAlign: "center", color: "#61dafb" }}>
          {isLogin ? "Login" : "Sign Up"}
        </h2>
        {error && <p style={{ color: "#ff5f5f", fontSize: "12px" }}>{error}</p>}
        <input
          type="text"
          placeholder="Username"
          required
          style={{
            padding: "10px",
            borderRadius: "4px",
            border: "1px solid #444",
            background: "#1e1e1e",
            color: "white",
          }}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          required
          style={{
            padding: "10px",
            borderRadius: "4px",
            border: "1px solid #444",
            background: "#1e1e1e",
            color: "white",
          }}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button
          type="submit"
          style={{
            padding: "10px",
            background: "#61dafb",
            border: "none",
            borderRadius: "4px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          {isLogin ? "Enter Workspace" : "Create Account"}
        </button>
        <p
          onClick={() => setIsLogin(!isLogin)}
          style={{
            fontSize: "12px",
            textAlign: "center",
            cursor: "pointer",
            color: "#888",
          }}
        >
          {isLogin
            ? "Need an account? Sign Up"
            : "Already have an account? Login"}
        </p>
      </form>
    </div>
  );
}

// --- DASHBOARD (HOME) ---
function Dashboard() {
  const [docs, setDocs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:3001/documents", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((r) => r.json())
      .then((data) => setDocs(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };
  const deleteDocument = async (e, id) => {
    e.stopPropagation(); // Prevents the click from opening the document
    if (!window.confirm("Are you sure you want to delete this project?"))
      return;

    try {
      const res = await fetch(`http://localhost:3001/documents/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (res.ok) {
        // Remove the deleted document from the local state list
        setDocs(docs.filter((doc) => doc._id !== id));
      }
    } catch (err) {
      alert("Failed to delete document");
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        background: "#1e1e1e",
        color: "white",
        padding: "40px",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "40px",
        }}
      >
        <h1 style={{ color: "#61dafb" }}>My Projects</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => navigate(`/documents/${uuidV4()}`)}
            style={{
              padding: "10px 20px",
              background: "#4caf50",
              border: "none",
              borderRadius: "5px",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            + New Project
          </button>
          <button
            onClick={logout}
            style={{
              padding: "10px 20px",
              background: "#ff5f5f",
              border: "none",
              borderRadius: "5px",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "20px",
        }}
      >
        {docs.map((doc) => (
          <div
            key={doc._id}
            onClick={() => navigate(`/documents/${doc._id}`)}
            style={{
              background: "#252526",
              padding: "20px",
              borderRadius: "8px",
              border: "1px solid #333",
              cursor: "pointer",
              transition: "0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = "#61dafb")}
          >
            <h3 style={{ margin: "0 0 10px 0", fontSize: "16px" }}>
              {doc.title || "Untitled"}
            </h3>
            <span
              style={{
                fontSize: "12px",
                color: "#888",
                background: "#333",
                padding: "2px 6px",
                borderRadius: "4px",
              }}
            >
              {doc.language || "js"}
            </span>
            <button
              onClick={(e) => deleteDocument(e, doc._id)}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "transparent",
                color: "#ff5f5f",
                border: "none",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              🗑️
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- EDITOR COMPONENT ---
function EditorPage() {
  const { id: documentId } = useParams();
  const docId = documentId;
  const navigate = useNavigate();

  const editorRef = useRef(null);
  const yTextRef = useRef(null);
  const yMapRef = useRef(null);
  const yChatRef = useRef(null);

  const [title, setTitle] = useState("Loading...");
  const [activeUsers, setActiveUsers] = useState([]);
  const [copyStatus, setCopyStatus] = useState("Copy Link");
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("");
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) return navigate("/login");

    fetch(`http://localhost:3001/documents/${docId}/meta`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.title) setTitle(data.title);
        if (data.language) setLanguage(data.language);
      })
      .catch(() => setTitle("New Project"));
  }, [docId, navigate]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopyStatus("Copied! ✅");
      setTimeout(() => setCopyStatus("Copy Link"), 2000);
    });
  };

  const handleDownload = () => {
    if (!yTextRef.current) return;
    const code = yTextRef.current.toString();
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.replace(/\s+/g, "_")}.${
      EXTENSIONS[language] || "txt"
    }`;
    link.click();
  };

  const runCode = () => {
    if (!yTextRef.current) return;
    const code = yTextRef.current.toString();
    const logs = [];
    const customConsole = {
      log: (...args) =>
        logs.push(
          args
            .map((a) => (typeof a === "object" ? JSON.stringify(a) : a))
            .join(" ")
        ),
      error: (...args) => logs.push("❌ " + args.join(" ")),
    };
    try {
      new Function("console", code)(customConsole);
      setOutput(logs.join("\n") || "Executed (no output).");
    } catch (err) {
      setOutput("❌ Runtime Error: " + err.message);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !yChatRef.current) return;
    yChatRef.current.push([
      {
        text: chatInput,
        sender: MY_NAME,
        color: MY_COLOR,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setChatInput("");
  };

  function handleEditorDidMount(editor) {
    editorRef.current = editor;
    const ydoc = new Y.Doc();
    const yText = ydoc.getText("monaco");
    const yMap = ydoc.getMap("config");
    const yChat = ydoc.getArray("chat");

    yTextRef.current = yText;
    yMapRef.current = yMap;
    yChatRef.current = yChat;

    const awareness = new awarenessProtocol.Awareness(ydoc);
    awareness.setLocalStateField("user", { name: MY_NAME, color: MY_COLOR });

    yMap.observe(() => {
      if (yMap.has("language")) setLanguage(yMap.get("language"));
      if (yMap.has("title")) setTitle(yMap.get("title"));
    });

    yChat.observe(() => setMessages(yChat.toArray()));
    awareness.on("change", () => {
      const users = [];
      awareness.getStates().forEach((s) => s.user && users.push(s.user));
      setActiveUsers(users);
    });

    new MonacoBinding(
      yText,
      editorRef.current.getModel(),
      new Set([editorRef.current]),
      awareness
    );

    socket.on("load-document", (data) =>
      Y.applyUpdate(ydoc, new Uint8Array(data))
    );
    socket.on("receive-changes", (delta) =>
      Y.applyUpdate(ydoc, new Uint8Array(delta))
    );
    socket.on("cursor-update", (upd) =>
      awarenessProtocol.applyAwarenessUpdate(
        awareness,
        new Uint8Array(upd),
        socket.id
      )
    );

    ydoc.on("update", (u) =>
      socket.emit("send-changes", { documentId: docId, delta: Array.from(u) })
    );
    awareness.on("update", () => {
      const snap = awarenessProtocol.encodeAwarenessUpdate(awareness, [
        ydoc.clientID,
      ]);
      socket.emit("cursor-movement", {
        documentId: docId,
        awarenessUpdate: Array.from(snap),
      });
    });

    socket.emit("join-document", docId);
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#1e1e1e",
        color: "white",
      }}
    >
      <nav
        style={{
          padding: "10px 20px",
          background: "#20232a",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #333",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <span
            onClick={() => navigate("/")}
            style={{
              cursor: "pointer",
              color: "#888",
              fontSize: "20px",
              fontWeight: "bold",
            }}
          >
            ←
          </span>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              yMapRef.current.set("title", e.target.value);
            }}
            style={{
              background: "transparent",
              color: "#61dafb",
              border: "none",
              fontWeight: "bold",
              fontSize: "16px",
              outline: "none",
            }}
          />
          <button
            onClick={copyToClipboard}
            style={{
              padding: "5px 12px",
              borderRadius: "4px",
              border: "none",
              background: "#333",
              color: "#61dafb",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            {copyStatus}
          </button>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <select
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
              yMapRef.current.set("language", e.target.value);
            }}
            style={{
              padding: "4px",
              background: "#1e1e1e",
              color: "#fff",
              border: "1px solid #444",
            }}
          >
            <option value="javascript">JS</option>
            <option value="python">Python</option>
            <option value="html">HTML</option>
          </select>
          <button
            onClick={runCode}
            style={{
              background: "#4caf50",
              color: "white",
              border: "none",
              padding: "5px 15px",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            ▶ Run
          </button>
          <button
            onClick={handleDownload}
            style={{
              background: "#444",
              color: "white",
              border: "none",
              padding: "5px 15px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            💾
          </button>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {activeUsers.map((u, i) => (
            <div
              key={i}
              title={u.name}
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: u.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                border: "2px solid #20232a",
                marginLeft: "-10px",
                color: "#000",
                fontWeight: "bold",
              }}
            >
              {u.name.charAt(0)}
            </div>
          ))}
        </div>
      </nav>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid #333",
          }}
        >
          <div style={{ flex: 1 }}>
            <Editor
              height="100%"
              language={language}
              theme="vs-dark"
              onMount={handleEditorDidMount}
              options={{ fontSize: 16, automaticLayout: true }}
            />
          </div>
          <div
            style={{
              height: "25%",
              background: "#000",
              padding: "12px",
              overflowY: "auto",
              fontFamily: "monospace",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: "#555",
                fontSize: "11px",
                marginBottom: "5px",
              }}
            >
              <span>CONSOLE OUTPUT</span>
              <button
                onClick={() => setOutput("")}
                style={{
                  background: "transparent",
                  color: "#444",
                  border: "none",
                }}
              >
                Clear
              </button>
            </div>
            <pre
              style={{ margin: 0, color: "#00ff00", whiteSpace: "pre-wrap" }}
            >
              {output || "> Ready..."}
            </pre>
          </div>
        </div>
        <div
          style={{
            width: "300px",
            display: "flex",
            flexDirection: "column",
            background: "#252526",
          }}
        >
          <div
            style={{
              padding: "10px",
              borderBottom: "1px solid #333",
              fontSize: "13px",
              color: "#aaa",
              fontWeight: "bold",
            }}
          >
            CHAT
          </div>
          <div
            style={{
              flex: 1,
              padding: "10px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {messages.map((msg, i) => (
              <div key={i} style={{ fontSize: "13px" }}>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: msg.color, fontWeight: "bold" }}>
                    {msg.sender}
                  </span>
                  <span style={{ color: "#555", fontSize: "10px" }}>
                    {msg.timestamp}
                  </span>
                </div>
                <div
                  style={{
                    background: "#333",
                    padding: "6px 10px",
                    borderRadius: "4px",
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <form
            onSubmit={sendMessage}
            style={{ padding: "10px", borderTop: "1px solid #333" }}
          >
            <input
              placeholder="Message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                background: "#1e1e1e",
                color: "white",
                border: "1px solid #444",
                borderRadius: "4px",
              }}
            />
          </form>
        </div>
      </div>
    </div>
  );
}

// --- ROUTER ---
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route
          path="/"
          element={isAuthenticated() ? <Dashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/documents/:id"
          element={
            isAuthenticated() ? <EditorPage /> : <Navigate to="/login" />
          }
        />
      </Routes>
    </Router>
  );
}
