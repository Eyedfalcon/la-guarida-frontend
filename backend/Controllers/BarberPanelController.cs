using backend.Data;
using backend.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Barber")]
public class BarberPanelController : ControllerBase
{
    private readonly AppDbContext _context;

    public BarberPanelController(AppDbContext context)
    {
        _context = context;
    }

    private int? GetMyBarberId()
    {
        var barberIdClaim = User.FindFirst("barber_id")?.Value;

        if (int.TryParse(barberIdClaim, out var barberId))
            return barberId;

        return null;
    }

    private async Task<decimal> GetReservationPriceAsync(int barberId, int serviceId, decimal fallbackPrice)
    {
        var barberService = await _context.BarberServices
            .FirstOrDefaultAsync(x => x.BarberId == barberId && x.ServiceId == serviceId && x.IsActive);

        return barberService?.Price ?? fallbackPrice;
    }

    private async Task<List<string>> GenerateFreeSlotsAsync(int barberId, DateOnly date)
    {
        var dayOfWeek = (int)date.DayOfWeek;

        var schedule = await _context.BarberBusinessHours
            .FirstOrDefaultAsync(x => x.BarberId == barberId && x.DayOfWeek == dayOfWeek);

        if (schedule is null || !schedule.IsOpen)
            return new List<string>();

        if (!TimeOnly.TryParse(schedule.OpenTime, out var openTime) ||
            !TimeOnly.TryParse(schedule.CloseTime, out var closeTime))
        {
            return new List<string>();
        }

        TimeOnly? breakStart = null;
        TimeOnly? breakEnd = null;

        if (!string.IsNullOrWhiteSpace(schedule.BreakStart) &&
            !string.IsNullOrWhiteSpace(schedule.BreakEnd) &&
            TimeOnly.TryParse(schedule.BreakStart, out var bs) &&
            TimeOnly.TryParse(schedule.BreakEnd, out var be))
        {
            breakStart = bs;
            breakEnd = be;
        }

        var interval = schedule.SlotIntervalMinutes <= 0 ? 30 : schedule.SlotIntervalMinutes;

        var reservations = await _context.Reservations
            .Include(r => r.Service)
            .Where(r =>
                r.BarberId == barberId &&
                r.Date == date &&
                r.Status != "Cancelled")
            .ToListAsync();

        var result = new List<string>();
        var current = openTime;

        while (current < closeTime)
        {
            var end = current.AddMinutes(interval);

            if (end > closeTime)
                break;

            var overlapsBreak = breakStart.HasValue && breakEnd.HasValue &&
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

        return result;
    }

    private async Task<(bool IsValid, string? Error)> ValidateRescheduleAsync(
        int barberId,
        int reservationId,
        DateOnly newDate,
        TimeOnly newTime,
        int serviceDurationMinutes)
    {
        if (newDate < DateOnly.FromDateTime(DateTime.Today))
            return (false, "No puedes reprogramar a una fecha pasada");

        var dayOfWeek = (int)newDate.DayOfWeek;

        var schedule = await _context.BarberBusinessHours
            .FirstOrDefaultAsync(x => x.BarberId == barberId && x.DayOfWeek == dayOfWeek);

        if (schedule is null || !schedule.IsOpen)
            return (false, "El barbero no trabaja ese día");

        if (!TimeOnly.TryParse(schedule.OpenTime, out var openTime) ||
            !TimeOnly.TryParse(schedule.CloseTime, out var closeTime))
        {
            return (false, "Horario inválido del barbero");
        }

        TimeOnly? breakStart = null;
        TimeOnly? breakEnd = null;

        if (!string.IsNullOrWhiteSpace(schedule.BreakStart) &&
            !string.IsNullOrWhiteSpace(schedule.BreakEnd) &&
            TimeOnly.TryParse(schedule.BreakStart, out var bs) &&
            TimeOnly.TryParse(schedule.BreakEnd, out var be))
        {
            breakStart = bs;
            breakEnd = be;
        }

        var newEnd = newTime.AddMinutes(serviceDurationMinutes);

        if (newTime < openTime || newEnd > closeTime)
            return (false, "La nueva hora está fuera del horario laboral");

        var overlapsBreak = breakStart.HasValue && breakEnd.HasValue &&
                            newTime < breakEnd.Value &&
                            newEnd > breakStart.Value;

        if (overlapsBreak)
            return (false, "La nueva hora coincide con el descanso");

        var reservations = await _context.Reservations
            .Include(r => r.Service)
            .Where(r =>
                r.BarberId == barberId &&
                r.Date == newDate &&
                r.Id != reservationId &&
                r.Status != "Cancelled")
            .ToListAsync();

        var overlapsReservation = reservations.Any(r =>
        {
            if (!TimeOnly.TryParse(r.Time, out var reservationStart))
                return false;

            var reservationEnd = reservationStart.AddMinutes(r.Service.DurationMinutes);
            return newTime < reservationEnd && newEnd > reservationStart;
        });

        if (overlapsReservation)
            return (false, "La nueva hora se solapa con otra reserva");

        return (true, null);
    }

    [HttpGet("today")]
    public async Task<IActionResult> GetToday()
    {
        var barberId = GetMyBarberId();

        if (barberId is null)
            return Forbid();

        var barberProfile = await _context.Barbers
            .Where(x => x.Id == barberId.Value)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.Specialty,
                x.ImageUrl
            })
            .FirstOrDefaultAsync();

        var today = DateOnly.FromDateTime(DateTime.Today);
        var currentTime = TimeOnly.FromDateTime(DateTime.Now);

        var reservationsRaw = await _context.Reservations
            .Include(r => r.User)
            .Include(r => r.Service)
            .Include(r => r.Barber)
            .Where(r => r.BarberId == barberId && r.Date == today)
            .OrderBy(r => r.Time)
            .ToListAsync();

        decimal estimatedIncome = 0;

        foreach (var reservation in reservationsRaw.Where(x => x.Status != "Cancelled"))
        {
            estimatedIncome += await GetReservationPriceAsync(
                barberId.Value,
                reservation.ServiceId,
                reservation.Service.Price);
        }

        var reservations = reservationsRaw
            .Select(r => new
            {
                r.Id,
                date = r.Date.ToString("yyyy-MM-dd"),
                time = r.Time,
                r.Status,
                r.Notes,
                customerName = r.User.Name,
                customerPhone = r.User.Phone,
                serviceName = r.Service.Name,
                barberName = r.Barber.Name
            })
            .ToList();

        var total = reservations.Count;
        var confirmed = reservations.Count(x => x.Status == "Confirmed");
        var completed = reservations.Count(x => x.Status == "Completed");
        var cancelled = reservations.Count(x => x.Status == "Cancelled");

        var upcoming = reservations
            .Where(x =>
            {
                if (!TimeOnly.TryParse(x.time, out var parsedTime))
                    return false;

                return parsedTime >= currentTime &&
                       x.Status != "Cancelled" &&
                       x.Status != "Completed";
            })
            .ToList();

        var freeSlots = await GenerateFreeSlotsAsync(barberId.Value, today);

        return Ok(new
        {
            date = today.ToString("yyyy-MM-dd"),
            barber = barberProfile,
            total,
            confirmed,
            completed,
            cancelled,
            estimatedIncome,
            freeSlots,
            upcoming,
            reservations
        });
    }

    [HttpPatch("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateBarberProfileDto dto)
    {
        var barberId = GetMyBarberId();

        if (barberId is null)
            return Forbid();

        var barber = await _context.Barbers.FirstOrDefaultAsync(x => x.Id == barberId.Value && x.IsActive);

        if (barber is null)
            return NotFound(new { message = "Barbero no encontrado" });

        barber.ImageUrl = dto.ImageUrl?.Trim() ?? "";

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Foto actualizada correctamente",
            imageUrl = barber.ImageUrl
        });
    }

    [HttpGet("reservations")]
    public async Task<IActionResult> GetMyReservations([FromQuery] string? date = null)
    {
        var barberId = GetMyBarberId();

        if (barberId is null)
            return Forbid();

        var targetDate = string.IsNullOrWhiteSpace(date)
            ? DateOnly.FromDateTime(DateTime.Today)
            : DateOnly.Parse(date);

        var reservations = await _context.Reservations
            .Include(r => r.User)
            .Include(r => r.Service)
            .Include(r => r.Barber)
            .Where(r => r.BarberId == barberId && r.Date == targetDate)
            .OrderBy(r => r.Time)
            .Select(r => new
            {
                r.Id,
                date = r.Date.ToString("yyyy-MM-dd"),
                time = r.Time,
                r.Status,
                r.Notes,
                customerName = r.User.Name,
                customerPhone = r.User.Phone,
                serviceName = r.Service.Name,
                barberName = r.Barber.Name
            })
            .ToListAsync();

        return Ok(reservations);
    }

    [HttpGet("free-slots")]
    public async Task<IActionResult> GetFreeSlots([FromQuery] string? date = null)
    {
        var barberId = GetMyBarberId();

        if (barberId is null)
            return Forbid();

        var targetDate = string.IsNullOrWhiteSpace(date)
            ? DateOnly.FromDateTime(DateTime.Today)
            : DateOnly.Parse(date);

        var slots = await GenerateFreeSlotsAsync(barberId.Value, targetDate);

        return Ok(new
        {
            date = targetDate.ToString("yyyy-MM-dd"),
            freeSlots = slots
        });
    }

    [HttpPatch("reservations/{id}/status")]
    public async Task<IActionResult> UpdateReservationStatus(
        int id,
        [FromBody] UpdateReservationStatusDto dto)
    {
        var barberId = GetMyBarberId();

        if (barberId is null)
            return Forbid();

        var allowedStatuses = new[] { "Pending", "Confirmed", "Completed", "Cancelled" };

        if (string.IsNullOrWhiteSpace(dto.Status) || !allowedStatuses.Contains(dto.Status))
            return BadRequest(new { message = "Estado inválido" });

        var reservation = await _context.Reservations
            .FirstOrDefaultAsync(r => r.Id == id && r.BarberId == barberId);

        if (reservation is null)
            return NotFound(new { message = "Reserva no encontrada" });

        reservation.Status = dto.Status;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Estado actualizado correctamente" });
    }

    [HttpPatch("reservations/{id}/reschedule")]
    public async Task<IActionResult> RescheduleReservation(
        int id,
        [FromBody] RescheduleReservationDto dto)
    {
        var barberId = GetMyBarberId();

        if (barberId is null)
            return Forbid();

        if (string.IsNullOrWhiteSpace(dto.Date) || string.IsNullOrWhiteSpace(dto.Time))
            return BadRequest(new { message = "Fecha y hora son obligatorias" });

        var reservation = await _context.Reservations
            .Include(r => r.Service)
            .FirstOrDefaultAsync(r => r.Id == id && r.BarberId == barberId);

        if (reservation is null)
            return NotFound(new { message = "Reserva no encontrada" });

        if (!DateOnly.TryParse(dto.Date, out var newDate))
            return BadRequest(new { message = "Fecha inválida" });

        if (!TimeOnly.TryParse(dto.Time, out var newTime))
            return BadRequest(new { message = "Hora inválida" });

        var validation = await ValidateRescheduleAsync(
            barberId.Value,
            reservation.Id,
            newDate,
            newTime,
            reservation.Service.DurationMinutes);

        if (!validation.IsValid)
            return BadRequest(new { message = validation.Error });

        reservation.Date = newDate;
        reservation.Time = dto.Time;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Reserva reprogramada correctamente" });
    }
}
