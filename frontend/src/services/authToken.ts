import axios from "axios";
import { getToken } from "./User";
export { logoutUser } from "./User";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface VerifyTokenResponse {
    valid: boolean;
    user?: {
        id: string;
        userName: string;
        iat: number;
        exp: number;
    };
}

export const verifyToken = async (): Promise<VerifyTokenResponse> => {
    try {
        const token = getToken();
        if (!token) throw new Error("Token não encontrado");

        const response = await axios.get<VerifyTokenResponse>(`${API_BASE_URL}/verify-token`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error("Erro ao verificar token:", error.response?.status ?? error.message);
        }
        return { valid: false };
    }
};
