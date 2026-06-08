import axios from "axios";

const API = axios.create({
  baseURL: "https://hospital-aguaray-backend.onrender.com/api",
  timeout: 10000,
  withCredentials: true,
});

export default API;
