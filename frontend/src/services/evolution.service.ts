import api from "./api";

export type EvolutionState = "open" | "connecting" | "close" | "unknown";

export interface QrResult {
  state: EvolutionState;
  qr: string | null;
  pairingCode: string | null;
}

export async function evolutionConnect(): Promise<QrResult> {
  const { data } = await api.post<QrResult>("/evolution/connect");
  return data;
}

export async function evolutionGetQr(): Promise<QrResult> {
  const { data } = await api.get<QrResult>("/evolution/qr");
  return data;
}

export async function evolutionGetStatus(): Promise<{ state: EvolutionState }> {
  const { data } = await api.get<{ state: EvolutionState }>("/evolution/status");
  return data;
}

export async function evolutionDisconnect(): Promise<void> {
  await api.post("/evolution/disconnect");
}

export async function evolutionDeleteInstance(): Promise<void> {
  await api.delete("/evolution/instance");
}
