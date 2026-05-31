import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import "../styles/profile.css";
import AddressBook from "../components/AddressBook";
import UserAdminEditor from "../components/UserAdminEditor";
import DoctorChecklist from "../components/Staff/DoctorChecklist";
import TurnManagement from "../components/Staff/TurnManagement";
import PresentialBooking from "../components/Staff/PresentialBooking";

const ROLES = {
  USUARIO: 1,
  SECRETARIO: 2,
  ADMIN: 3,
};

export default function Profile() {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  // 📝 Estados Datos de Perfil
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    user: "",
    password: "",
    currentPassword: "",
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  // 👥 Estados Administración de Usuarios (Solo Admin)
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchUserQuery, setSearchUserQuery] = useState("");

  // 📦 Estados Productos/Ofertas (SECRETARIO & Admin)
  const [productsList, setProductsList] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchProductQuery, setSearchProductQuery] = useState("");

  // 📑 Estados para el Modal de Crear/Editar Producto
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // Si es null estamos Creando, si tiene datos Editando
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    brand: "",
    category: "",
    price: "",
    stock: "",
  });
  const [productImage, setProductImage] = useState(null);

  // 1. Cargar datos del perfil propio
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await API.get("/user-management/profile");
        const data = res.data.body;
        setFormData((prev) => ({
          ...prev,
          name: data.name || "",
          surname: data.surname || "",
          email: data.email || "",
          user: data.user || "",
          dni: data.dni || "",
        }));
      } catch (err) {
        setMessage({ type: "error", text: "No se pudieron cargar los datos." });
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  // 2. Cargar lista completa de usuarios (Admin y Secretario)
  useEffect(() => {
    if (activeTab !== "admin-users") return;
    if (
      !user ||
      (user?.id_role !== ROLES.ADMIN && user?.id_role !== ROLES.SECRETARIO)
    ) {
      setUsersList([]);
      return;
    }

    const fetchAllUsers = async () => {
      setLoadingUsers(true);
      try {
        const res = await API.get("/user-management/admin/all");
        setUsersList(res.data.body || []);
      } catch (err) {
        console.error(err);
        setUsersList([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchAllUsers();
  }, [activeTab, user]);

  // Manejadores de cambios simples
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "securityQuestionId" ? parseInt(value, 10) : value,
    });
  };
  const handleProductChange = (e) =>
    setProductForm({ ...productForm, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setProductImage(e.target.files[0]);

  // Guardar Cambios de Perfil
  const handleSubmitProfile = async (e) => {
    e.preventDefault();

    const payload = { ...formData };

    // --- Contraseña (opcional) ---
    const shouldChangePassword = !!payload.password;
    if (!shouldChangePassword) {
      delete payload.password;
      delete payload.currentPassword;
    }

    // --- Seguridad (opcional) ---
    // Si no se está cambiando pregunta/respuesta, no mandamos nada de seguridad.
    const shouldChangeSecurity =
      payload.securityQuestionId !== "" && payload.securityAnswer !== "";

    if (!shouldChangeSecurity) {
      delete payload.securityQuestionId;
      delete payload.securityAnswer;
      delete payload.currentSecurityAnswer;
    }

    try {
      const res = await API.put("/user-management/profile", payload);
      if (setUser) setUser(res.data.body);
      alert("¡Perfil actualizado!");
      window.location.reload();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.body || "Error al actualizar.",
      });
    }
  };

  // Cambiar rol de SECRETARIO (Solo Admin)
  const handleRoleChange = async (id_user, currentRole) => {
    const nuevoRol =
      currentRole === ROLES.SECRETARIO ? ROLES.USUARIO : ROLES.SECRETARIO;
    if (!window.confirm(`¿Modificar rol de este usuario?`)) return;
    try {
      await API.put(`/user-management/admin/role/${id_user}`, {
        id_role: nuevoRol,
      });
      setUsersList((prev) =>
        prev.map((u) =>
          u.id_user === id_user ? { ...u, id_role: nuevoRol } : u,
        ),
      );
    } catch (err) {
      alert("Error al cambiar rol");
    }
  };

  // 🎯 Filtros en tiempo real
  const filteredUsers = usersList.filter((u) => {
    const q = searchUserQuery.toLowerCase().trim();
    return (
      `${u.name} ${u.surname}`.toLowerCase().includes(q) ||
      (u.user || "").toLowerCase().includes(q)
    );
  });

  const [editingUser, setEditingUser] = useState(null);

  const getRoleLabel = (roleId) => {
    if (roleId === ROLES.ADMIN) return "Administrador";
    if (roleId === ROLES.SECRETARIO) return "Secretario/A";
    return "USUARIO";
  };

  if (loading) return <div className="loading-text">Cargando panel...</div>;

  return (
    <div className="dashboard-container">
      {/*  MENÚ LATERAL */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-user-info">
          <div className="user-avatar">👤</div>
          <h3>{formData.user}</h3>
          <span className={`badge-role role-${user?.id_role}`}>
            {getRoleLabel(user?.id_role)}
          </span>
        </div>

        <nav className="sidebar-menu">
          <button
            className={`menu-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            Editar Perfil
          </button>
          {(user?.id_role === ROLES.ADMIN ||
            user?.id_role === ROLES.SECRETARIO) && (
            <>
              <button
                className={`menu-btn ${activeTab === "admin-users" ? "active" : ""}`}
                onClick={() => setActiveTab("admin-users")}
              >
                Gestionar Usuarios
              </button>
              <button
                className={`menu-btn ${activeTab === "admin-doctors" ? "active" : ""}`}
                onClick={() => setActiveTab("admin-doctors")}
              >
                Disponibilidad Médica
              </button>
              <button
                className={`menu-btn ${activeTab === "admin-turns" ? "active" : ""}`}
                onClick={() => setActiveTab("admin-turns")}
              >
                Confirmar Turnos
              </button>
              <button
                className={`menu-btn ${activeTab === "admin-presential" ? "active" : ""}`}
                onClick={() => setActiveTab("admin-presential")}
              >
                Turno Presencial
              </button>
            </>
          )}

          <button
            className={`menu-btn ${activeTab === "my-addresses" ? "active" : ""}`}
            onClick={() => setActiveTab("my-addresses")}
          >
            Mis Direcciones
          </button>
        </nav>
      </aside>

      {/* CONTENIDO DEL PANEL */}
      <main className="dashboard-content">
        {editingUser && (
          <UserAdminEditor
            userRow={editingUser}
            onClose={() => setEditingUser(null)}
            onSaved={async () => {
              setEditingUser(null);
            }}
          />
        )}

        {/* PESTAÑA A: EDITAR PERFIL */}
        {activeTab === "profile" && (
          <div className="profile-card-v2">
            <h2>Editar mi Información</h2>
            {message.text && (
              <div className={`alert-banner ${message.type}`}>
                {message.text}
              </div>
            )}
            <form onSubmit={handleSubmitProfile} className="profile-form">
              <div className="form-group">
                <label>Nombre de Usuario</label>
                <input
                  type="text"
                  name="user"
                  value={formData.user}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Apellido</label>
                  <input
                    type="text"
                    name="surname"
                    value={formData.surname}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Correo Electrónico</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <hr className="profile-divider" />
              <h3>Seguridad de la Cuenta</h3>
              <div className="form-group">
                <label>Contraseña Actual</label>
                <input
                  type="password"
                  name="currentPassword"
                  placeholder="Contraseña actual"
                  value={formData.currentPassword}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Nueva Contraseña (opcional)</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Nueva contraseña (opcional)"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              {/* Pregunta/Respuesta de seguridad */}
              <div className="form-group">
                <label>Pregunta de Seguridad</label>
                <select
                  name="securityQuestionId"
                  value={formData.securityQuestionId}
                  onChange={handleChange}
                >
                  {/* Igual que en Register.jsx */}
                  <option value={1}>
                    ¿Cuál fue el nombre de tu primera mascota?
                  </option>
                  <option value={2}>¿En qué ciudad nacieron tus padres?</option>
                  <option value={3}>
                    ¿Cuál es tu película favorita de la infancia?
                  </option>
                  <option value={4}>
                    ¿Cómo se llamaba tu primera escuela?
                  </option>
                </select>
              </div>
              <div className="form-group">
                <label>Respuesta Nueva</label>
                <input
                  type="text"
                  name="securityAnswer"
                  placeholder="Escribí la respuesta nueva"
                  value={formData.securityAnswer}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Respuesta de Seguridad Actual</label>
                <input
                  type="text"
                  name="currentSecurityAnswer"
                  placeholder="Confirmar respuesta anterior"
                  value={formData.currentSecurityAnswer}
                  onChange={handleChange}
                />
              </div>

              <button type="submit" className="btn-save-profile">
                Guardar Cambios
              </button>
            </form>
          </div>
        )}

        {/* PESTAÑA C: MIS DIRECCIONES (Todos los usuarios) */}
        {activeTab === "my-addresses" && (
          <div className="profile-card-v2 wide-card">
            <AddressBook />
          </div>
        )}

        {/* GESTIÓN DE DISPONIBILIDAD (Checklist 7 AM) */}
        {activeTab === "admin-doctors" && (
          <div className="profile-card-v2 wide-card">
            <DoctorChecklist />
          </div>
        )}

        {/* GESTIÓN DE TURNOS PENDIENTES */}
        {activeTab === "admin-turns" && (
          <div className="profile-card-v2 wide-card">
            <TurnManagement />
          </div>
        )}

        {/* REGISTRO DE TURNOS PRESENCIALES */}
        {activeTab === "admin-presential" && (
          <div className="profile-card-v2 wide-card">
            <PresentialBooking />
          </div>
        )}

        {/* PESTAÑA D: GESTIÓN DE USUARIOS */}
        {activeTab === "admin-users" && (
          <div className="profile-card-v2 wide-card">
            <h2>Panel de Administración: Usuarios</h2>
            <p className="subtitle-admin">
              Panel para gestionar lo usuario podrás cambiar el rol de cada uno
              editar datos y direccion (1 por usuario).
            </p>

            <div className="search-bar-container">
              <input
                type="text"
                placeholder="🔍 Buscar por nombre, apellido o nick..."
                className="dashboard-search-input"
                value={searchUserQuery}
                onChange={(e) => setSearchUserQuery(e.target.value)}
              />
            </div>

            {loadingUsers ? (
              <p>Cargando listado de usuarios...</p>
            ) : filteredUsers.length === 0 ? (
              <p className="no-results-txt">No se encontraron usuarios.</p>
            ) : (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Usuario</th>
                      <th>Nombre Completo</th>
                      <th>Email</th>
                      <th>Rol</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id_user}>
                        <td>{u.id_user}</td>
                        <td>
                          <strong>{u.user}</strong>
                        </td>
                        <td>
                          {u.name} {u.surname}
                        </td>
                        <td>{u.email}</td>
                        <td>
                          <span
                            className={`table-role-badge role-${u.id_role}`}
                          >
                            {getRoleLabel(u.id_role)}
                          </span>
                        </td>
                        <td>
                          {u.id_role !== ROLES.ADMIN ? (
                            <button
                              className={`btn-action-role ${u.id_role === ROLES.SECRETARIO ? "btn-demote" : "btn-promote"}`}
                              onClick={() =>
                                handleRoleChange(u.id_user, u.id_role)
                              }
                            >
                              {u.id_role === ROLES.SECRETARIO
                                ? "Quitar Secretario/a"
                                : "Hacer Secretario/a"}
                            </button>
                          ) : (
                            <span className="txt-protected">Protegido</span>
                          )}

                          <button
                            className="btn-action-role btn-promote"
                            style={{ marginLeft: 8 }}
                            type="button"
                            onClick={() => setEditingUser(u)}
                          >
                            Editar datos
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
