namespace PropertyService.Data;
using Microsoft.EntityFrameworkCore;
using PropertyService.Models; 
using PropertyService.Models.Enums;
<<<<<<< HEAD

namespace PropertyService;

=======
>>>>>>> origin/main
public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<House> Houses => Set<House>();
    public DbSet<Room> Rooms => Set<Room>();
<<<<<<< HEAD
    public DbSet<Contract> Contracts => Set<Contract>();  // ✅ Chỉ còn Contracts, KHÔNG còn TenantContract

=======
    public DbSet<TenantContracts> TenantContracts { get; set; }
>>>>>>> origin/main
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

<<<<<<< HEAD
        // Enum → string mapping cho Contract.Status
        modelBuilder.Entity<Contract>()
            .Property(c => c.Status)
            .HasConversion<string>();
=======
        modelBuilder.Entity<TenantContracts>()
            .Property(c => c.Status)
            .HasConversion<string>(); 
>>>>>>> origin/main

        base.OnModelCreating(modelBuilder);
    }
}
