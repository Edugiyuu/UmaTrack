import type { HorseResponseProfile } from "./horse";

export interface CreateUserData {
    email: string;
    password: string;
    username: string;
}

export interface CreateUserResponse {
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
export interface UserResponseProfile {
    username: string;
    email: string;
    horses: HorseResponseProfile[];
    _id: string;
    monies: number;
    createdAt: string;
    updatedAt: string;
}