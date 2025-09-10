import axios from "axios";
import Cookies from "universal-cookie";

const cookies = new Cookies();
const API_BASE_URL = import.meta.env.VITE_API_URL

export const verifyToken = async () => {
    try {
        const token = cookies.get("token");
        if (!token) throw new Error("Token não encontrado");

        const response = await axios.get(`${API_BASE_URL}/verify-token`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return response.data;
    } catch (error: any) {
        console.error("Erro ao verificar token:", error.response?.data || error.message);
        return { valid: false };
    }
};

export const logoutUser = () => {
    cookies.remove("token", { path: "/" });
};
