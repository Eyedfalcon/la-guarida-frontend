using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminScheduleController : ControllerBase
{
    private readonly AppDbContext _context;

    public AdminScheduleController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("barbers/{barberId}/hours")]
    public async Task<IActionResult> GetBarberHours(int barberId)
    {
        var barber = await _context.Barbers.FirstOrDefaultAsync(x => x.Id == barberId && x.IsActive);

        if (barber is null)
        {
            return NotFound(new { message = "Barbero no encontrado" });
        }

        var hours = await _context.BarberBusinessHours
            .Where(x => x.BarberId == barberId)
            .OrderBy(x => x.DayOfWeek)
            .ToListAsync();

        if (hours.Count == 0)
        {
            hours = GetDefaultHours(barberId);
            _context.BarberBusinessHours.AddRange(hours);
            await _context.SaveChangesAsync();
        }

        var ordered = hours
            .OrderBy(x =>
            {
                var order = new[] { 1, 2, 3, 4, 5, 6, 0 };
                return Array.IndexOf(order, x.DayOfWeek);
            })
            .Select(x => new
            {
                x.DayOfWeek,
                x.Label,
                x.IsOpen,
                x.OpenTime,
                x.CloseTime,
                x.BreakStart,
                x.BreakEnd,
                x.SlotIntervalMinutes
            });

        return Ok(ordered);
    }

    [HttpPut("barbers/{barberId}/hours")]
    public async Task<IActionResult> SaveBarberHours(int barberId, List<SaveBarberBusinessHourDto> dto)
    {
        var barber = await _context.Barbers.FirstOrDefaultAsync(x => x.Id == barberId && x.IsActive);

        if (barber is null)
        {
            return NotFound(new { message = "Barbero no encontrado" });
        }

        if (dto is null || dto.Count == 0)
        {
            return BadRequest(new { message = "Debes enviar horarios" });
        }

        if (dto.Any(x => x.DayOfWeek < 0 || x.DayOfWeek > 6))
        {
            return BadRequest(new { message = "DayOfWeek debe estar entre 0 y 6" });
        }

        if (dto.Any(x => x.SlotIntervalMinutes <= 0))
        {
            return BadRequest(new { message = "El intervalo debe ser mayor que 0" });
        }

        var existing = await _context.BarberBusinessHours
            .Where(x => x.BarberId == barberId)
            .ToListAsync();

        _context.BarberBusinessHours.RemoveRange(existing);

        var newItems = dto.Select(x => new BarberBusinessHour
        {
            BarberId = barberId,
            DayOfWeek = x.DayOfWeek,
            Label = x.Label?.Trim() ?? "",
            IsOpen = x.IsOpen,
            OpenTime = x.OpenTime?.Trim() ?? "",
            CloseTime = x.CloseTime?.Trim() ?? "",
            BreakStart = x.BreakStart?.Trim() ?? "",
            BreakEnd = x.BreakEnd?.Trim() ?? "",
            SlotIntervalMinutes = x.SlotIntervalMinutes
        }).ToList();

        _context.BarberBusinessHours.AddRange(newItems);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Horarios guardados correctamente" });
    }

    private static List<BarberBusinessHour> GetDefaultHours(int barberId)
    {
        return new List<BarberBusinessHour>
        {
            new() { BarberId = barberId, DayOfWeek = 1, Label = "Lunes", IsOpen = true, OpenTime = "09:00", CloseTime = "20:00", BreakStart = "14:00", BreakEnd = "15:00", SlotIntervalMinutes = 30 },
            new() { BarberId = barberId, DayOfWeek = 2, Label = "Martes", IsOpen = true, OpenTime = "09:00", CloseTime = "20:00", BreakStart = "14:00", BreakEnd = "15:00", SlotIntervalMinutes = 30 },
            new() { BarberId = barberId, DayOfWeek = 3, Label = "Miércoles", IsOpen = true, OpenTime = "09:00", CloseTime = "20:00", BreakStart = "14:00", BreakEnd = "15:00", SlotIntervalMinutes = 30 },
            new() { BarberId = barberId, DayOfWeek = 4, Label = "Jueves", IsOpen = true, OpenTime = "09:00", CloseTime = "20:00", BreakStart = "14:00", BreakEnd = "15:00", SlotIntervalMinutes = 30 },
            new() { BarberId = barberId, DayOfWeek = 5, Label = "Viernes", IsOpen = true, OpenTime = "09:00", CloseTime = "21:00", BreakStart = "14:00", BreakEnd = "15:00", SlotIntervalMinutes = 30 },
            new() { BarberId = barberId, DayOfWeek = 6, Label = "Sábado", IsOpen = true, OpenTime = "10:00", CloseTime = "18:00", BreakStart = "", BreakEnd = "", SlotIntervalMinutes = 30 },
            new() { BarberId = barberId, DayOfWeek = 0, Label = "Domingo", IsOpen = false, OpenTime = "", CloseTime = "", BreakStart = "", BreakEnd = "", SlotIntervalMinutes = 30 }
        };
    }
}