import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function GoogleLoginButton() {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadScript = () => {
      if (window.google?.accounts?.id) {
        if (!cancelled) setGoogleReady(true);
        return;
      }

      const existing = document.getElementById("google-identity-script");
      if (existing) {
        existing.addEventListener("load", () => {
          if (!cancelled) setGoogleReady(true);
        });
        return;
      }

      const script = document.createElement("script");
      script.id = "google-identity-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (!cancelled) setGoogleReady(!!window.google?.accounts?.id);
      };
      document.body.appendChild(script);
    };

    loadScript();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleGoogleCredential = async (credential) => {
    // Enviamos el id_token completo al backend para que lo verifique seguro.
    setLoading(true);
    try {
      const result = await loginWithGoogle({ credential });
      if (result.success) {
        // Evitar recarga completa: navegar SPA
        window.history.pushState({}, "", "/");
        window.dispatchEvent(new PopStateEvent("popstate"));
      } else {
        alert(result.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!googleReady) return;

    // Actualizamos una referencia global con el handler actual.
    // Esto evita que el callback de Google quede "atrapado" en una versión vieja del componente (stale closure).
    window.__GOOGLE_LOGIN_HANDLER__ = handleGoogleCredential;

    if (window.__GSI_INITIALIZED__) return;

    const clientId =
      window.__VITE_GOOGLE_CLIENT_ID__ ||
      import.meta?.env?.VITE_GOOGLE_CLIENT_ID ||
      "";

    if (!clientId) {
      console.warn(
        "VITE_GOOGLE_CLIENT_ID no configurado (window.__VITE_GOOGLE_CLIENT_ID__ ni import.meta.env).",
      );
      return;
    }

    window.__GSI_INITIALIZED__ = true;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (resp) => {
        if (resp?.credential) {
          // Llamamos al handler guardado en el bridge global
          window.__GOOGLE_LOGIN_HANDLER__?.(resp.credential);
        } else {
          alert("Respuesta inválida de Google. Intentá de nuevo.");
        }
      },
    });
  }, [googleReady]);

  const handleClick = () => {
    if (window.google?.accounts?.id && googleReady) {
      // prompt() muestra el selector de cuentas de Google
      window.google.accounts.id.prompt();
    }
  };

  return (
    <button
      type="button"
      className="btn-auth"
      disabled={loading || !googleReady}
      onClick={handleClick}
    >
      {loading
        ? "Conectando..."
        : !googleReady
          ? "Cargando Google..."
          : "Continuar con Google"}
    </button>
  );
}
