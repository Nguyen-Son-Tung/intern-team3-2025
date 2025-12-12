using Microsoft.EntityFrameworkCore;
using PropertyService.Models;
using PropertyService.Models.Enums;

namespace PropertyService;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<House> Houses => Set<House>();
    public DbSet<Room> Rooms => Set<Room>();
    public DbSet<Contract> Contracts => Set<Contract>();  // ✅ Chỉ còn Contracts, KHÔNG còn TenantContract

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Enum → string mapping cho Room.Status
        modelBuilder.Entity<Room>()
            .Property(r => r.Status)
            .HasConversion<string>();

        // House → Rooms relationship
        modelBuilder.Entity<House>()
            .HasMany(h => h.Rooms)
            .WithOne(r => r.House)
            .HasForeignKey(r => r.HouseId)
            .OnDelete(DeleteBehavior.Cascade);

        // Enum → string mapping cho Contract.Status
        modelBuilder.Entity<Contract>()
            .Property(c => c.Status)
            .HasConversion<string>();

        base.OnModelCreating(modelBuilder);
    }
}
