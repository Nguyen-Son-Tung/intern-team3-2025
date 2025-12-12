using PropertyService.Models.Enums;

namespace PropertyService.Models;

public class Room
{
    public int Id { get; set; }
    public int HouseId { get; set; }
    public House House { get; set; } = null!;
    public string Name { get; set; } = null!;
    public int Floor { get; set; }
    public RoomStatus Status { get; set; } = RoomStatus.Vacant;
}
