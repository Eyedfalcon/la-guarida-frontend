using backend.Data;
using backend.DTOs;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly JwtService _jwtService;

    public AuthController(AppDbContext context, JwtService jwtService)
    {
        _context = context;
        _jwtService = jwtService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name) ||
            string.IsNullOrWhiteSpace(dto.Email) ||
            string.IsNullOrWhiteSpace(dto.Password))
        {
            return BadRequest(new { message = "Datos incompletos" });
        }

        var exists = await _context.Users.AnyAsync(x => x.Email == dto.Email);
        if (exists)
        {
            return BadRequest(new { message = "El email ya está registrado" });
        }

        var user = new User
        {
            Name = dto.Name,
            Email = dto.Email,
            Phone = dto.Phone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Birthday = dto.Birthday,
            CreatedAt = DateTime.UtcNow,
            Role = "User"
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var token = _jwtService.GenerateToken(user);

        return Ok(new
        {
            token,
            user = new
{
    id = user.Id,
    name = user.Name,
    email = user.Email,
    phone = user.Phone,
    birthday = user.Birthday,
    role = user.Role,
    barberId = user.BarberId
}
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(x => x.Email == dto.Email);

        if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Credenciales inválidas" });
        }

        var token = _jwtService.GenerateToken(user);

        return Ok(new
        {
            token,
            user = new
{
    id = user.Id,
    name = user.Name,
    email = user.Email,
    phone = user.Phone,
    birthday = user.Birthday,
    role = user.Role,
    barberId = user.BarberId
            }
        });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) ||
            string.IsNullOrWhiteSpace(dto.NewPassword) ||
            dto.Birthday is null)
        {
            return BadRequest(new { message = "Datos incompletos" });
        }

        if (dto.NewPassword.Length < 6)
        {
            return BadRequest(new { message = "La contrasena debe tener al menos 6 caracteres" });
        }

        var normalizedEmail = dto.Email.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(x => x.Email.ToLower() == normalizedEmail);

        if (user is null || user.Birthday is null || user.Birthday.Value.Date != dto.Birthday.Value.Date)
        {
            return BadRequest(new { message = "No pudimos validar los datos de la cuenta" });
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Contrasena actualizada correctamente" });
    }
}
