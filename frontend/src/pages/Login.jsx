import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import ForgotPassword from "../components/ForgotPassword";
import GoogleLoginButton from "../components/GoogleLoginButton";
import "../styles/login.css";

export default function Login() {
  const { login, loginWithGoogle } = useAuth();

  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const result = await login(username, password);
    if (result.success) {
      navigate("/");
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Iniciar Sesión</h2>

        <div style={{ marginBottom: 12 }}>
          {/* Google Identity Services: inyectado vía script en este componente */}
          <GoogleLoginButton />
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label>Usuario</label>
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError("");
            }}
            required
          />
        </div>

        <div className="form-group">
          <label>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            required
          />
        </div>

        <button type="submit" className="btn-auth">
          Ingresar
        </button>

        <p className="auth-switch">
          ¿No estás registrado? <Link to="/register">Creá una cuenta acá</Link>
        </p>

        <p className="auth-switch">
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="btn-forgot"
          >
            ¿Olvidaste tu contraseña?
          </button>
          {showResetModal && (
            <ForgotPassword onClose={() => setShowResetModal(false)} />
          )}
        </p>
      </form>
    </div>
  );
}
