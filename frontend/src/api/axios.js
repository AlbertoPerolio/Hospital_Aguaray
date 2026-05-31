import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:4000/api",
  timeout: 10000,
  withCredentials: true,
});

export default API;
