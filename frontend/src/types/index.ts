export interface User {
  id: string;
  clinica_id: string;
  nombre: string;
  apellido: string;
  email: string;
  role: "admin" | "odontologist" | "assistant";
  created_at: string;
}

export interface Clinica {
  id: string;
  nombre: string;
  nombre_propietario: string | null;
  cel: string | null;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  clinica?: Clinica;
  access_token: string;
  refresh_token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  clinica_nombre: string;
  nombre_propietario?: string;
  clinica_cel?: string;
  nombre: string;
  apellido: string;
  email: string;
  password: string;
}
