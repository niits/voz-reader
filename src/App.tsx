import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import BoxPage from "./pages/BoxPage";
import ThreadPage from "./pages/ThreadPage";
import SettingsPage from "./pages/SettingsPage";
import "./App.css";

export default function App() {
  return (
    <div className="app">
      <Header />
      <main className="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/box/:id" element={<BoxPage />} />
          <Route path="/thread/:id" element={<ThreadPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}
