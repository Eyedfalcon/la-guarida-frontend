import { apiFetch } from "./api";

export type BarberServicePrice = {
  barberId: number;
  barberName?: string;
  serviceId: number;
  serviceName?: string;
  price: number;
};

export async function getBarberServicePrices(): Promise<BarberServicePrice[]> {
  return apiFetch<BarberServicePrice[]>("/BarberServicePrices");
}