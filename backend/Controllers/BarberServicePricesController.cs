using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BarberServicePricesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BarberServicePricesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<BarberServicePriceDto>>> GetAll()
        {
            var prices = await _context.BarberServices
                .Include(x => x.Barber)
                .Include(x => x.Service)
                .Select(x => new BarberServicePriceDto
                {
                    BarberId = x.BarberId,
                    BarberName = x.Barber.Name,
                    ServiceId = x.ServiceId,
                    ServiceName = x.Service.Name,
                    Price = x.Price
                })
                .ToListAsync();

            return Ok(prices);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut]
        public async Task<IActionResult> UpdatePrice([FromBody] BarberServicePriceDto dto)
        {
            if (dto.BarberId <= 0 || dto.ServiceId <= 0)
                return BadRequest(new { message = "BarberId y ServiceId son obligatorios" });

            if (dto.Price < 0)
                return BadRequest(new { message = "El precio no puede ser negativo" });

            var item = await _context.BarberServices
                .FirstOrDefaultAsync(x =>
                    x.BarberId == dto.BarberId &&
                    x.ServiceId == dto.ServiceId);

            if (item == null)
            {
                item = new BarberService
                {
                    BarberId = dto.BarberId,
                    ServiceId = dto.ServiceId,
                    Price = dto.Price
                };

                _context.BarberServices.Add(item);
            }
            else
            {
                item.Price = dto.Price;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Precio actualizado correctamente" });
        }
    }
}