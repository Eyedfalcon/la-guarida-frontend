namespace backend.Models;

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Phone { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public DateTime? Birthday { get; set; }
    public DateTime CreatedAt { get; set; }
    public string Role { get; set; } = "User";

    public int? BarberId { get; set; }
    public Barber? Barber { get; set; }

    public List<Reservation> Reservations { get; set; } = new();
}