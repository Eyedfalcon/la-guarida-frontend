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
public class AdminServicesController : ControllerBase
{
    private readonly AppDbContext _context;

    public AdminServicesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var services = await _context.Services
            .Where(x => x.IsActive)
            .OrderBy(x => x.Name)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.Description,
                x.DurationMinutes,
                x.Price,
                x.IsActive,
                x.RequiresDeposit,
                x.DepositAmount
            })
            .ToListAsync();

        return Ok(services);
    }

    [HttpPost]
    public async Task<IActionResult> Create(SaveServiceDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(new { message = "El nombre es obligatorio" });
        }

        if (dto.DurationMinutes <= 0)
        {
            return BadRequest(new { message = "La duración debe ser mayor que 0" });
        }

        if (!dto.RequiresDeposit)
        {
            dto.DepositAmount = 0;
        }

        if (dto.RequiresDeposit && dto.DepositAmount <= 0)
        {
            return BadRequest(new { message = "La señal debe ser mayor que 0" });
        }

        var service = new ServiceItem
        {
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim() ?? "",
            DurationMinutes = dto.DurationMinutes,
            Price = dto.Price,
            IsActive = dto.IsActive,
            RequiresDeposit = dto.RequiresDeposit,
            DepositAmount = dto.DepositAmount
        };

        _context.Services.Add(service);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            service.Id,
            service.Name,
            service.Description,
            service.DurationMinutes,
            service.Price,
            service.IsActive,
            service.RequiresDeposit,
            service.DepositAmount
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, SaveServiceDto dto)
    {
        var service = await _context.Services.FindAsync(id);

        if (service is null)
        {
            return NotFound(new { message = "Servicio no encontrado" });
        }

        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(new { message = "El nombre es obligatorio" });
        }

        if (dto.DurationMinutes <= 0)
        {
            return BadRequest(new { message = "La duración debe ser mayor que 0" });
        }

        if (!dto.RequiresDeposit)
        {
            dto.DepositAmount = 0;
        }

        if (dto.RequiresDeposit && dto.DepositAmount <= 0)
        {
            return BadRequest(new { message = "La señal debe ser mayor que 0" });
        }

        service.Name = dto.Name.Trim();
        service.Description = dto.Description?.Trim() ?? "";
        service.DurationMinutes = dto.DurationMinutes;
        service.Price = dto.Price;
        service.IsActive = dto.IsActive;
        service.RequiresDeposit = dto.RequiresDeposit;
        service.DepositAmount = dto.DepositAmount;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Servicio actualizado correctamente" });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var service = await _context.Services.FindAsync(id);

        if (service is null)
        {
            return NotFound(new { message = "Servicio no encontrado" });
        }

        service.IsActive = false;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Servicio eliminado correctamente" });
    }
}