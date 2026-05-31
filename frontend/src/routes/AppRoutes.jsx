import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Home from "../pages/Home";
import Profile from "../pages/Profile";
import Navbar from "../components/Navbar";
import Turn from "../pages/Turn";
import { useAuth } from "../context/AuthContext";

export default function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        Cargando...
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={loading ? null : !user ? <Login /> : <Navigate to="/" />}
        />
        <Route
          path="/register"
          element={loading ? null : !user ? <Register /> : <Navigate to="/" />}
        />

        {/*  RUTA PROTEGIDA: Solo usuarios logueados ven su carrito */}
        <Route
          path="/turn"
          element={user ? <Turn /> : <Navigate to="/login" />}
        />
        <Route
          path="/profile"
          element={user ? <Profile /> : <Navigate to="/login" />}
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}
