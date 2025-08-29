import axios from "axios";
import Cookies from 'universal-cookie';

interface CreateUserData {
    email: string;
    password: string;
    username: string;
}

interface CreateUserResponse {
    msg: string;
    user: {
        username: string;
        email: string;
        horses: any[];
        _id: string;
        createdAt: string;
        updatedAt: string;
    };
}

export const createUser = async (userData: CreateUserData): Promise<CreateUserResponse> => {
    try {
        const response = await axios.post<CreateUserResponse>(
            "http://localhost:3000/user/create",
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
            "http://localhost:3000/user/login",
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

interface UserResponse {
    user: {
        username: string;
        email: string;
        horses: any[];
        _id: string;
        createdAt: string;
        updatedAt: string;
    };
}

export const getUser = async (userId: string): Promise<UserResponse> => {
    try {
        const token = getToken();
        if (!token) {
            throw new Error("Token não encontrado");
        }

        const response = await axios.get<UserResponse>(
            `http://localhost:3000/user/${userId}`,
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
