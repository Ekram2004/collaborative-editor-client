import React from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidV4 } from "uuid";

function Home() {
  const navigate = useNavigate();

  const createNewDoc = () => {
    const id = uuidV4(); // Generates something like '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
    navigate(`/documents/${id}`);
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#282c34",
        color: "white",
      }}
    >
      <h1>Collaborative Code Editor</h1>
      <button
        onClick={createNewDoc}
        style={{
          padding: "15px 30px",
          fontSize: "18px",
          cursor: "pointer",
          backgroundColor: "#61dafb",
          border: "none",
          borderRadius: "5px",
          fontWeight: "bold",
        }}
      >
        Create New Document
      </button>
    </div>
  );
}

export default Home;
