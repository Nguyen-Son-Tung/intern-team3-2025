using System.Net;
using System.Threading.Tasks;
using System.Net.Http;
using System.Text.Json; 
<<<<<<< HEAD
=======
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;
>>>>>>> origin/main

namespace PropertyService.Services.Clients
{
    public class UserServiceClient : IUserServiceClient
    {
        private readonly HttpClient _httpClient;
<<<<<<< HEAD

        public UserServiceClient(HttpClient httpClient)
        {
            _httpClient = httpClient;
=======
        private readonly IConfiguration _configuration;

        public UserServiceClient(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
>>>>>>> origin/main
        }

        public async Task<bool> CheckTenantExists(string tenantId) 
        {
<<<<<<< HEAD
            var response = await _httpClient.GetAsync($"/api/users/{tenantId}/exists");
=======
            var request = new HttpRequestMessage(HttpMethod.Get, $"/api/users/{tenantId}/exists");
            request.Headers.Add("X-Service-Api-Key", _configuration["ServiceApiKey"]);

            var response = await _httpClient.SendAsync(request);
>>>>>>> origin/main

            if (response.IsSuccessStatusCode)
            {
                return true;
            }
            
            if (response.StatusCode == HttpStatusCode.NotFound)
            {
                return false;
            }
            
            // Xử lý lỗi khác
            return false; 
        }

<<<<<<< HEAD
        public async Task<object?> GetUserByIdAsync(string userId) 
        {
            // Endpoint: GET /api/users/{userId} 
            var response = await _httpClient.GetAsync($"/api/users/{userId}");
=======
        public async Task<Dictionary<string, object>?> GetUserByIdAsync(string userId) 
        {
            // Endpoint: GET /api/users/{userId} 
            var request = new HttpRequestMessage(HttpMethod.Get, $"/api/users/{userId}");
            request.Headers.Add("X-Service-Api-Key", _configuration["ServiceApiKey"]);

            var response = await _httpClient.SendAsync(request);
>>>>>>> origin/main

            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                
                try
                {
<<<<<<< HEAD
                    return JsonSerializer.Deserialize<object>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
=======
                    return JsonSerializer.Deserialize<Dictionary<string, object>>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
>>>>>>> origin/main
                }
                catch (JsonException)
                {
                    return null;
                }
            }
            return null;
        }
    }
}