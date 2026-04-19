import api from "./api";

export interface TurnosReportData {
  total: number;
  por_estado: Record<string, number>;
  por_profesional: { id: string; nombre: string; apellido: string; total: number }[];
  por_mes: { mes: string; total: number }[];
  cancelaciones_pct: number;
  rango: { desde: string; hasta: string };
}

export interface PacientesReportData {
  total: number;
  nuevos_este_mes: number;
  por_obra_social: { obra_social: string; total: number }[];
  nuevos_por_mes: { mes: string; total: number }[];
}

const reportsService = {
  getTurnos: (params?: { desde?: string; hasta?: string; profesional_id?: string }) =>
    api.get<TurnosReportData>("/reports/turnos", { params }).then((r) => r.data),

  getTurnosCsvUrl: (params?: { desde?: string; hasta?: string; profesional_id?: string }) => {
    const qs = new URLSearchParams();
    if (params?.desde) qs.set("desde", params.desde);
    if (params?.hasta) qs.set("hasta", params.hasta);
    if (params?.profesional_id) qs.set("profesional_id", params.profesional_id);
    return `/reports/turnos/csv?${qs.toString()}`;
  },

  getPacientes: () =>
    api.get<PacientesReportData>("/reports/pacientes").then((r) => r.data),

  downloadCsv: async (params?: { desde?: string; hasta?: string; profesional_id?: string }) => {
    const res = await api.get<Blob>("/reports/turnos/csv", {
      params,
      responseType: "blob",
    });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `turnos-${params?.desde || "all"}-${params?.hasta || "all"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  downloadXlsx: async (params?: { desde?: string; hasta?: string; profesional_id?: string }) => {
    const res = await api.get<Blob>("/reports/turnos/xlsx", {
      params,
      responseType: "blob",
    });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `turnos-${params?.desde || "all"}-${params?.hasta || "all"}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  },

  downloadInformePdf: async (
    texto: string,
    params?: { desde?: string; hasta?: string },
  ) => {
    const res = await api.get<Blob>("/reports/informe-ia/pdf", {
      params: { texto: encodeURIComponent(texto), ...params },
      responseType: "blob",
    });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `informe-${params?.desde || "all"}-${params?.hasta || "all"}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },
};

export default reportsService;
