namespace backend.DTOs;

public class SaveBarberBusinessHourDto
{
    public int DayOfWeek { get; set; }
    public string Label { get; set; } = "";
    public bool IsOpen { get; set; }
    public string OpenTime { get; set; } = "";
    public string CloseTime { get; set; } = "";
    public string BreakStart { get; set; } = "";
    public string BreakEnd { get; set; } = "";
    public int SlotIntervalMinutes { get; set; } = 30;
}