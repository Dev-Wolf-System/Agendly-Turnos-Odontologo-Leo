import api from "./api";

export interface User {
  id: string;
  clinica_id: string;
  nombre: string;
  apellido: string;
  email: string;
  role: "admin" | "professional" | "assistant";
  created_at: string;
}

export interface CreateUserPayload {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  role: string;
}

export interface UpdateUserPayload {
  nombre?: string;
  apellido?: string;
  email?: string;
  password?: string;
  role?: string;
}

const usersService = {
  getAll: () =>
    api.get<User[]>("/users").then((r) => r.data),

  getById: (id: string) =>
    api.get<User>(`/users/${id}`).then((r) => r.data),

  create: (data: CreateUserPayload) =>
    api.post<User>("/users", data).then((r) => r.data),

  update: (id: string, data: UpdateUserPayload) =>
    api.patch<User>(`/users/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/users/${id}`).then((r) => r.data),
};

export default usersService;
