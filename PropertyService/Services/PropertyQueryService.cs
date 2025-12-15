<<<<<<< HEAD
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PropertyService;
using PropertyService.DTOs;
using PropertyService.Services.Interfaces;
=======
using Microsoft.EntityFrameworkCore; 
using PropertyService.Data; 
using PropertyService.DTOs;
using PropertyService.Services.Interfaces;
using Microsoft.Extensions.Logging;
using PropertyService.Models.Enums;
>>>>>>> origin/main
using System.Linq;

namespace PropertyService.Services;

public class PropertyQueryService : IPropertyQueryService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<PropertyQueryService> _logger;

    public PropertyQueryService(ApplicationDbContext context, ILogger<PropertyQueryService> logger)
    {
        _context = context;
        _logger = logger;
    }
<<<<<<< HEAD

    public async Task<List<PropertyDetailsDto>> GetDetailsByContractIdsAsync(List<int> contractIds)
=======
    
    //  ĐÃ SỬA: Đảm bảo Include() để tránh NullReferenceException
    public async Task<List<PropertyDetailsDto>> GetDetailsByContractIdsAsync(
        List<int> contractIds)
>>>>>>> origin/main
    {
        if (contractIds == null || !contractIds.Any())
        {
            _logger.LogWarning("Input Contract ID list is null or empty. Returning empty result.");
            return new List<PropertyDetailsDto>();
        }

        var uniqueContractIds = contractIds.Distinct().ToList();
<<<<<<< HEAD

        _logger.LogInformation(
            "➡️ Query Service: Received request for {Count} unique Contract IDs.",
            uniqueContractIds.Count
        );

        var results = await _context.Contracts  
            .Include(c => c.Room)
                .ThenInclude(r => r.House)
            .Where(c => uniqueContractIds.Contains(c.Id))
            .Select(c => new PropertyDetailsDto
            {
                ContractId = c.Id,
                Floor = c.Room!.Floor,
=======
        
        _logger.LogInformation(" Query Service: Received request for {Count} unique Contract IDs.", uniqueContractIds.Count);
        
        var results = await _context.TenantContracts
            
            //  KHẮC PHỤC LỖI NRE: Bắt buộc Include các mối quan hệ trước khi Select
            .Include(c => c.Room)
                .ThenInclude(r => r.House)
                
            .Where(c => uniqueContractIds.Contains(c.Id)) // Lọc theo danh sách Contract ID
            
            //  SỬ DỤNG PROJECTION VÀ NULL CONDITIONAL OPERATOR (?.) ĐỂ ÁNH XẠ AN TOÀN
            // c.Room/c.Room.House có thể là NULL nếu DB không nhất quán.
            .Select(c => new PropertyDetailsDto
            {
                ContractId = c.Id, 
                Floor = c.Room!.Floor, 
>>>>>>> origin/main
                HouseName = c.Room!.House!.Name ?? string.Empty,
                RoomName = c.Room!.Name ?? string.Empty,
            })
            .ToListAsync();

<<<<<<< HEAD
        // Log kết quả
        if (results.Count != uniqueContractIds.Count)
        {
            _logger.LogWarning(
                "⚠️ Found {FoundCount} details out of {RequestedCount} requested contracts. Missing details for some IDs (liên kết Room/House bị thiếu).",
                results.Count,
                uniqueContractIds.Count
            );
        }
        else
        {
            _logger.LogInformation(
                "✅ DB Query Success: Retrieved details for all {Count} contracts.",
                results.Count
            );
        }

        return results;
    }
}
=======
        //  LOG ĐIỂM QUAN TRỌNG: Kiểm tra kết quả truy vấn DB 
        if (results.Count != uniqueContractIds.Count)
        {
            _logger.LogWarning("Found {FoundCount} details out of {RequestedCount} requested contracts. Missing details for some IDs (Do liên kết Room/House bị thiếu).", 
                results.Count, uniqueContractIds.Count);
        }
        else
        {
            _logger.LogInformation(" DB Query Success: Retrieved details for all {Count} contracts.", results.Count);
        }
        
        return results;
    }
    
    // Xóa hoặc không sử dụng hàm GetDetailsByCycleUserIdsAsync
}
>>>>>>> origin/main
