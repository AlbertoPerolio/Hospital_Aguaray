import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom"; // Para poder ir al login haciendo clic
import "../styles/login.css";

// Traemos tus preguntas de seguridad exactas del backend
const SECURITY_QUESTIONS = [
  { id: 1, text: "¿Cuál fue el nombre de tu primera mascota?" },
  { id: 2, text: "¿En qué ciudad nacieron tus padres?" },
  { id: 3, text: "¿Cuál es tu película favorita de la infancia?" },
  { id: 4, text: "¿Cómo se llamaba tu primera escuela?" },
];

export default function Register() {
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    user: "",
    email: "",
    password: "",
    name: "",
    surname: "",
    securityQuestionId: 1,
    securityAnswer: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "securityQuestionId" ? parseInt(value, 10) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const result = await register(formData);
    if (result.success) {
      setSuccess(true);

      setFormData({
        user: "",
        email: "",
        password: "",
        name: "",
        surname: "",
        securityQuestionId: 1,
        securityAnswer: "",
      });

      // Ir directo al panel del usuario (perfil) una vez creado
      // (Ajusta el destino si tu panel es otra ruta)
      setTimeout(() => {
        window.location.href = "/";
      }, 300);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Crear Cuenta</h2>

        {error && <div className="error-message">{error}</div>}
        {success && (
          <div className="success-message">
            ¡Usuario creado! Ya podés iniciar sesión.
          </div>
        )}

        <div className="form-group">
          <label>Usuario *</label>
          <input
            type="text"
            name="user"
            value={formData.user}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Contraseña *</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Nombre</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Apellido</label>
          <input
            type="text"
            name="surname"
            value={formData.surname}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Pregunta de Seguridad *</label>
          <select
            name="securityQuestionId"
            value={formData.securityQuestionId}
            onChange={handleChange}
          >
            {SECURITY_QUESTIONS.map((q) => (
              <option key={q.id} value={q.id}>
                {q.text}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Respuesta de Seguridad *</label>
          <input
            type="text"
            name="securityAnswer"
            value={formData.securityAnswer}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="btn-auth">
          Registrarse
        </button>

        <p className="auth-switch">
          ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión acá</Link>
        </p>
      </form>
    </div>
  );
}
