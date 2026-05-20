using System.Security.Claims;
using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReservationsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ReservationsController(AppDbContext context)
    {
        _context = context;
    }

    private static bool IsReservationBlocking(Reservation reservation)
    {
        if (reservation.Status == "Cancelled")
            return false;

        if (reservation.DepositStatus == "Expired")
            return false;

        if (reservation.DepositStatus == "Pending" &&
            reservation.DepositExpiresAt.HasValue &&
            reservation.DepositExpiresAt.Value < DateTime.UtcNow)
        {
            return false;
        }

        return true;
    }

    private static List<BarberBusinessHour> GetDefaultHours(int barberId)
    {
        return new List<BarberBusinessHour>
        {
            new() { BarberId = barberId, DayOfWeek = 1, Label = "Lunes", IsOpen = true, OpenTime = "09:00", CloseTime = "20:00", BreakStart = "14:00", BreakEnd = "15:00", SlotIntervalMinutes = 30 },
            new() { BarberId = barberId, DayOfWeek = 2, Label = "Martes", IsOpen = true, OpenTime = "09:00", CloseTime = "20:00", BreakStart = "14:00", BreakEnd = "15:00", SlotIntervalMinutes = 30 },
            new() { BarberId = barberId, DayOfWeek = 3, Label = "Miercoles", IsOpen = true, OpenTime = "09:00", CloseTime = "20:00", BreakStart = "14:00", BreakEnd = "15:00", SlotIntervalMinutes = 30 },
            new() { BarberId = barberId, DayOfWeek = 4, Label = "Jueves", IsOpen = true, OpenTime = "09:00", CloseTime = "20:00", BreakStart = "14:00", BreakEnd = "15:00", SlotIntervalMinutes = 30 },
            new() { BarberId = barberId, DayOfWeek = 5, Label = "Viernes", IsOpen = true, OpenTime = "09:00", CloseTime = "21:00", BreakStart = "14:00", BreakEnd = "15:00", SlotIntervalMinutes = 30 },
            new() { BarberId = barberId, DayOfWeek = 6, Label = "Sabado", IsOpen = true, OpenTime = "10:00", CloseTime = "18:00", BreakStart = "", BreakEnd = "", SlotIntervalMinutes = 30 },
            new() { BarberId = barberId, DayOfWeek = 0, Label = "Domingo", IsOpen = false, OpenTime = "", CloseTime = "", BreakStart = "", BreakEnd = "", SlotIntervalMinutes = 30 }
        };
    }

    [HttpGet("available-slots")]
    public async Task<IActionResult> GetAvailableSlots(
        [FromQuery] int barberId,
        [FromQuery] int serviceId,
        [FromQuery] string date)
    {
        if (!DateOnly.TryParse(date, out var parsedDate))
        {
            return BadRequest(new { message = "Fecha inválida" });
        }

        var barber = await _context.Barbers.FirstOrDefaultAsync(x => x.Id == barberId && x.IsActive);
        if (barber is null)
        {
            return NotFound(new { message = "Barbero no encontrado" });
        }

        var service = await _context.Services.FirstOrDefaultAsync(x => x.Id == serviceId && x.IsActive);
        if (service is null)
        {
            return NotFound(new { message = "Servicio no encontrado" });
        }

        var dayOfWeek = (int)parsedDate.DayOfWeek;

        var hasBusinessHours = await _context.BarberBusinessHours
            .AnyAsync(x => x.BarberId == barberId);

        if (!hasBusinessHours)
        {
            _context.BarberBusinessHours.AddRange(GetDefaultHours(barberId));
            await _context.SaveChangesAsync();
        }

        var businessHour = await _context.BarberBusinessHours
            .FirstOrDefaultAsync(x => x.BarberId == barberId && x.DayOfWeek == dayOfWeek);

        if (businessHour is null || !businessHour.IsOpen)
        {
            return Ok(new List<string>());
        }

        if (!TimeOnly.TryParse(businessHour.OpenTime, out var openTime) ||
            !TimeOnly.TryParse(businessHour.CloseTime, out var closeTime))
        {
            return Ok(new List<string>());
        }

        TimeOnly? breakStart = null;
        TimeOnly? breakEnd = null;

        if (!string.IsNullOrWhiteSpace(businessHour.BreakStart) &&
            !string.IsNullOrWhiteSpace(businessHour.BreakEnd) &&
            TimeOnly.TryParse(businessHour.BreakStart, out var bs) &&
            TimeOnly.TryParse(businessHour.BreakEnd, out var be))
        {
            breakStart = bs;
            breakEnd = be;
        }

        var interval = businessHour.SlotIntervalMinutes <= 0 ? 30 : businessHour.SlotIntervalMinutes;
        var serviceDuration = service.DurationMinutes;

        var reservations = await _context.Reservations
            .Where(x => x.BarberId == barberId && x.Date == parsedDate)
            .Include(x => x.Service)
            .ToListAsync();

        reservations = reservations.Where(IsReservationBlocking).ToList();

        var result = new List<string>();
        var current = openTime;

        while (current < closeTime)
        {
            var end = current.AddMinutes(serviceDuration);

            if (end > closeTime)
                break;

            var overlapsBreak = breakStart.HasValue &&
                                breakEnd.HasValue &&
                                current < breakEnd.Value &&
                                end > breakStart.Value;

            if (!overlapsBreak)
            {
                var overlapsReservation = reservations.Any(r =>
                {
                    if (!TimeOnly.TryParse(r.Time, out var reservationStart))
                        return false;

                    var reservationEnd = reservationStart.AddMinutes(r.Service.DurationMinutes);
                    return current < reservationEnd && end > reservationStart;
                });

                if (!overlapsReservation)
                {
                    result.Add(current.ToString("HH:mm"));
                }
            }

            current = current.AddMinutes(interval);
        }

        return Ok(result);
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create(CreateReservationDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        if (!DateOnly.TryParse(dto.Date, out var parsedDate))
        {
            return BadRequest(new { message = "Fecha inválida" });
        }

        var service = await _context.Services.FirstOrDefaultAsync(x => x.Id == dto.ServiceId && x.IsActive);
        if (service is null)
        {
            return BadRequest(new { message = "Servicio inválido" });
        }

        if (!TimeOnly.TryParse(dto.Time, out var newStart))
        {
            return BadRequest(new { message = "Hora inválida" });
        }

        var newEnd = newStart.AddMinutes(service.DurationMinutes);

        var sameDayReservations = await _context.Reservations
            .Where(x => x.BarberId == dto.BarberId && x.Date == parsedDate)
            .Include(x => x.Service)
            .ToListAsync();

        sameDayReservations = sameDayReservations.Where(IsReservationBlocking).ToList();

        var overlaps = sameDayReservations.Any(x =>
        {
            if (!TimeOnly.TryParse(x.Time, out var existingStart))
                return false;

            var existingEnd = existingStart.AddMinutes(x.Service.DurationMinutes);
            return newStart < existingEnd && newEnd > existingStart;
        });

        if (overlaps)
        {
            return BadRequest(new { message = "Ese horario ya no está disponible" });
        }

        var requiresDeposit = service.RequiresDeposit && service.DepositAmount > 0;

        var reservation = new Reservation
        {
            UserId = userId,
            BarberId = dto.BarberId,
            ServiceId = dto.ServiceId,
            Date = parsedDate,
            Time = dto.Time,
            Notes = dto.Notes ?? "",
            Status = requiresDeposit ? "Pending" : "Confirmed",
            DepositAmount = requiresDeposit ? service.DepositAmount : 0,
            DepositStatus = requiresDeposit ? "Pending" : "NotRequired",
            DepositPaidAt = null,
            DepositExpiresAt = requiresDeposit ? DateTime.UtcNow.AddMinutes(20) : null
        };

        _context.Reservations.Add(reservation);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = requiresDeposit
                ? "Reserva creada. Envía el comprobante por WhatsApp."
                : "Reserva creada correctamente.",
            reservationId = reservation.Id,
            requiresDeposit,
            depositAmount = reservation.DepositAmount,
            depositStatus = reservation.DepositStatus,
            depositExpiresAt = reservation.DepositExpiresAt
        });
    }

[Authorize]
[HttpPatch("{id}/deposit/mark-sent")]
public async Task<IActionResult> MarkDepositReceiptSent(int id)
{
    var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    if (!int.TryParse(userIdClaim, out var userId))
        return Unauthorized();

    var reservation = await _context.Reservations
        .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);

    if (reservation == null)
        return NotFound(new { message = "Reserva no encontrada" });

    if (reservation.DepositStatus != "Pending" && reservation.DepositStatus != "Rejected")
        return BadRequest(new { message = "La reserva no admite envío de comprobante" });

    if (reservation.DepositExpiresAt.HasValue && reservation.DepositExpiresAt.Value < DateTime.UtcNow)
    {
        reservation.DepositStatus = "Expired";
        await _context.SaveChangesAsync();
        return BadRequest(new { message = "La señal ha expirado" });
    }

    reservation.DepositStatus = "WaitingValidation";
    reservation.Status = "Confirmed";

    await _context.SaveChangesAsync();

    return Ok(new
    {
        message = "Reserva confirmada. Pago pendiente de revisión."
    });
}

    [Authorize]
    [HttpGet("mine")]
    public async Task<IActionResult> Mine()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var reservations = await _context.Reservations
            .Where(x => x.UserId == userId)
            .Include(x => x.Barber)
            .Include(x => x.Service)
            .OrderByDescending(x => x.Date)
            .ThenByDescending(x => x.Time)
            .Select(x => new
            {
                x.Id,
                x.Date,
                x.Time,
                x.Status,
                x.Notes,
                x.DepositAmount,
                x.DepositStatus,
                x.DepositPaidAt,
                x.DepositExpiresAt,
                Barber = x.Barber.Name,
                Service = x.Service.Name
            })
            .ToListAsync();

        return Ok(reservations);
    }
}
