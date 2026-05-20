namespace backend.DTOs;

public class SaveBarberDto
{
    public string Name { get; set; } = "";
    public string Specialty { get; set; } = "";
    public string ImageUrl { get; set; } = "";
    public string Experience { get; set; } = "";
    public decimal Price { get; set; }
    public bool IsActive { get; set; } = true;
    public string LinkedEmail { get; set; } = "";
}
