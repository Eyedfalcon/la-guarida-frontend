import { apiFetch } from "./api";

export type BarberReservationItem = {
  id: number;
  date: string;
  time: string;
  status: string;
  notes?: string | null;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  barberName: string;
};

export type BarberTodayResponse = {
  date: string;
  barber?: {
    id: number;
    name: string;
    specialty: string;
    imageUrl: string;
  } | null;
  total: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  estimatedIncome: number;
  freeSlots: string[];
  upcoming: BarberReservationItem[];
  reservations: BarberReservationItem[];
};

export type BarberFreeSlotsResponse = {
  date: string;
  freeSlots: string[];
};

export async function getBarberToday(token: string): Promise<BarberTodayResponse> {
  return apiFetch<BarberTodayResponse>("/BarberPanel/today", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getBarberReservations(
  token: string,
  date?: string
): Promise<BarberReservationItem[]> {
  const url = date
    ? `/BarberPanel/reservations?date=${encodeURIComponent(date)}`
    : "/BarberPanel/reservations";

  return apiFetch<BarberReservationItem[]>(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getBarberFreeSlots(
  token: string,
  date?: string
): Promise<BarberFreeSlotsResponse> {
  const url = date
    ? `/BarberPanel/free-slots?date=${encodeURIComponent(date)}`
    : "/BarberPanel/free-slots";

  return apiFetch<BarberFreeSlotsResponse>(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function updateBarberReservationStatus(
  token: string,
  reservationId: number,
  status: "Pending" | "Confirmed" | "Completed" | "Cancelled"
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(
    `/BarberPanel/reservations/${reservationId}/status`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    }
  );
}

export async function rescheduleBarberReservation(
  token: string,
  reservationId: number,
  data: { date: string; time: string }
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(
    `/BarberPanel/reservations/${reservationId}/reschedule`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );
}

export async function updateBarberProfile(
  token: string,
  data: { imageUrl: string }
): Promise<{ message: string; imageUrl: string }> {
  return apiFetch<{ message: string; imageUrl: string }>("/BarberPanel/profile", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}
