using backend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

public class UpdateAdminReservationStatusRequest
{
    public string Status { get; set; } = "";
}

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminReservationsController : ControllerBase
{
    private readonly AppDbContext _context;

    public AdminReservationsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var reservations = await _context.Reservations
            .Include(x => x.User)
            .Include(x => x.Barber)
            .Include(x => x.Service)
            .OrderByDescending(x => x.Date)
            .ThenByDescending(x => x.Time)
            .Select(x => new
            {
                id = x.Id,
                customerName = x.User.Name,
                customerEmail = x.User.Email,
                customerPhone = x.User.Phone,
                barberName = x.Barber.Name,
                serviceName = x.Service.Name,
                date = x.Date.ToString("yyyy-MM-dd"),
                time = x.Time,
                status = x.Status,
                notes = x.Notes,
                depositAmount = x.DepositAmount,
                depositStatus = x.DepositStatus,
                depositPaidAt = x.DepositPaidAt,
                depositExpiresAt = x.DepositExpiresAt
            })
            .ToListAsync();

        return Ok(reservations);
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateAdminReservationStatusRequest dto)
    {
        var allowed = new[] { "Pending", "Confirmed", "Completed", "Cancelled" };

        if (string.IsNullOrWhiteSpace(dto.Status) || !allowed.Contains(dto.Status))
            return BadRequest(new { message = "Estado inválido" });

        var reservation = await _context.Reservations.FirstOrDefaultAsync(x => x.Id == id);

        if (reservation == null)
            return NotFound(new { message = "Reserva no encontrada" });

        reservation.Status = dto.Status;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Estado actualizado correctamente" });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var reservation = await _context.Reservations.FirstOrDefaultAsync(x => x.Id == id);

        if (reservation == null)
            return NotFound(new { message = "Reserva no encontrada" });

        _context.Reservations.Remove(reservation);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Reserva eliminada correctamente" });
    }

    [HttpPatch("{id}/deposit/confirm")]
public async Task<IActionResult> ConfirmDeposit(int id)
{
    var reservation = await _context.Reservations.FirstOrDefaultAsync(x => x.Id == id);

    if (reservation == null)
        return NotFound(new { message = "Reserva no encontrada" });

    if (reservation.DepositAmount <= 0)
        return BadRequest(new { message = "La reserva no tiene señal" });

    reservation.DepositStatus = "Paid";
    reservation.DepositPaidAt = DateTime.UtcNow;
    reservation.DepositExpiresAt = null;
    reservation.Status = "Confirmed";

    await _context.SaveChangesAsync();

    return Ok(new { message = "Pago confirmado correctamente" });
}

    [HttpPatch("{id}/deposit/reject")]
public async Task<IActionResult> RejectDeposit(int id)
{
    var reservation = await _context.Reservations.FirstOrDefaultAsync(x => x.Id == id);

    if (reservation == null)
        return NotFound(new { message = "Reserva no encontrada" });

    if (reservation.DepositAmount <= 0)
        return BadRequest(new { message = "La reserva no tiene señal" });

    reservation.DepositStatus = "Rejected";
    reservation.DepositPaidAt = null;

    await _context.SaveChangesAsync();

    return Ok(new { message = "Comprobante rechazado" });
}

    [HttpPatch("{id}/deposit/expire")]
public async Task<IActionResult> ExpireDeposit(int id)
{
    var reservation = await _context.Reservations.FirstOrDefaultAsync(x => x.Id == id);

    if (reservation == null)
        return NotFound(new { message = "Reserva no encontrada" });

    if (reservation.DepositAmount <= 0)
        return BadRequest(new { message = "La reserva no tiene señal" });

    reservation.DepositStatus = "Expired";
    reservation.DepositExpiresAt = DateTime.UtcNow;
    reservation.Status = "Cancelled";

    await _context.SaveChangesAsync();

    return Ok(new { message = "Señal marcada como expirada" });
}
}