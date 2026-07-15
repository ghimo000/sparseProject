using BlueHarbor.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace BlueHarbor.Api.Data;

public class BlueHarborDbContext : DbContext
{
    /// <summary>Riceve le opzioni con stringa di connessione e provider DB.</summary>
    public BlueHarborDbContext(DbContextOptions<BlueHarborDbContext> options)
        : base(options) { }

    public DbSet<Ship> Ships => Set<Ship>();
    public DbSet<BerthAssignment> BerthAssignments => Set<BerthAssignment>();
    public DbSet<AppState> AppState => Set<AppState>();

    /// <summary>Configura seed iniziale e formato degli enum nel database.</summary>
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Una sola riga per il giorno virtuale corrente.
        modelBuilder.Entity<AppState>().HasData(new AppState { Id = 1, CurrentDay = 0 });

        // Enum salvati come testo per leggere meglio il database.
        modelBuilder.Entity<Ship>().Property(s => s.Size).HasConversion<string>();
        modelBuilder.Entity<Ship>().Property(s => s.Status).HasConversion<string>();

        // Una nave ha al piu una assegnazione, mai riassegnata: relazione 1:0..1.
        modelBuilder.Entity<BerthAssignment>().Property(a => a.BerthName).HasMaxLength(10);
        modelBuilder.Entity<BerthAssignment>()
            .HasIndex(a => a.ShipId)
            .IsUnique();
        modelBuilder.Entity<BerthAssignment>()
            .HasOne(a => a.Ship)
            .WithOne(s => s.Assignment)
            .HasForeignKey<BerthAssignment>(a => a.ShipId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
