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
public class AdminBarbersController : ControllerBase
{
    private readonly AppDbContext _context;

    public AdminBarbersController(AppDbContext context)
    {
        _context = context;
    }

    private async Task<IActionResult?> ApplyLinkedUserAsync(int barberId, string? linkedEmail)
    {
        var normalizedEmail = linkedEmail?.Trim().ToLower() ?? "";
        var linkedUsers = await _context.Users
            .Where(x => x.BarberId == barberId)
            .ToListAsync();

        if (string.IsNullOrWhiteSpace(normalizedEmail))
        {
            foreach (var linkedUser in linkedUsers.Where(x => x.Role != "Admin"))
            {
                linkedUser.Role = "User";
                linkedUser.BarberId = null;
            }

            return null;
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(x => x.Email.ToLower() == normalizedEmail);

        if (user is null)
        {
            return BadRequest(new { message = "El email debe pertenecer a una cuenta registrada" });
        }

        if (user.Role == "Admin")
        {
            return BadRequest(new { message = "No puedes vincular una cuenta administradora como barbero" });
        }

        foreach (var linkedUser in linkedUsers.Where(x => x.Id != user.Id && x.Role != "Admin"))
        {
            linkedUser.Role = "User";
            linkedUser.BarberId = null;
        }

        user.Role = "Barber";
        user.BarberId = barberId;

        return null;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var barbersRaw = await _context.Barbers
            .Where(x => x.IsActive)
            .OrderBy(x => x.Name)
            .ToListAsync();

        var barberIds = barbersRaw.Select(x => x.Id).ToList();
        var linkedUsers = await _context.Users
            .Where(x => x.BarberId.HasValue && barberIds.Contains(x.BarberId.Value) && x.Role == "Barber")
            .Select(x => new { x.BarberId, x.Email })
            .ToListAsync();

        var barbers = barbersRaw.Select(x => new
        {
            x.Id,
            x.Name,
            x.Specialty,
            x.ImageUrl,
            x.Experience,
            x.Price,
            x.IsActive,
            linkedEmail = linkedUsers.FirstOrDefault(u => u.BarberId == x.Id)?.Email ?? ""
        });

        return Ok(barbers);
    }

    [HttpPost]
    public async Task<IActionResult> Create(SaveBarberDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(new { message = "El nombre es obligatorio" });
        }

        if (string.IsNullOrWhiteSpace(dto.Specialty))
        {
            return BadRequest(new { message = "La especialidad es obligatoria" });
        }

        if (!string.IsNullOrWhiteSpace(dto.LinkedEmail))
        {
            var normalizedEmail = dto.LinkedEmail.Trim().ToLower();
            var user = await _context.Users.FirstOrDefaultAsync(x => x.Email.ToLower() == normalizedEmail);

            if (user is null)
            {
                return BadRequest(new { message = "El email debe pertenecer a una cuenta registrada" });
            }

            if (user.Role == "Admin")
            {
                return BadRequest(new { message = "No puedes vincular una cuenta administradora como barbero" });
            }
        }

        var barber = new Barber
        {
            Name = dto.Name.Trim(),
            Specialty = dto.Specialty.Trim(),
            ImageUrl = dto.ImageUrl?.Trim() ?? "",
            Experience = dto.Experience?.Trim() ?? "",
            Price = dto.Price,
            IsActive = dto.IsActive
        };

        _context.Barbers.Add(barber);
        await _context.SaveChangesAsync();

        var linkError = await ApplyLinkedUserAsync(barber.Id, dto.LinkedEmail);
        if (linkError is not null)
        {
            return linkError;
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            barber.Id,
            barber.Name,
            barber.Specialty,
            barber.ImageUrl,
            barber.Experience,
            barber.Price,
            barber.IsActive,
            linkedEmail = dto.LinkedEmail?.Trim() ?? ""
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, SaveBarberDto dto)
    {
        var barber = await _context.Barbers.FindAsync(id);

        if (barber is null)
        {
            return NotFound(new { message = "Barbero no encontrado" });
        }

        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(new { message = "El nombre es obligatorio" });
        }

        if (string.IsNullOrWhiteSpace(dto.Specialty))
        {
            return BadRequest(new { message = "La especialidad es obligatoria" });
        }

        barber.Name = dto.Name.Trim();
        barber.Specialty = dto.Specialty.Trim();
        barber.ImageUrl = dto.ImageUrl?.Trim() ?? "";
        barber.Experience = dto.Experience?.Trim() ?? "";
        barber.Price = dto.Price;
        barber.IsActive = dto.IsActive;

        var linkError = await ApplyLinkedUserAsync(barber.Id, dto.LinkedEmail);
        if (linkError is not null)
        {
            return linkError;
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = "Barbero actualizado correctamente" });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var barber = await _context.Barbers.FindAsync(id);

        if (barber is null)
        {
            return NotFound(new { message = "Barbero no encontrado" });
        }

        barber.IsActive = false;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Barbero eliminado correctamente" });
    }
}
