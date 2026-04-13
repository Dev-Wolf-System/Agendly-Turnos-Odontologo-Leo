import api from "./api";

export interface ArchivoMedico {
  id: string;
  paciente_id: string;
  subido_por: string;
  nombre_archivo: string;
  storage_path: string;
  tipo_mime: string | null;
  tamano_bytes: number;
  categoria: string | null;
  notas: string | null;
  clinica_id: string;
  created_at: string;
}

const archivosMedicosService = {
  getByPaciente: (pacienteId: string) =>
    api
      .get<ArchivoMedico[]>(`/archivos-medicos/paciente/${pacienteId}`)
      .then((r) => r.data),

  upload: (data: FormData) =>
    api
      .post<ArchivoMedico>("/archivos-medicos", data, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data),

  getSignedUrl: (id: string) =>
    api
      .get<{ url: string }>(`/archivos-medicos/${id}/url`)
      .then((r) => r.data.url),

  delete: (id: string) =>
    api.delete(`/archivos-medicos/${id}`).then((r) => r.data),

  uploadLogo: (file: File) => {
    const formData = new FormData();
    formData.append("logo", file);
    return api
      .post<{ url: string }>("/archivos-medicos/logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.url);
  },
};

export default archivosMedicosService;
