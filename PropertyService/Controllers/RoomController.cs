using Microsoft.AspNetCore.Mvc;
using PropertyService.Services.Interfaces;
using PropertyService.DTOs.Rooms;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Net;
using PropertyService;
using Microsoft.EntityFrameworkCore;
using PropertyService.Models;
using PropertyService.Models.Enums;

namespace PropertyService.Controllers;

[ApiController]
[Route("api/houses/{houseId}/rooms")]
[Authorize(Roles = "Owner")]
public class RoomController : ControllerBase
{
    private readonly IRoomService _roomService;
    private readonly IHouseService _houseService;
  private readonly ApplicationDbContext _context;

 public RoomController(
        IRoomService roomService,
        IHouseService houseService,
        ApplicationDbContext context)               
    {
        _roomService = roomService;
        _houseService = houseService;
        _context = context;
    }

    // =============================
    // HELPER LẤY OWNER ID
    // =============================
    private Guid GetOwnerIdGuid()
    {
        string? ownerIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(ownerIdString) || !Guid.TryParse(ownerIdString, out Guid ownerId))
            throw new UnauthorizedAccessException("Invalid or missing Owner ID in token.");

        return ownerId;
    }

    // =============================
    // CHECK NHÀ CÓ THUỘC OWNER KHÔNG
    // =============================
    private async Task<IActionResult?> CheckHouseOwnership(int houseId, Guid ownerId)
    {
        bool isOwned = await _houseService.IsOwnedByAsync(houseId, ownerId);

        if (!isOwned)
        {
            return StatusCode(403, new
            {
                success = false,
                message = "Access denied. House is not owned by the current user."
            });
        }

        return null;
    }

    // =============================
    // GET DANH SÁCH PHÒNG TRỐNG CHO FE CONTRACTS
    // =============================

    [HttpGet]
    [Route("~/api/Rooms/owner/{ownerId:guid}/available")]
    [AllowAnonymous] // Tạm mở để test, sau có thể đổi thành [Authorize(Roles="Owner")]
    public async Task<IActionResult> GetAvailableRooms(Guid ownerId)
    {
        var rooms = await _context.Rooms
            .Include(r => r.House)
            .Where(r =>
                r.House.OwnerId == ownerId &&
                r.Status == RoomStatus.Vacant     // phòng trống
            )
            .Select(r => new
            {
                id = r.Id,
                name = r.Name,
                houseName = r.House.Name
            })
            .ToListAsync();

        return Ok(rooms);
    }

    // =============================
    // CREATE ROOM
    // =============================
    [HttpPost]
    public async Task<IActionResult> Create(int houseId, CreateRoomDto dto)
    {
        Guid ownerId;
        try { ownerId = GetOwnerIdGuid(); }
        catch { return Unauthorized(); }

        var ownership = await CheckHouseOwnership(houseId, ownerId);
        if (ownership != null) return ownership;

        var room = await _roomService.CreateAsync(houseId, dto);

        return Ok(new
        {
            success = true,
            message = "Room created successfully",
            data = room
        });
    }

    // =============================
    // GET ALL ROOMS IN A HOUSE
    // =============================
    [HttpGet]
    public async Task<IActionResult> GetAll(int houseId)
    {
        Guid ownerId;
        try { ownerId = GetOwnerIdGuid(); }
        catch { return Unauthorized(); }

        var ownership = await CheckHouseOwnership(houseId, ownerId);
        if (ownership != null) return ownership;

        var rooms = await _roomService.GetAllAsync(houseId);

        return Ok(new
        {
            success = true,
            message = "Rooms retrieved successfully",
            data = rooms
        });
    }

    // =============================
    // GET 1 ROOM
    // =============================
    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int houseId, int id)
    {
        Guid ownerId;
        try { ownerId = GetOwnerIdGuid(); }
        catch { return Unauthorized(); }

        var ownership = await CheckHouseOwnership(houseId, ownerId);
        if (ownership != null) return ownership;

        var room = await _roomService.GetByIdAsync(houseId, id);
        if (room == null)
            return NotFound(new { success = false, message = "Room not found" });

        return Ok(new { success = true, message = "Room retrieved", data = room });
    }

    // =============================
    // UPDATE ROOM
    // =============================
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int houseId, int id, UpdateRoomDto dto)
    {
        Guid ownerId;
        try { ownerId = GetOwnerIdGuid(); }
        catch { return Unauthorized(); }

        var ownership = await CheckHouseOwnership(houseId, ownerId);
        if (ownership != null) return ownership;

        var room = await _roomService.GetByIdAsync(houseId, id);
        if (room == null)
            return NotFound(new { success = false, message = "Room not found" });

        await _roomService.UpdateAsync(houseId, id, dto);

        return Ok(new { success = true, message = "Room updated successfully" });
    }

    // =============================
    // DELETE ROOM
    // =============================
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int houseId, int id)
    {
        Guid ownerId;
        try { ownerId = GetOwnerIdGuid(); }
        catch { return Unauthorized(); }

        var ownership = await CheckHouseOwnership(houseId, ownerId);
        if (ownership != null) return ownership;

        var room = await _roomService.GetByIdAsync(houseId, id);
        if (room == null)
            return NotFound(new { success = false, message = "Room not found" });

        await _roomService.DeleteAsync(houseId, id);

        return Ok(new { success = true, message = "Room deleted successfully" });
    }
}
