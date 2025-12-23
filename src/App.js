import React, { useState, useRef, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useParams,
  useNavigate,
} from "react-router-dom";
import { v4 as uuidV4 } from "uuid";
import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";
import { io } from "socket.io-client";

const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:3001"
    : "https://collaborative-editor-server.onrender.com";

const socket = io(API_BASE);

// --- AUTH PAGE ---
function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: "", password: "" });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch(
      `${API_BASE}/auth/${isLogin ? "login" : "register"}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }
    );
    const data = await res.json();
    if (res.ok) {
      if (isLogin) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username);
        navigate("/");
      } else {
        alert("Registered! Please login.");
        setIsLogin(true);
      }
    } else alert(data.message);
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2>{isLogin ? "Login" : "Register"}</h2>
        <input
          style={styles.input}
          placeholder="Username"
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button style={styles.btn} type="submit">
          {isLogin ? "Login" : "Sign Up"}
        </button>
        <p style={{ cursor: "pointer" }} onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "Create account" : "Have account?"}
        </p>
      </form>
    </div>
  );
}

// --- DASHBOARD ---
function Dashboard() {
  const [docs, setDocs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE}/documents`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((r) => r.json())
      .then(setDocs);
  }, []);

  const createDoc = async () => {
    const id = uuidV4();
    await fetch(`${API_BASE}/documents/${id}/meta`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ title: "Untitled", language: "javascript" }),
    });
    navigate(`/documents/${id}`);
  };

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <button style={styles.btn} onClick={createDoc}>
        + New Project
      </button>
      <div style={styles.grid}>
        {docs.map((doc) => (
          <div
            key={doc._id}
            style={styles.card}
            onClick={() => navigate(`/documents/${doc._id}`)}
          >
            {doc.title} ({doc.language})
          </div>
        ))}
      </div>
    </div>
  );
}

// --- EDITOR PAGE ---
function EditorPage() {
  const { id: docId } = useParams();
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("javascript");
  const ydocRef = useRef(new Y.Doc());

  useEffect(() => {
    fetch(`${API_BASE}/documents/${docId}/meta`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setTitle(data.title);
        setLanguage(data.language);
      });
  }, [docId]);

  const handleOnMount = (editor) => {
    const yText = ydocRef.current.getText("monaco");
    new MonacoBinding(yText, editor.getModel(), new Set([editor]));

    socket.emit("join-document", docId);
    socket.on("load-document", (data) =>
      Y.applyUpdate(ydocRef.current, new Uint8Array(data))
    );
    socket.on("receive-changes", (delta) =>
      Y.applyUpdate(ydocRef.current, new Uint8Array(delta))
    );

    ydocRef.current.on("update", (update) => {
      socket.emit("send-changes", {
        documentId: docId,
        delta: Array.from(update),
      });
    });
  };

  return (
    <div style={{ height: "100vh" }}>
      <div style={styles.nav}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={styles.title}
        />
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="javascript">JS</option>
          <option value="python">Python</option>
        </select>
      </div>
      <Editor
        height="90vh"
        theme="vs-dark"
        language={language}
        onMount={handleOnMount}
      />
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#121212",
    color: "white",
  },
  form: {
    background: "#1e1e1e",
    padding: "40px",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  input: {
    padding: "10px",
    borderRadius: "4px",
    border: "1px solid #333",
    background: "#000",
    color: "white",
  },
  btn: {
    padding: "10px",
    background: "#007bff",
    color: "white",
    border: "none",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "20px",
    marginTop: "20px",
  },
  card: {
    padding: "20px",
    background: "#1e1e1e",
    borderRadius: "8px",
    cursor: "pointer",
  },
  nav: {
    padding: "10px",
    background: "#1e1e1e",
    display: "flex",
    justifyContent: "space-between",
  },
  title: {
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: "1.2rem",
  },
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route
          path="/"
          element={
            localStorage.getItem("token") ? (
              <Dashboard />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/documents/:id"
          element={
            localStorage.getItem("token") ? (
              <EditorPage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
}
