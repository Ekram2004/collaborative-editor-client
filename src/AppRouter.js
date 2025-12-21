import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Home from "./Home";
import App from "./App"; // Your main editor component

function AppRouter() {
  return (
    <Router>
      <Routes>
        {/* Landing page with the "Create" button */}
        <Route path="/" element={<Home />} />

        {/* The actual editor page */}
        <Route path="/documents/:id" element={<App />} />

        {/* Fallback: Redirect unknown paths to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default AppRouter;
