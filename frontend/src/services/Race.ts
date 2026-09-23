import axios from "axios";
import { getToken } from "./User";
import type { HorseResponseProfile } from "../types/horse";
import type {
  RaceHistoryEntry,
  RaceRewards,
  RaceSimulation,
  RunningStyle,
  SkillResponse,
  TrackResponse
} from "../types/race";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

interface ApiErrorPayload {
  msg?: string;
}

const apiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    return error.response?.data?.msg ?? fallback;
  }
  return fallback;
};

const authHeaders = () => {
  const token = getToken();
  if (!token) {
    throw new Error("Token não encontrado");
  }
  return { Authorization: `Bearer ${token}` };
};

export const getTracks = async (signal?: AbortSignal): Promise<TrackResponse[]> => {
  try {
    const response = await axios.get<TrackResponse[]>(`${API_BASE_URL}/track`, { signal });
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Erro ao buscar pistas"));
  }
};

export const getSkills = async (signal?: AbortSignal): Promise<SkillResponse[]> => {
  try {
    const response = await axios.get<SkillResponse[]>(`${API_BASE_URL}/skill`, { signal });
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Erro ao buscar skills"));
  }
};

export const learnSkill = async (
  horseId: string,
  skillId: string
): Promise<HorseResponseProfile> => {
  try {
    const response = await axios.post<{ horse: HorseResponseProfile }>(
      `${API_BASE_URL}/user/me/horses/${horseId}/skills`,
      { skillId },
      { headers: authHeaders() }
    );
    return response.data.horse;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Erro ao aprender skill"));
  }
};

export interface RunRaceResponse {
  msg: string;
  simulation: RaceSimulation;
  rewards: RaceRewards;
  horse: HorseResponseProfile;
  monies: number;
}

export const runRace = async (
  horseId: string,
  trackId: string,
  runningStyle: RunningStyle
): Promise<RunRaceResponse> => {
  try {
    const response = await axios.post<RunRaceResponse>(
      `${API_BASE_URL}/race/run`,
      { horseId, trackId, runningStyle },
      { headers: authHeaders() }
    );
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Erro ao correr"));
  }
};

export const getRaceHistory = async (
  signal?: AbortSignal
): Promise<{ races: RaceHistoryEntry[]; total: number }> => {
  try {
    const response = await axios.get<{ races: RaceHistoryEntry[]; total: number }>(
      `${API_BASE_URL}/user/me/races`,
      { signal, headers: authHeaders() }
    );
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Erro ao buscar histórico"));
  }
};
