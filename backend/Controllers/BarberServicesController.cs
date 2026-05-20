using backend.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BarberServicesController : ControllerBase
{
    private readonly AppDbContext _context;

    public BarberServicesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var data = await _context.BarberServices
            .Where(x => x.IsActive)
            .Select(x => new
            {
                x.Id,
                x.BarberId,
                x.ServiceId,
                x.Price
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet("price")]
    public async Task<IActionResult> GetPrice([FromQuery] int barberId, [FromQuery] int serviceId)
    {
        var item = await _context.BarberServices
            .Where(x => x.IsActive && x.BarberId == barberId && x.ServiceId == serviceId)
            .Select(x => new
            {
                x.Id,
                x.BarberId,
                x.ServiceId,
                x.Price
            })
            .FirstOrDefaultAsync();

        if (item is null)
            return NotFound(new { message = "No se encontró precio para esta combinación" });

        return Ok(item);
    }
}