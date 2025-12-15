// File: ReadingService/Features/Property/PropertyService.cs

using System.Text.Json;
using ReadingService.Features.Property.DTOs;
using System.Net.Http.Json; 
using System.Net;

namespace ReadingService.Features.Property;

public class PropertyService : IPropertyService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<PropertyService> _logger;
    // Cần IConfiguration để đọc BaseUrl và API Key
    private readonly IConfiguration _configuration; 

    public PropertyService(HttpClient httpClient, ILogger<PropertyService> logger, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _logger = logger;
        _configuration = configuration;
        
        // --- CẤU HÌNH HTTP CLIENT ---
        var baseUrl = configuration["PropertyService:BaseUrl"] 
            ?? throw new InvalidOperationException("PropertyService:BaseUrl not configured");
        _httpClient.BaseAddress = new Uri(baseUrl);
        
        // Cấu hình API Key cho S2S (Service-to-Service)
        var apiKey = configuration["ServiceApiKey"];
        if (!string.IsNullOrEmpty(apiKey))
        {
            _httpClient.DefaultRequestHeaders.Add("X-Service-Api-Key", apiKey);
        }
    }

<<<<<<< HEAD
    public async Task<List<PropertyDetailsDto>> GetDetailsByContractIdsAsync(List<int> contractIds) // ⭐ ĐÃ SỬA
    {
        var apiUrl = "api/property/details-by-contracts"; // ⭐ Endpoint đã làm việc

        if (contractIds == null || !contractIds.Any()) // ⭐ ĐÃ SỬA
=======
    public async Task<List<PropertyDetailsDto>> GetDetailsByContractIdsAsync(List<int> contractIds) //  ĐÃ SỬA
    {
        var apiUrl = "api/property/details-by-contracts"; //  Endpoint đã làm việc

        if (contractIds == null || !contractIds.Any()) //  ĐÃ SỬA
>>>>>>> origin/main
        {
            _logger.LogWarning("PropertyService Client: Input list is null or empty. Skipping API call.");
            return new List<PropertyDetailsDto>();
        }

        try
        {
            // 1. Dùng List<int> làm Body
<<<<<<< HEAD
            var response = await _httpClient.PostAsJsonAsync(apiUrl, contractIds); // ⭐ Dùng contractIds
=======
            var response = await _httpClient.PostAsJsonAsync(apiUrl, contractIds); //  Dùng contractIds
>>>>>>> origin/main

            if (!response.IsSuccessStatusCode)
            {
                // ... (Logic xử lý lỗi giữ nguyên)
                var errorContent = await response.Content.ReadAsStringAsync();
<<<<<<< HEAD
                _logger.LogError("🔥 Property Service failed with status {Status}. Content: {Error}", 
=======
                _logger.LogError(" Property Service failed with status {Status}. Content: {Error}", 
>>>>>>> origin/main
                    response.StatusCode, errorContent);
                return new List<PropertyDetailsDto>();
            }

            // ... (Logic deserialize giữ nguyên)
            var content = await response.Content.ReadAsStringAsync();
            var details = JsonSerializer.Deserialize<List<PropertyDetailsDto>>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
            
            return details ?? new List<PropertyDetailsDto>();
        }
        catch (Exception ex)
        {
<<<<<<< HEAD
            _logger.LogError(ex, "🔥 Error calling PropertyService batch endpoint.");
=======
            _logger.LogError(ex, " Error calling PropertyService batch endpoint.");
>>>>>>> origin/main
            return new List<PropertyDetailsDto>();
        }
    }
    public async Task<int?> GetActiveContractIdByUserIdAsync(string userId)
    {
        // Sử dụng endpoint đã tạo trong Property Service
        var apiUrl = $"api/property/active-id/{userId}"; 
        
        if (string.IsNullOrEmpty(userId))
        {
            _logger.LogWarning("GetActiveContractIdByUserIdAsync: User ID is null or empty.");
            return null;
        }
        
        try
        {
<<<<<<< HEAD
            _logger.LogInformation("➡️ PropertyService Client: Requesting Active Contract ID for User: {UserId}", userId);
=======
            _logger.LogInformation(" PropertyService Client: Requesting Active Contract ID for User: {UserId}", userId);
>>>>>>> origin/main
            
            var response = await _httpClient.GetAsync(apiUrl);

            if (response.StatusCode == HttpStatusCode.NoContent) // HTTP 204 No Content
            {
<<<<<<< HEAD
                _logger.LogInformation("✅ No active contract found for User: {UserId}", userId);
=======
                _logger.LogInformation(" No active contract found for User: {UserId}", userId);
>>>>>>> origin/main
                return null;
            }

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
<<<<<<< HEAD
                _logger.LogError("🔥 Property Service failed to get active ID. Status {Status}. Content: {Error}", 
=======
                _logger.LogError(" Property Service failed to get active ID. Status {Status}. Content: {Error}", 
>>>>>>> origin/main
                    response.StatusCode, errorContent);
                return null;
            }

            var content = await response.Content.ReadAsStringAsync();
            
            // Endpoint trả về ID đơn thuần (int)
            // Cần trim và loại bỏ dấu ngoặc kép (nếu có)
            if (int.TryParse(content.Trim().Replace("\"", ""), out int contractId))
            {
<<<<<<< HEAD
                _logger.LogInformation("✅ Active Contract ID found: {ContractId}", contractId);
                return contractId;
            }
            
            _logger.LogError("🛑 Failed to parse contract ID from content: {Content}", content);
=======
                _logger.LogInformation(" Active Contract ID found: {ContractId}", contractId);
                return contractId;
            }
            
            _logger.LogError("Failed to parse contract ID from content: {Content}", content);
>>>>>>> origin/main
            return null;
        }
        catch (Exception ex)
        {
<<<<<<< HEAD
            _logger.LogError(ex, "🔥 Error calling PropertyService for active contract ID.");
=======
            _logger.LogError(ex, "Error calling PropertyService for active contract ID.");
>>>>>>> origin/main
            return null;
        }
    }
}