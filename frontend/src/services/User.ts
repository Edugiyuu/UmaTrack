import axios from "axios";
import Cookies from 'universal-cookie';
import type { CreateUserData, CreateUserResponse, UserResponseProfile } from "../types/user";


const API_BASE_URL = import.meta.env.VITE_API_URL

export const createUser = async (userData: CreateUserData): Promise<CreateUserResponse> => {
    try {
        const response = await axios.post<CreateUserResponse>(
            `${API_BASE_URL}/user/create`,
            userData,
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        return response.data;

    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            if (error.response && error.response.data) {
                throw new Error(error.response.data.msg || "Erro ao criar usuário");
            }
        }
        throw new Error("Erro desconhecido ao criar usuário");
    }
};

const cookies = new Cookies();

interface LoginResponse {
    msg: string;
    token: string;
}

export const LoginUser = async (userData: any): Promise<LoginResponse> => {
    try {
        const response = await axios.post<LoginResponse>(
            `${API_BASE_URL}/user/login`,
            userData
        );

        cookies.set("token", response.data.token, { path: "/", maxAge: 3600 });

        return response.data;
    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            if (error.response && error.response.data) {
                throw new Error(error.response.data.msg || "Erro ao criar usuário");
            }
        }
        throw new Error("Erro desconhecido ao criar usuário");
    }
};

export const getToken = () => {
    return cookies.get("token");
};

export const logoutUser = () => {
    cookies.remove("token", { path: "/" });
};

export const getUser = async (userId: string): Promise<UserResponseProfile> => {
    try {
        const token = getToken();
        if (!token) {
            throw new Error("Token não encontrado");
        }

        const response = await axios.get<UserResponseProfile>(
            `${API_BASE_URL}/user/${userId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        return response.data;
    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            if (error.response && error.response.data) {
                throw new Error(error.response.data.msg || "Erro ao buscar usuário");
            }
        }
        throw new Error("Erro desconhecido ao buscar usuário");
    }
};

export const purchaseHorse = async (userId: string, horseId: string) => {
  try {
   
    const token = getToken();
    const response = await axios.post(
            `${API_BASE_URL}/user/${userId}/purchase-horse`,
            {
                horseId: horseId
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
    );
    
    return {
      success: true,
      user: response.data.user,
      purchasedHorse: response.data.purchasedHorse
    };
  } catch (error: any) {
    console.error('Erro ao comprar cavalo:', error);
    
    if (error.response?.data?.msg) {
      throw new Error(error.response.data.msg);
    }
    
    throw new Error('Erro ao comprar cavalo');
  }
};