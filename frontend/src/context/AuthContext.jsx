import { createContext, useState, useEffect, useContext } from "react";
import API from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Al cargar la app, verificamos el estado de la sesión
  useEffect(() => {
    // Guardamos la referencia al montaje para que el check no pise un login reciente
    let cancelled = false;

    const checkLogin = async () => {
      try {
        const res = await API.get("/user-management/profile");
        if (cancelled) return;

        // Normalizamos: tu backend generalmente manda { body: user }
        const profileUser = res?.data?.body;
        setUser(profileUser ?? null);
      } catch (err) {
        if (cancelled) return;
        setUser(null);
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    };

    checkLogin();

    return () => {
      cancelled = true;
    };
  }, []);

  // 🔑 Iniciar Sesión (Google)
  const loginWithGoogle = async (googlePayload) => {
    try {
      const res = await API.post("/auth/google", googlePayload);

      const userData =
        res?.data?.user || res?.data?.body?.user || res?.data?.body || null;

      setUser(userData);

      // Importante: en esta app el token se guarda en cookie, pero algunas
      // veces el estado de `user` necesita refrescarse.
      // La cookie del backend se escribe con async; en algunos casos
      // el primer GET puede llegar antes de que la cookie esté disponible.
      const refreshProfileWithRetry = async () => {
        const delays = [0, 150, 400];
        let last = null;
        for (const d of delays) {
          if (d) await new Promise((r) => setTimeout(r, d));
          try {
            const profileRes = await API.get("/user-management/profile");
            last = profileRes?.data?.body ?? null;
            break;
          } catch (e) {
            last = null;
          }
        }
        return last;
      };

      const refreshed = await refreshProfileWithRetry();
      setUser(refreshed ?? userData);

      return {
        success: true,
        user: refreshed ?? userData,
        message: res?.data?.body?.mensaje,
      };
    } catch (error) {
      const mensaje =
        error.response?.data?.body?.mensaje ||
        error.response?.data?.mensaje ||
        error.response?.data?.body ||
        "Error al iniciar sesión con Google";

      return {
        success: false,
        message: mensaje,
      };
    }
  };

  const login = async (username, password) => {
    try {
      const res = await API.post("/auth/login", { user: username, password });

      // Backend manda: body: { mensaje, user }
      // Normalizamos SIEMPRE el shape del usuario a res.data.body.user (si existe)
      const userData =
        res?.data?.body?.user ||
        res?.data?.body?.body ||
        res?.data?.body ||
        null;

      // 1. Seteamos el estado INMEDIATAMENTE
      setUser(userData);

      try {
        const profileRes = await API.get("/user-management/profile");
        setUser(profileRes?.data?.body ?? userData);
      } catch {
        // si falla, mantenemos userData
      }

      return {
        success: true,
        user: userData,
        message: res?.data?.body?.mensaje,
      };
    } catch (error) {
      const mensaje =
        error.response?.data?.body?.mensaje ||
        error.response?.data?.mensaje ||
        error.response?.data?.body ||
        "Usuario o contraseña incorrectos";

      return {
        success: false,
        message: mensaje,
      };
    }
  };
  // 📝 Registrarse
  const register = async (userData) => {
    try {
      await API.post("/user", userData);

      const loginRes = await login(userData.user, userData.password);

      return {
        success: true,
        user: loginRes?.user ?? null,
        message: loginRes?.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.body || "Error al registrar el usuario",
      };
    }
  };

  // 🚪 Cerrar Sesión
  const logout = async () => {
    try {
      await API.post("/auth/logout");
    } catch (err) {
      console.error("Error al avisar al backend del logout", err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, login, loginWithGoogle, register, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
