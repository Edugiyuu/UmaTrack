import axios from "axios";
import Cookies from 'universal-cookie';
import type { CreateUserData, CreateUserResponse, UserResponseProfile } from "../types/user";
import type { HorseResponseProfile } from "../types/horse";

interface ApiErrorPayload {
    msg?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const apiErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError<ApiErrorPayload>(error)) {
        return error.response?.data?.msg ?? fallback;
    }
    return fallback;
};

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

    } catch (error: unknown) {
        throw new Error(apiErrorMessage(error, "Erro ao criar usuário"));
    }
};

const cookies = new Cookies();

interface LoginData {
    email: string;
    password: string;
}

interface LoginResponse {
    msg: string;
    token: string;
}

export const LoginUser = async (userData: LoginData): Promise<LoginResponse> => {
    try {
        const response = await axios.post<LoginResponse>(
            `${API_BASE_URL}/user/login`,
            userData
        );

        cookies.set("token", response.data.token, {
            path: "/",
            maxAge: 3600,
            sameSite: "strict",
            secure: window.location.protocol === "https:"
        });

        return response.data;
    } catch (error: unknown) {
        throw new Error(apiErrorMessage(error, "Erro ao autenticar usuário"));
    }
};

export const getToken = (): string | undefined => {
    return cookies.get("token") as string | undefined;
};

export const logoutUser = () => {
    cookies.remove("token", { path: "/" });
};

export const getCurrentUser = async (): Promise<UserResponseProfile> => {
    try {
        const token = getToken();
        if (!token) {
            throw new Error("Token não encontrado");
        }

        const response = await axios.get<UserResponseProfile>(
            `${API_BASE_URL}/user/me`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        return response.data;
    } catch (error: unknown) {
        throw new Error(apiErrorMessage(error, "Erro ao buscar usuário"));
    }
};

export const purchaseHorse = async (horseId: string) => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("Token não encontrado");
    }

    const response = await axios.post<{
      user: UserResponseProfile;
      purchasedHorse: HorseResponseProfile;
    }>(
      `${API_BASE_URL}/user/me/purchase-horse`,
      { horseId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return {
      success: true,
      user: response.data.user,
      purchasedHorse: response.data.purchasedHorse
    };
  } catch (error: unknown) {
    throw new Error(apiErrorMessage(error, "Erro ao comprar cavalo"));
  }
};

export const getOwnedHorse = async (
  horseId: string,
  signal?: AbortSignal
): Promise<HorseResponseProfile> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("Token não encontrado");
    }

    const response = await axios.get<HorseResponseProfile>(
      `${API_BASE_URL}/user/me/horses/${horseId}`,
      {
        signal,
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(apiErrorMessage(error, "Erro ao buscar cavalo do usuário"));
  }
};

export type TrainType = "speed" | "stamina" | "power" | "wit";

export interface TrainingOutcome {
    statGain: number;
    skillPointsGained: number;
    energySpent: number;
    moodChange: number;
    failed: boolean;
    notes: string[];
}

/**
 * Reports the minigame performance. The server decides the reward, so the score and
 * the score that was available are all we send.
 */
export const trainHorse = async (
    horseId: string,
    trainType: TrainType,
    score: number,
    maxScore: number
): Promise<{ horse: HorseResponseProfile; training: TrainingOutcome }> => {
    try {
        const token = getToken();
        if (!token) {
            throw new Error("Token não encontrado");
        }

        const response = await axios.post<{ horse: HorseResponseProfile; training: TrainingOutcome }>(
            `${API_BASE_URL}/user/me/horses/${horseId}/train`,
            { trainType, score, maxScore },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    } catch (error: unknown) {
        throw new Error(apiErrorMessage(error, "Erro ao salvar treino"));
    }
};

export interface RestOutcome {
    energyRecovered: number;
    energy: number;
    mood: number;
    /** False when she rested on an empty turn counter, which costs nothing. */
    turnSpent: boolean;
}

export const restHorse = async (
    horseId: string
): Promise<{ horse: HorseResponseProfile; rest: RestOutcome }> => {
    try {
        const token = getToken();
        if (!token) {
            throw new Error("Token não encontrado");
        }

        const response = await axios.post<{ horse: HorseResponseProfile; rest: RestOutcome }>(
            `${API_BASE_URL}/user/me/horses/${horseId}/rest`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    } catch (error: unknown) {
        throw new Error(apiErrorMessage(error, "Erro ao descansar"));
    }
};