import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
export const getAllHorses = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/horse`);

    return response.data;
  } catch (error) {
    console.error("Erro ao buscar cavalos:", error);
    throw error;
  }
};

export const getOneHorse = async (HorseId: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/horse/${HorseId}`);

    return response.data;
  } catch (error) {
    console.error("Erro ao buscar cavalos:", error);
    throw error;
  }
};