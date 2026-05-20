using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Barber> Barbers => Set<Barber>();
    public DbSet<ServiceItem> Services => Set<ServiceItem>();
    public DbSet<Reservation> Reservations => Set<Reservation>();
    public DbSet<BarberService> BarberServices => Set<BarberService>();
    public DbSet<BarberBusinessHour> BarberBusinessHours => Set<BarberBusinessHour>();
    

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>()
            .HasIndex(x => x.Email)
            .IsUnique();

        modelBuilder.Entity<Barber>()
            .Property(x => x.Price)
            .HasPrecision(10, 2);

        modelBuilder.Entity<ServiceItem>()
            .Property(x => x.Price)
            .HasPrecision(10, 2);

        modelBuilder.Entity<BarberService>()
            .Property(x => x.Price)
            .HasPrecision(10, 2);

        modelBuilder.Entity<Reservation>()
            .Property(x => x.Time)
            .HasMaxLength(10);

        modelBuilder.Entity<Reservation>()
            .Property(x => x.Status)
            .HasMaxLength(50);

        modelBuilder.Entity<Reservation>()
            .HasOne(x => x.User)
            .WithMany(x => x.Reservations)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Reservation>()
            .HasOne(x => x.Barber)
            .WithMany(x => x.Reservations)
            .HasForeignKey(x => x.BarberId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Reservation>()
            .HasOne(x => x.Service)
            .WithMany(x => x.Reservations)
            .HasForeignKey(x => x.ServiceId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<BarberService>()
            .HasOne(x => x.Barber)
            .WithMany(x => x.BarberServices)
            .HasForeignKey(x => x.BarberId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<BarberService>()
            .HasOne(x => x.Service)
            .WithMany(x => x.BarberServices)
            .HasForeignKey(x => x.ServiceId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<BarberService>()
            .HasIndex(x => new { x.BarberId, x.ServiceId })
            .IsUnique();

        modelBuilder.Entity<User>()
            .Property(x => x.Birthday)
            .HasColumnType("date");

        modelBuilder.Entity<User>()
            .Property(x => x.Role)
            .HasMaxLength(20)
            .HasDefaultValue("User");
        modelBuilder.Entity<User>()
          .HasOne(x => x.Barber)
         .WithMany()
         .HasForeignKey(x => x.BarberId)
         .OnDelete(DeleteBehavior.SetNull);    

        modelBuilder.Entity<BarberBusinessHour>()
            .Property(x => x.Label)
            .HasMaxLength(30);

        modelBuilder.Entity<BarberBusinessHour>()
            .Property(x => x.OpenTime)
            .HasMaxLength(5);

        modelBuilder.Entity<BarberBusinessHour>()
            .Property(x => x.CloseTime)
            .HasMaxLength(5);

        modelBuilder.Entity<BarberBusinessHour>()
            .Property(x => x.BreakStart)
            .HasMaxLength(5);

        modelBuilder.Entity<BarberBusinessHour>()
            .Property(x => x.BreakEnd)
            .HasMaxLength(5);

        modelBuilder.Entity<BarberBusinessHour>()
            .HasOne(x => x.Barber)
            .WithMany(x => x.BusinessHours)
            .HasForeignKey(x => x.BarberId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<BarberBusinessHour>()
            .HasIndex(x => new { x.BarberId, x.DayOfWeek })
            .IsUnique();
         modelBuilder.Entity<ServiceItem>()
    .Property(x => x.DepositAmount)
    .HasColumnType("numeric(10,2)");

modelBuilder.Entity<Reservation>()
    .Property(x => x.DepositAmount)
    .HasColumnType("numeric(10,2)");

modelBuilder.Entity<Reservation>()
    .Property(x => x.DepositStatus)
    .HasMaxLength(30)
    .HasDefaultValue("NotRequired");   
            
    }
    
    
}