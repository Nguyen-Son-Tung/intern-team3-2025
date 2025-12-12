using PropertyService.Models.Enums;

namespace PropertyService.Models;

public class Contract
{
    public int Id { get; set; }
    public string Code { get; set; } = null!;

    public int RoomId { get; set; }
    public Room Room { get; set; } = null!;

    public string TenantId { get; set; } = null!;
    public string? TenantName { get; set; }

    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public decimal RentPrice { get; set; }

    public ContractStatus Status { get; set; } = ContractStatus.Active;
}
