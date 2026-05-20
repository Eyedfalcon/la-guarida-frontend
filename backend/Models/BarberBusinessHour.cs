namespace backend.Models;

public class BarberBusinessHour
{
    public int Id { get; set; }

    public int BarberId { get; set; }
    public Barber Barber { get; set; } = null!;

    public int DayOfWeek { get; set; }
    public string Label { get; set; } = "";
    public bool IsOpen { get; set; } = true;

    public string OpenTime { get; set; } = "";
    public string CloseTime { get; set; } = "";

    public string BreakStart { get; set; } = "";
    public string BreakEnd { get; set; } = "";

    public int SlotIntervalMinutes { get; set; } = 30;
}