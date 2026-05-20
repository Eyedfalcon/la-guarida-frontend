import { apiFetch } from "./api";

export interface BarberDto {
  id: number;
  name: string;
  specialty: string;
  imageUrl?: string;
  experience: string;
  price: number;
}

export interface ServiceDto {
  id: number;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  requiresDeposit: boolean;
  depositAmount: number;
}

export interface CreateReservationRequest {
  barberId: number;
  serviceId: number;
  date: string;
  time: string;
  notes: string;
}

export interface CreateReservationResponse {
  message: string;
  reservationId: number;
  requiresDeposit: boolean;
  depositAmount: number;
  depositStatus: string;
  depositExpiresAt?: string;
}

export interface MyReservationDto {
  id: number;
  date: string;
  time: string;
  status: string;
  notes?: string;
  barber: string;
  service: string;
  depositAmount?: number;
  depositStatus?: string;
  depositPaidAt?: string;
  depositExpiresAt?: string;
}

export async function getBarbers(): Promise<BarberDto[]> {
  return apiFetch<BarberDto[]>("/Barbers");
}

export async function getServices(): Promise<ServiceDto[]> {
  return apiFetch<ServiceDto[]>("/Services");
}

export async function getAvailableSlots(
  barberId: number,
  serviceId: number,
  date: string
): Promise<string[]> {
  return apiFetch<string[]>(
    `/Reservations/available-slots?barberId=${barberId}&serviceId=${serviceId}&date=${encodeURIComponent(date)}`
  );
}

export async function createReservation(
  token: string,
  data: CreateReservationRequest
): Promise<CreateReservationResponse> {
  return apiFetch<CreateReservationResponse>("/Reservations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function markDepositReceiptSent(
  token: string,
  reservationId: number
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(
    `/Reservations/${reservationId}/deposit/mark-sent`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

export async function getMyReservations(
  token: string
): Promise<MyReservationDto[]> {
  return apiFetch<MyReservationDto[]>("/Reservations/mine", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}