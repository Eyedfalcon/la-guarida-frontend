namespace backend.Models;

public class ServiceItem
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public int DurationMinutes { get; set; }
    public decimal Price { get; set; }
    public bool IsActive { get; set; } = true;

    public bool RequiresDeposit { get; set; }
    public decimal DepositAmount { get; set; }

    public List<Reservation> Reservations { get; set; } = new();
    public List<BarberService> BarberServices { get; set; } = new();
}