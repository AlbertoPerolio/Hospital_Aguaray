import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import "../styles/home.css"; // Archivo para los estilos del catálogo

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <header className="home-header">
        <h1>Hospital Aguaray</h1>
        <p>Saca turnos de forma facil y rapida</p>
      </header>
    </div>
  );
}
