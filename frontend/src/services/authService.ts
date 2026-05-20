import { apiFetch } from "./api";

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    phone: string;
    birthday?: string | null;
    role?: string;
  };
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/Auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(data: {
  name: string;
  email: string;
  phone: string;
  password: string;
  birthday?: string;
}): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/Auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function resetPassword(data: {
  email: string;
  birthday: string;
  newPassword: string;
}): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/Auth/reset-password", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
