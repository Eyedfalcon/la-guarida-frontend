import { apiFetch } from "./api";

export type ReservationStatus = "Pending" | "Confirmed" | "Completed" | "Cancelled";

export interface AdminReservation {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  barberName: string;
  serviceName: string;
  date: string;
  time: string;
  status: string;
  notes?: string | null;
  depositAmount?: number;
  depositStatus?: string;
  depositPaidAt?: string;
  depositExpiresAt?: string;
}

export interface AdminBarber {
  id: number;
  name: string;
  specialty: string;
  imageUrl: string;
  experience: string;
  price: number;
  isActive?: boolean;
  linkedEmail?: string;
}

export interface SaveAdminBarberRequest {
  name: string;
  specialty: string;
  imageUrl: string;
  experience: string;
  price: number;
  isActive?: boolean;
  linkedEmail?: string;
}

export interface AdminServiceItem {
  id: number;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  isActive?: boolean;
  requiresDeposit?: boolean;
  depositAmount?: number;
}

export interface SaveAdminServiceRequest {
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  isActive?: boolean;
  requiresDeposit?: boolean;
  depositAmount?: number;
}

export interface BarberBusinessHour {
  dayOfWeek: number;
  label: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  breakStart: string;
  breakEnd: string;
  slotIntervalMinutes: number;
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function getAllReservations(token: string): Promise<AdminReservation[]> {
  return apiFetch<AdminReservation[]>("/AdminReservations", {
    headers: authHeaders(token),
  });
}

export async function updateReservationStatus(
  token: string,
  reservationId: number,
  status: ReservationStatus
): Promise<void> {
  return apiFetch<void>(`/AdminReservations/${reservationId}/status`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  });
}

export async function deleteReservation(
  token: string,
  reservationId: number
): Promise<void> {
  return apiFetch<void>(`/AdminReservations/${reservationId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

export async function confirmReservationDeposit(
  token: string,
  reservationId: number
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(
    `/AdminReservations/${reservationId}/deposit/confirm`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
}

export async function rejectReservationDeposit(
  token: string,
  reservationId: number
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(
    `/AdminReservations/${reservationId}/deposit/reject`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
}

export async function expireReservationDeposit(
  token: string,
  reservationId: number
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(
    `/AdminReservations/${reservationId}/deposit/expire`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
}

export async function getAdminBarbers(token: string): Promise<AdminBarber[]> {
  return apiFetch<AdminBarber[]>("/AdminBarbers", {
    headers: authHeaders(token),
  });
}

export async function createAdminBarber(
  token: string,
  data: SaveAdminBarberRequest
): Promise<AdminBarber> {
  return apiFetch<AdminBarber>("/AdminBarbers", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function updateAdminBarber(
  token: string,
  barberId: number,
  data: SaveAdminBarberRequest
): Promise<void> {
  return apiFetch<void>(`/AdminBarbers/${barberId}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function deleteAdminBarber(
  token: string,
  barberId: number
): Promise<void> {
  return apiFetch<void>(`/AdminBarbers/${barberId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

export async function getAdminServices(token: string): Promise<AdminServiceItem[]> {
  return apiFetch<AdminServiceItem[]>("/AdminServices", {
    headers: authHeaders(token),
  });
}

export async function createAdminService(
  token: string,
  data: SaveAdminServiceRequest
): Promise<AdminServiceItem> {
  return apiFetch<AdminServiceItem>("/AdminServices", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function updateAdminService(
  token: string,
  serviceId: number,
  data: SaveAdminServiceRequest
): Promise<void> {
  return apiFetch<void>(`/AdminServices/${serviceId}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function deleteAdminService(
  token: string,
  serviceId: number
): Promise<void> {
  return apiFetch<void>(`/AdminServices/${serviceId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

export async function getBarberBusinessHours(
  token: string,
  barberId: number
): Promise<BarberBusinessHour[]> {
  return apiFetch<BarberBusinessHour[]>(
    `/AdminSchedule/barbers/${barberId}/hours`,
    {
      headers: authHeaders(token),
    }
  );
}

export async function saveBarberBusinessHours(
  token: string,
  barberId: number,
  hours: BarberBusinessHour[]
): Promise<void> {
  return apiFetch<void>(`/AdminSchedule/barbers/${barberId}/hours`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(hours),
  });
}
