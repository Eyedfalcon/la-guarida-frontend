namespace backend.DTOs;

public class ResetPasswordDto
{
    public string Email { get; set; } = "";
    public DateTime? Birthday { get; set; }
    public string NewPassword { get; set; } = "";
}
