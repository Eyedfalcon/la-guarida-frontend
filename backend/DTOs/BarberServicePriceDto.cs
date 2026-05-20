namespace backend.DTOs
{
    public class BarberServicePriceDto
    {
        public int BarberId { get; set; }
        public string? BarberName { get; set; }

        public int ServiceId { get; set; }
        public string? ServiceName { get; set; }

        public decimal Price { get; set; }
    }
}