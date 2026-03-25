import api from "./api";

export interface Categoria {
  id: string;
  clinica_id: string;
  nombre: string;
  created_at: string;
}

export interface CreateCategoriaPayload {
  nombre: string;
}

const categoriasService = {
  getAll: () =>
    api.get<Categoria[]>("/categorias").then((r) => r.data),

  create: (data: CreateCategoriaPayload) =>
    api.post<Categoria>("/categorias", data).then((r) => r.data),

  update: (id: string, data: Partial<CreateCategoriaPayload>) =>
    api.patch<Categoria>(`/categorias/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/categorias/${id}`).then((r) => r.data),
};

export default categoriasService;
