import React, { useState, useRef } from "react";

function EditorPage() {
  const { id: documentId } = useParams();
  const editorRef = useRef(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [copyStatus, setCopyStatus] = useState("Copy Invite Link");

  // Function to copy URL to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopyStatus("Copied! ✅");
      setTimeout(() => setCopyStatus("Copy Invite Link"), 2000);
    });
  };