using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PropertyService;
using PropertyService.DTOs;
using PropertyService.Services.Interfaces;
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

    public async Task<List<PropertyDetailsDto>> GetDetailsByContractIdsAsync(List<int> contractIds)
    {
        if (contractIds == null || !contractIds.Any())
        {
            _logger.LogWarning("Input Contract ID list is null or empty. Returning empty result.");
            return new List<PropertyDetailsDto>();
        }

        var uniqueContractIds = contractIds.Distinct().ToList();

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
                HouseName = c.Room!.House!.Name ?? string.Empty,
                RoomName = c.Room!.Name ?? string.Empty,
            })
            .ToListAsync();

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
