using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PropertyService;
using PropertyService.Models;
using PropertyService.Models.Enums;

namespace PropertyService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContractsController : ControllerBase
{
private readonly ApplicationDbContext _db;

public ContractsController(ApplicationDbContext db)
{
    _db = db;
}


    // ============================================================
    // 1) GET LIST CONTRACTS → trả về đúng format frontend đang dùng
    // ============================================================
    [HttpGet("list-contracts")]
    public async Task<IActionResult> GetContracts()
    {
        var data = await _db.Contracts
            .Include(c => c.Room)
            .ThenInclude(r => r.House)
            .ToListAsync();

        var result = data.Select(c => new
        {
            id = c.Id,
            code = c.Code,
            propertyName = c.Room.Name,
            houseName = c.Room.House.Name,
            tenantId = c.TenantId.ToString(),
            tenantName = c.TenantName,
            startDate = c.StartDate,
            endDate = c.EndDate,
            rentPrice = c.RentPrice,
            status = c.Status.ToString().ToLower()
        });

        return Ok(new { success = true, data = result });
    }

    // ============================================================
    // 2) GET CONTRACT BY ID
    // ============================================================
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var c = await _db.Contracts
            .Include(x => x.Room)
            .ThenInclude(r => r.House)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (c == null) return NotFound();

        return Ok(new
        {
            id = c.Id,
            code = c.Code,
            propertyName = c.Room.Name,
            houseName = c.Room.House.Name,
            tenantId = c.TenantId.ToString(),
            tenantName = c.TenantName,
            startDate = c.StartDate,
            endDate = c.EndDate,
            rentPrice = c.RentPrice,
            status = c.Status.ToString().ToLower()
        });
    }

    // ============================================================
    // 3) CREATE NEW CONTRACT
    //    REQUIREMENTS:
    //      ✔ Tenant chưa có hợp đồng
    //      ✔ Room phải đang Vacant
    //      ✔ Sinh code hợp đồng tự động
    // ============================================================
    public class CreateContractDto
    {
        public string TenantId { get; set; } = null!;
        public int RoomId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public decimal RentPrice { get; set; }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateContractDto dto)
    {
        // 1. Kiểm tra phòng có tồn tại không
        var room = await _db.Rooms.Include(r => r.House).FirstOrDefaultAsync(r => r.Id == dto.RoomId);
        if (room == null)
            return BadRequest("Phòng không tồn tại.");

        if (room.Status != RoomStatus.Vacant)
            return BadRequest("Phòng này không trống.");

        // 2. Check tenant chưa có HĐ
        bool tenantHasContract = await _db.Contracts.AnyAsync(c => c.TenantId == dto.TenantId);
        if (tenantHasContract)
            return BadRequest("Khách thuê này đã có hợp đồng.");

        // 3. Sinh mã hợp đồng
        string code = $"HD-{DateTime.UtcNow:yyyyMMddHHmmss}";

        var newContract = new Contract
        {
            Code = code,
            RoomId = dto.RoomId,
            TenantId = dto.TenantId,
            TenantName = "", // Bạn có thể lưu tên từ AA API nếu muốn
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            RentPrice = dto.RentPrice,
            Status = ContractStatus.Active
        };

        _db.Contracts.Add(newContract);

        // Update room to Occupied
        room.Status = RoomStatus.Occupied;

        await _db.SaveChangesAsync();

        return Ok(new { success = true, message = "Tạo hợp đồng thành công." });
    }

    // ============================================================
    // 4) UPDATE CONTRACT
    // ============================================================
    public class UpdateContractDto
    {
        public int RoomId { get; set; }
        public string TenantId { get; set; } = null!;
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public decimal RentPrice { get; set; }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateContractDto dto)
    {
        var c = await _db.Contracts.FirstOrDefaultAsync(x => x.Id == id);
        if (c == null) return NotFound();

        c.StartDate = dto.StartDate;
        c.EndDate = dto.EndDate;
        c.RentPrice = dto.RentPrice;

        await _db.SaveChangesAsync();
        return Ok(new { success = true, message = "Cập nhật hợp đồng thành công." });
    }

    // ============================================================
    // 5) DELETE CONTRACT
    //    Khi xoá → tự động giải phóng phòng (Vacant)
    // ============================================================
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var c = await _db.Contracts.FirstOrDefaultAsync(x => x.Id == id);
        if (c == null) return NotFound();

        var room = await _db.Rooms.FirstOrDefaultAsync(r => r.Id == c.RoomId);
        if (room != null)
            room.Status = RoomStatus.Vacant;

        _db.Contracts.Remove(c);
        await _db.SaveChangesAsync();

        return Ok(new { success = true, message = "Xóa hợp đồng thành công." });
    }
}
