using BlueHarbor.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace BlueHarbor.Api.Data;

public class BlueHarborDbContext : DbContext
{
    public BlueHarborDbContext(DbContextOptions<BlueHarborDbContext> options)
        : base(options) { }

    public DbSet<Ship> Ships => Set<Ship>();
    public DbSet<AppState> AppState => Set<AppState>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Una sola riga di stato, giorno corrente iniziale = 0.
        modelBuilder.Entity<AppState>().HasData(new AppState { Id = 1, CurrentDay = 0 });

        // Enum salvati come stringa: rende il DB più leggibile da ispezionare.
        modelBuilder.Entity<Ship>().Property(s => s.Size).HasConversion<string>();
        modelBuilder.Entity<Ship>().Property(s => s.Status).HasConversion<string>();
    }
}
