namespace backend.Models;

public class BarberService
{
    public int Id { get; set; }

    public int BarberId { get; set; }
    public Barber Barber { get; set; } = null!;

    public int ServiceId { get; set; }
    public ServiceItem Service { get; set; } = null!;

    public decimal Price { get; set; }
    public bool IsActive { get; set; } = true;
}