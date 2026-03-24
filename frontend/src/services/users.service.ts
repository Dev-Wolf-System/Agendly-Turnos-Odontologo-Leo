import api from "./api";

export interface User {
  id: string;
  clinica_id: string;
  nombre: string;
  apellido: string;
  email: string;
  role: "admin" | "odontologist" | "assistant";
  created_at: string;
}

const usersService = {
  getAll: () =>
    api.get<User[]>("/users").then((r) => r.data),

  getById: (id: string) =>
    api.get<User>(`/users/${id}`).then((r) => r.data),
};

export default usersService;
