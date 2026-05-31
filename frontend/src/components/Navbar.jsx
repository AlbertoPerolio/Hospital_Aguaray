import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/navbar.css"; // Archivo para los estilos de la barra

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login"); // Al cerrar sesión lo mandamos al login
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Hospital Aguaray</Link>
      </div>

      <div className="navbar-links">
        {user ? (
          <div className="user-menu">
            <Link to="/turn">Pedir Turno</Link>

            {/* Transformamos el saludo en un link al perfil */}
            <Link
              to="/profile"
              className="welcome-text"
              style={{ marginRight: "15px", textDecoration: "none" }}
            >
              Hola, <strong style={{ color: "#007bff" }}>{user.user}</strong>
            </Link>

            <button onClick={handleLogout} className="btn-logout">
              Cerrar Sesión
            </button>
          </div>
        ) : (
          //  Vista si el usuario NO está logueado (Invitado)
          <div className="auth-links">
            <Link to="/turn">Pedir Turno</Link>

            <Link to="/login" className="link-login">
              Iniciar Sesión
            </Link>
            <Link to="/register" className="btn-register">
              Registrarse
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
