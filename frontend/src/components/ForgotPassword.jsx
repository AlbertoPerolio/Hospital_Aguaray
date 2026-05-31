import { useState } from "react";
import API from "../api/axios"; // Asegúrate de que API tenga tu URL base

export default function ForgotPassword({ onClose }) {
  const [formData, setFormData] = useState({
    user: "",
    securityAnswer: "",
    newPassword: "",
  });

  const handleReset = async (e) => {
    // Si se activó como submit, evitamos navegación/recarga
    if (e?.preventDefault) e.preventDefault();
    if (e?.stopPropagation) e.stopPropagation();
    e.preventDefault();
    e.stopPropagation();
    console.log("[ForgotPassword] handleReset ejecutado", formData);
    try {
      await API.post("/auth/reset-password", formData);
      alert("¡Contraseña restablecida con éxito! Ya puedes iniciar sesión.");
      onClose();
    } catch (err) {
      console.error("Error completo del servidor:", err.response?.data);
      const mensaje =
        err.response?.data?.body?.mensaje ||
        err.response?.data?.mensaje ||
        "Error al restablecer la contraseña. Verifique sus datos.";

      alert(mensaje);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h3>Restablecer Contraseña</h3>
        <form onSubmit={handleReset}>
          <input
            type="text"
            placeholder="Usuario o Email"
            required
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, user: e.target.value }))
            }
          />
          <input
            type="text"
            placeholder="Respuesta de seguridad"
            required
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                securityAnswer: e.target.value,
              }))
            }
          />
          <input
            type="password"
            placeholder="Nueva contraseña"
            required
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, newPassword: e.target.value }))
            }
          />
          <button type="button" onClick={handleReset} className="btn-auth">
            Cambiar contraseña
          </button>

          <button type="button" onClick={onClose} className="btn-cancel">
            Cancelar
          </button>
        </form>
      </div>
    </div>
  );
}
