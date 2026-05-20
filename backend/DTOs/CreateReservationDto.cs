namespace backend.DTOs;

public class CreateReservationDto
{
    public int BarberId { get; set; }
    public int ServiceId { get; set; }
    public string Date { get; set; } = "";
    public string Time { get; set; } = "";
    public string Notes { get; set; } = "";
}