<<<<<<< HEAD
=======
using System.Collections.Generic;
using System.Threading.Tasks;

>>>>>>> origin/main
namespace PropertyService.Services.Clients
{
    public interface IUserServiceClient
    {
        Task<bool> CheckTenantExists(string tenantId);
<<<<<<< HEAD
        Task<object?> GetUserByIdAsync(string userId);
=======
        Task<Dictionary<string, object>?> GetUserByIdAsync(string userId);
>>>>>>> origin/main
    }
}