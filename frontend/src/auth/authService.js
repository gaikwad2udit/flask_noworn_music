// AuthService.js
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export const register = async (username, email, password) => {
  const response = await axios.post(
    `${API_URL}/register`,
    {
      username,
      email,
      password,
    },
    { withCredentials: true }
  );
  return response.data;
};
//login request
export const login = async (email, password) => {
  const response = await axios.post(
    `${API_URL}/login`,
    {
      email,
      password,
    },
    {
      withCredentials: true, // For cookie-based auth
    }
  );
  if (response.data.token) {
    localStorage.setItem("user", JSON.stringify(response.data));
  }
  return response.data;
};

//confirm email request
export const confirmEmail = async (token) => {
  const response = await axios.get(`${API_URL}/confirm/${token}`);
  return response.data;
};

export const logout = () => {
  localStorage.removeItem("user");
};
