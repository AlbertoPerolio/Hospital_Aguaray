import { useEffect, useState } from "react";
import axios from "axios";
import API from "../api/axios";

export default function AddressBook() {
  // Direcciones
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  // Para crear/editar
  const emptyAddress = {
    street: "",
    number: "",
    floor: "",
    apartment: "",
    postalCode: "",
    city: "",
    province: "",
    description: "",
  };

  const [addressData, setAddressData] = useState(emptyAddress);

  // Progreso Georef
  const [provincias, setProvincias] = useState([]);
  const [localidades, setLocalidades] = useState([]);
  const [loadingProvincias, setLoadingProvincias] = useState(false);
  const [loadingLocalidades, setLoadingLocalidades] = useState(false);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await API.get("/address");
      setAddresses(res.data.body || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const cargarProvinciasArgentinas = async () => {
    setLoadingProvincias(true);
    try {
      const res = await axios.get(
        "https://apis.datos.gob.ar/georef/api/provincias?campos=id,nombre",
      );
      const listaOrdenada = (res.data.provincias || []).sort((a, b) =>
        a.nombre.localeCompare(b.nombre),
      );
      setProvincias(listaOrdenada);
    } catch {
      // fallback minimo: no romper UI
      setProvincias([]);
    } finally {
      setLoadingProvincias(false);
    }
  };

  useEffect(() => {
    cargarProvinciasArgentinas();
  }, []);

  useEffect(() => {
    if (!addressData.province) {
      setLocalidades([]);
      return;
    }

    const cargarLocalidades = async () => {
      setLoadingLocalidades(true);
      try {
        const res = await axios.get(
          `https://apis.datos.gob.ar/georef/api/municipios?provincia=${encodeURIComponent(addressData.province)}&max=500`,
        );
        const listaLoc = (res.data.municipios || []).sort((a, b) =>
          a.nombre.localeCompare(b.nombre),
        );
        setLocalidades(listaLoc);
      } catch {
        setLocalidades([]);
      } finally {
        setLoadingLocalidades(false);
      }
    };

    cargarLocalidades();
  }, [addressData.province]);

  const openCreate = () => {
    setEditingAddress(null);
    setAddressData(emptyAddress);
    setShowAddressModal(true);
  };

  const openEdit = (addr) => {
    setEditingAddress(addr);
    setAddressData({
      street: addr.street || "",
      number: String(addr.number ?? ""),
      floor: addr.floor || "",
      apartment: addr.apartment || "",
      postalCode: addr.postalCode || "",
      city: addr.city || "",
      province: addr.province || "",
      description: addr.description || "",
    });
    setShowAddressModal(true);
  };

  const closeModal = () => {
    setShowAddressModal(false);
    setEditingAddress(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const numeroParseado = parseInt(addressData.number, 10);
    if (Number.isNaN(numeroParseado)) {
      alert("Por favor, ingresá un número de calle válido.");
      return;
    }

    const payload = {
      ...addressData,
      number: numeroParseado,
    };

    try {
      if (editingAddress) {
        await API.put(`/address/${editingAddress.id_address}`, payload);
        alert("Dirección actualizada.");
      } else {
        await API.post("/address", payload);
        alert("Dirección agregada.");
      }

      closeModal();
      await fetchAddresses();
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.body ||
        "Error al guardar la dirección";
      alert(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  };

  const handleDelete = async (id_address) => {
    if (!window.confirm("¿Eliminar esta dirección?")) return;
    try {
      await API.delete(`/address/${id_address}`);
      await fetchAddresses();
    } catch (err) {
      alert("No se pudo eliminar la dirección");
    }
  };

  if (loading) return <div>Cargando direcciones...</div>;

  return (
    <div>
      <div className="products-header" style={{ marginBottom: 16 }}>
        <h2>Mis Direcciones</h2>
        <button className="btn-add-product" onClick={openCreate}>
          + Nueva
        </button>
      </div>

      {addresses.length === 0 ? (
        <p className="no-results-txt">
          No tenés direcciones cargadas en tu cuenta.
        </p>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Dirección</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {addresses.map((addr) => (
                <tr key={addr.id_address}>
                  <td>
                    <strong>
                      {addr.street} {addr.number}
                    </strong>
                    <div className="txt-dim">
                      {addr.city} - {addr.province} (CP: {addr.postalCode})
                    </div>
                    {addr.description ? (
                      <div className="txt-dim">{addr.description}</div>
                    ) : null}
                  </td>
                  <td>
                    <div className="actions-cell-gap">
                      <button
                        className="btn-edit-prod"
                        onClick={() => openEdit(addr)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn-delete-prod"
                        onClick={() => handleDelete(addr.id_address)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddressModal && (
        <div className="modal-overlay">
          <div className="address-modal-card">
            <h3>
              {editingAddress
                ? "Editar dirección de envío"
                : "Registrar nueva dirección de envío"}
            </h3>

            <form onSubmit={handleSave}>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Calle *</label>
                  <input
                    type="text"
                    required
                    value={addressData.street}
                    onChange={(e) =>
                      setAddressData({
                        ...addressData,
                        street: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Número *</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={addressData.number}
                    onChange={(e) =>
                      setAddressData({
                        ...addressData,
                        number: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label>Piso</label>
                  <input
                    type="text"
                    value={addressData.floor}
                    onChange={(e) =>
                      setAddressData({
                        ...addressData,
                        floor: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Depto</label>
                  <input
                    type="text"
                    value={addressData.apartment}
                    onChange={(e) =>
                      setAddressData({
                        ...addressData,
                        apartment: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Cód. Postal *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    value={addressData.postalCode}
                    onChange={(e) =>
                      setAddressData({
                        ...addressData,
                        postalCode: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Provincia *</label>
                  <select
                    required
                    className="address-select-dropdown"
                    value={addressData.province}
                    onChange={(e) =>
                      setAddressData({
                        ...addressData,
                        province: e.target.value,
                        city: "",
                      })
                    }
                  >
                    <option value="">-- Selecciona Provincia --</option>
                    {provincias.map((p) => (
                      <option key={p.id} value={p.nombre}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Ciudad / Localidad *</label>
                  <select
                    required
                    className="address-select-dropdown"
                    value={addressData.city}
                    disabled={!addressData.province || localidades.length === 0}
                    onChange={(e) =>
                      setAddressData({
                        ...addressData,
                        city: e.target.value,
                      })
                    }
                  >
                    <option value="">
                      {!addressData.province
                        ? "Elegí una provincia primero"
                        : localidades.length === 0
                          ? "Cargando localidades..."
                          : "-- Selecciona Localidad --"}
                    </option>
                    {localidades.map((loc) => (
                      <option key={loc.id} value={loc.nombre}>
                        {loc.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Descripción / Aclaración</label>
                <input
                  type="text"
                  value={addressData.description}
                  onChange={(e) =>
                    setAddressData({
                      ...addressData,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div className="modal-actions-buttons">
                <button
                  type="button"
                  className="btn-cancel-modal"
                  onClick={closeModal}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-submit-modal">
                  {editingAddress ? "Guardar cambios" : "Guardar dirección"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
