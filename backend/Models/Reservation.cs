namespace backend.Models;

public class Reservation
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public int BarberId { get; set; }
    public Barber Barber { get; set; } = null!;

    public int ServiceId { get; set; }
    public ServiceItem Service { get; set; } = null!;

    public DateOnly Date { get; set; }
    public string Time { get; set; } = "";
    public string Notes { get; set; } = "";
    public string Status { get; set; } = "Confirmed";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public decimal DepositAmount { get; set; }
    public string DepositStatus { get; set; } = "NotRequired";
    public DateTime? DepositPaidAt { get; set; }
    public DateTime? DepositExpiresAt { get; set; }
}