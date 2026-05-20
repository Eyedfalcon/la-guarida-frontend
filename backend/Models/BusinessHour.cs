namespace backend.Models;

public class BusinessHour
{
    public int Id { get; set; }

    // 0 = Domingo, 1 = Lunes ... 6 = Sábado
    public int DayOfWeek { get; set; }

    public string Label { get; set; } = "";
    public bool IsOpen { get; set; } = true;

    public string OpenTime { get; set; } = "";
    public string CloseTime { get; set; } = "";

    public string BreakStart { get; set; } = "";
    public string BreakEnd { get; set; } = "";
}