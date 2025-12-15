<<<<<<< HEAD
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
=======
using System;
using System.Collections.Generic;
using System.Net;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using PropertyService.DTOs.Contracts;
using PropertyService.Services.Interfaces;

namespace PropertyService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ContractsController : ControllerBase
    {
        private readonly IContractService _contractService;
        private readonly ILogger<ContractsController> _logger;
        public ContractsController(IContractService contractService, ILogger<ContractsController> logger)
        {
            _contractService = contractService;
            _logger = logger;
        }

        // ==================== Helper Methods ====================
        
        private Guid GetUserIdGuid() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new UnauthorizedAccessException("User ID not found in token."));
        private bool IsUserInRole(string role) => User.IsInRole(role);

        // ==================== GET Endpoints ====================

        /// <summary>
        /// Get all contracts owned by the current owner
        /// </summary>
        [HttpGet("list-contracts")]
        [Authorize(Roles = "Owner")]
        public async Task<IActionResult> GetContracts()
        {
            Guid ownerId = GetUserIdGuid();
            //  OwnerId được lấy, sau đó truyền vào Service để lọc
            var contracts = await _contractService.GetAllByOwnerIdAsync(ownerId); 
            return Ok(new { success = true, data = contracts });
        }

        /// <summary>
        /// Get contracts expiring within specified days (default 30 days)
        /// </summary>
        [HttpGet("expiring")]
        [ProducesResponseType(typeof(IEnumerable<ContractDto>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.Unauthorized)]
        [Authorize(Roles = "Owner")]
        public async Task<IActionResult> GetExpiringContracts([FromQuery] int days = 30)
        {
            try
            {
                Guid ownerId = GetUserIdGuid();
                var contracts = await _contractService.GetExpiringContractsAsync(ownerId, days);
                return Ok(new { success = true, data = contracts, expiringWithinDays = days });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching expiring contracts for owner {OwnerId}", GetUserIdGuid());
                return StatusCode(500, new { success = false, message = "Internal server error." });
            }
        }

        [HttpGet("my-contracts")] 
        [ProducesResponseType(typeof(IEnumerable<ContractDto>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.Unauthorized)]
        public async Task<IActionResult> GetMyContracts()
        {
            try
            {
                //  DEBUG 1: KIỂM TRA USER ID 
                // Đặt Breakpoint ở đây và kiểm tra giá trị của tenantId. 
                // Nó phải là một GUID hợp lệ.
                Guid tenantId = GetUserIdGuid(); 
                _logger.LogInformation("Attempting to fetch contracts for Tenant ID: {TenantId}", tenantId);
                
                if (tenantId == Guid.Empty)
                {
                    _logger.LogWarning("Unauthorized access: Tenant ID is empty.");
                    return Unauthorized();
                }

                //  DEBUG 2: KIỂM TRA SERVICE INJECTION 
                // Đặt Breakpoint ở đây và kiểm tra xem _contractService có bị NULL không.
                if (_contractService == null)
                {
                    _logger.LogError("FATAL ERROR: _contractService is NULL (Dependency Injection Failure).");
                    return StatusCode(500, new { success = false, message = "Internal service dependency error." });
                }

                // 2. Gọi Service để lấy hợp đồng dựa trên Tenant ID
                var contracts = await _contractService.GetContractsByTenantIdAsync(tenantId);

                return Ok(new { success = true, data = contracts });
            }
            catch (Exception ex)
            {
                // Log lỗi chi tiết nếu có
                _logger.LogError(ex, "Error fetching contracts for tenant {TenantId}. Full stack trace logged.", GetUserIdGuid());
                // Lỗi 500 nếu Service Layer bị crash (ví dụ: Null Repo/Context)
                return StatusCode(500, new { success = false, message = "Internal server error." });
            }
        }
        
        /// <summary>
        /// Get a specific contract by ID (Owner or Tenant)
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ContractDto), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.Forbidden)]
        [Authorize(Roles = "Owner, Tenant")]
        public async Task<IActionResult> GetContract(int id)
        {
            try
            {
                Guid currentUserId = GetUserIdGuid();
                var contract = await _contractService.GetContractByIdAsync(id);
                
                if (contract == null)
                {
                    return NotFound(new { success = false, message = "Contract not found." });
                }
                
                // --- PHÂN QUYỀN TRUY CẬP ---
                if (IsUserInRole("Owner"))
                {
                    // OWNER CHECK: Kiểm tra quyền sở hữu House/Room
                    bool isOwner = await _contractService.IsContractOwnedByAsync(id, currentUserId); 
                    
                    if (!isOwner) 
                        return StatusCode(403, new { success = false, message = "Access denied: Contract not owned by you." });
                }
                else if (IsUserInRole("Tenant"))
                {
                    
                if (contract.TenantId != currentUserId.ToString()) 
                    {
                        return StatusCode(403, new { success = false, message = "Access denied: This is not your contract." });
                    }
                }
                else
                {
                    // Vai trò không được phép (Ví dụ: Admin hoặc vai trò không xác định)
                    return StatusCode(403, new { success = false, message = "Access denied for this role." });
                }
                
                // Nếu vượt qua kiểm tra quyền, trả về dữ liệu
                return Ok(new { success = true, data = contract }); 
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ==================== POST Endpoints ====================

        /// <summary>
        /// Create a new contract (Owner only)
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(ContractDto), (int)HttpStatusCode.Created)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [ProducesResponseType((int)HttpStatusCode.Forbidden)]
        [Authorize(Roles = "Owner")]
        public async Task<IActionResult> CreateContract([FromBody] CreateContractDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                Guid ownerId = GetUserIdGuid();
                
                // CHECK 1: Quyền sở hữu RoomId (Bắt buộc)
                bool isOwned = await _contractService.IsRoomOwnedByAsync(request.RoomId, ownerId);
                if (!isOwned)
                {
                    return StatusCode(403, new { success = false, message = "Access denied: Room is not owned by you." });
                }

                //  Dùng CreateAsync
                var contractDto = await _contractService.CreateAsync(request, ownerId); 
                
                return CreatedAtAction(nameof(GetContract), new { id = contractDto.Id }, new { success = true, data = contractDto });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Business Rule Violation during contract creation for RoomId {RoomId}. Error: {ErrorMessage}", 
                            request.RoomId, ex.Message); 
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
            catch (Exception ex)
            {
               _logger.LogError(ex, "An unexpected error occurred while creating contract.");
                return StatusCode(500, new { success = false, message = "Internal Server Error." });
        }
        }

        // ==================== PUT Endpoints ====================

        /// <summary>
        /// Update an existing contract (Owner only)
        /// </summary>
        [HttpPut("{id}")]
        [ProducesResponseType(typeof(ContractDto), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.Forbidden)]
        [Authorize(Roles = "Owner")]
        public async Task<IActionResult> UpdateContract(int id, [FromBody] UpdateContractDto request)
        {
            try
            {
                Guid ownerId = GetUserIdGuid();

                // CHECK 1: Quyền sở hữu Contract
                bool isOwned = await _contractService.IsContractOwnedByAsync(id, ownerId);
                if (!isOwned)
                {
                    return StatusCode(403, new { success = false, message = "Access denied: You do not own this contract." }); 
                }
                
                // CHECK 2: Nếu có thay đổi RoomId, kiểm tra RoomId mới cũng thuộc về Owner
                if (request.RoomId.HasValue && request.RoomId.Value != 0) 
                {
                    bool isNewRoomOwned = await _contractService.IsRoomOwnedByAsync(request.RoomId.Value, ownerId);
                    if (!isNewRoomOwned) 
                    {
                        return StatusCode(403, new { success = false, message = "Access denied: New Room ID is not owned by you." });
                    }
                }
                
                //  Dùng UpdateAsync
                var updatedContract = await _contractService.UpdateAsync(id, request, ownerId);
                
                if (updatedContract == null)
                {
                    // Lỗi NotFound có thể xảy ra nếu Contract bị xóa giữa chừng
                    return NotFound(new { success = false, message = "Contract not found." });
                }

                return Ok(new { success = true, data = updatedContract });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
            catch (Exception ex)
            {
                 return BadRequest(new { success = false, message = ex.Message }); 
            }
        }

        // ==================== DELETE Endpoints ====================

        /// <summary>
        /// Delete a contract (Owner only)
        /// </summary>
        [HttpDelete("{id}")]
        [ProducesResponseType((int)HttpStatusCode.NoContent)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.Forbidden)]
        [Authorize(Roles = "Owner")]
        public async Task<IActionResult> DeleteContract(int id)
        {
            try
            {
                Guid ownerId = GetUserIdGuid();
                
                // CHECK: Quyền sở hữu Contract
                bool isOwned = await _contractService.IsContractOwnedByAsync(id, ownerId);
                if (!isOwned)
                {
                    return StatusCode(403, new { success = false, message = "Access denied: You do not own this contract." }); 
                }

                //  Dùng DeleteAsync
                var result = await _contractService.DeleteAsync(id, ownerId);
                
                if (!result)
                {
                    return NotFound(new { success = false, message = "Contract not found." });
                }

                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        
    }
}
>>>>>>> origin/main
