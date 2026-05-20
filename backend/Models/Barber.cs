namespace backend.Models;

public class Barber
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Specialty { get; set; } = "";
    public string ImageUrl { get; set; } = "";
    public string Experience { get; set; } = "";
    public decimal Price { get; set; }
    public bool IsActive { get; set; } = true;

    public List<Reservation> Reservations { get; set; } = new();
    public List<BarberService> BarberServices { get; set; } = new();
    public List<BarberBusinessHour> BusinessHours { get; set; } = new();
}