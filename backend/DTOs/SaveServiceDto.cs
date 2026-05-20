namespace backend.DTOs;

public class SaveServiceDto
{
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public int DurationMinutes { get; set; }
    public decimal Price { get; set; }
    public bool IsActive { get; set; } = true;

    public bool RequiresDeposit { get; set; }
    public decimal DepositAmount { get; set; }
}