using System.Security.Claims;
<<<<<<< HEAD
using InvoiceService.Features.Invoice;
using InvoiceService.Features.Invoice.DTOs;
using InvoiceService.Models;
=======
using InvoiceService.Features.Invoice.DTOs;
using InvoiceService.Models;
using InvoiceService.Features.Invoice;
>>>>>>> origin/main
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using InvoiceService.Features.Invoice.DTOs.Invoice;

namespace InvoiceService.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InvoicesController : ControllerBase
{
    private readonly IInvoiceService _invoiceService;
    private readonly IInvoiceReminderService _reminderService;
    
    private readonly ILogger<InvoicesController> _logger;
    private readonly Services.IUserServiceClient _userServiceClient;
    private readonly Services.PaymentWebSocketHandler _wsHandler;

    // private readonly IInvoiceRepository _invoiceRepository;
    // private readonly IRabbitMQPublisher _publisher;
    public InvoicesController(
        IInvoiceService invoiceService, 
        ILogger<InvoicesController> logger,
        Services.IUserServiceClient userServiceClient,
<<<<<<< HEAD
        Services.PaymentWebSocketHandler wsHandler
        //IInvoiceRepository repository,
        //IRabbitMQPublisher publisher)
=======
        Services.PaymentWebSocketHandler wsHandler,
        IInvoiceReminderService reminderService
>>>>>>> origin/main
    )
    {
        _invoiceService = invoiceService;
        _logger = logger;
        _userServiceClient = userServiceClient;
        _wsHandler = wsHandler;
<<<<<<< HEAD
        // _invoiceRepository = repository;
        // _publisher = publisher;
    }

// ⭐ HÀM BỔ SUNG USER NAME (Giữ lại logic này trong Controller)
=======
        _reminderService = reminderService;
    }

//  HÀM BỔ SUNG USER NAME (Giữ lại logic này trong Controller)
>>>>>>> origin/main
    private async Task<List<InvoiceResponse>> EnrichResponseWithUserNameAsync(IEnumerable<InvoiceResponse> invoices)
    {
        var response = invoices.ToList();
        
        // Thu thập các User ID duy nhất
        var userIds = response.Where(r => !string.IsNullOrEmpty(r.UserId)).Select(r => r.UserId).Distinct().ToList();
        
        // Gọi User Service (batch hoặc từng cái)
        // GIẢ ĐỊNH: GetUserInfoAsync có thể được tối ưu hóa thành GetUserInfosAsync nếu cần.
        foreach (var invoiceResponse in response)
        {
            if (!string.IsNullOrEmpty(invoiceResponse.UserId))
            {
                var userInfo = await _userServiceClient.GetUserInfoAsync(invoiceResponse.UserId);
                if (userInfo != null)
                {
                    invoiceResponse.UserName = userInfo.FullName;
                }
            }
        }
        
        return response;
    }
    
    private async Task EnrichSingleResponseWithUserNameAsync(InvoiceResponse invoiceResponse)
    {
        if (!string.IsNullOrEmpty(invoiceResponse.UserId))
        {
            var userInfo = await _userServiceClient.GetUserInfoAsync(invoiceResponse.UserId);
            if (userInfo != null)
            {
                invoiceResponse.UserName = userInfo.FullName;
            }
        }
    }
    // ==================== GET Endpoints ====================

    [HttpGet]
<<<<<<< HEAD
    public async Task<ActionResult<IEnumerable<InvoiceResponse>>> GetAllInvoices()
=======
    public async Task<ActionResult<IEnumerable<InvoiceResponse>>> GetAllInvoices(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] int? year = null,
        [FromQuery] int? month = null)
>>>>>>> origin/main
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) 
                     ?? User.FindFirstValue("sub") 
                     ?? User.FindFirstValue("userId");
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { error = "UserId not found in access token" });
        }

        // Get user info để kiểm tra vai trò (Owner/Tenant)
        var userInfo = await _userServiceClient.GetUserInfoAsync(userId);
        
        IEnumerable<InvoiceResponse> invoices; // Kiểu trả về đã là DTO
        
        if (userInfo?.OwnerId == null)
        {
            // User là Owner: Lấy hóa đơn của tất cả Tenant
            var tenantUserIds = await _userServiceClient.GetUserIdsByOwnerAsync(userId);
            
<<<<<<< HEAD
            // ⭐ GỌI HÀM SERVICE MỚI (Trả về DTO đã làm giàu)
            invoices = await _invoiceService.GetAllInvoicesByOwnerAsync(userId, tenantUserIds);
        }
        else
        {
            // User là Tenant: Lấy hóa đơn của chính họ
            // ⭐ GỌI HÀM SERVICE MỚI (Trả về DTO đã làm giàu)
            invoices = await _invoiceService.GetAllInvoicesByUserAsync(userId);
        }

        // Controller không còn cần logic làm giàu dữ liệu Property nữa
        // Chỉ cần bổ sung UserName (nếu Service không làm)
        var response = await EnrichResponseWithUserNameAsync(invoices); 
        
=======
            //  GỌI HÀM SERVICE MỚI với pagination
            invoices = await _invoiceService.GetAllInvoicesByOwnerAsync(userId, tenantUserIds, page, pageSize, status, year, month);
        }
        else
        {
            // User là Tenant: Chỉ lấy hóa đơn của chính mình
            //  GỌI HÀM SERVICE MỚI với pagination
            invoices = await _invoiceService.GetInvoicesByTenantAsync(userId, page, pageSize, status, year, month);
        }

        var response = await EnrichResponseWithUserNameAsync(invoices);
>>>>>>> origin/main
        return Ok(response);
    }

    /// <summary>
    /// Get a specific invoice by ID
    /// Supports both JWT auth (user access) and API key auth (service-to-service)
    /// </summary>
    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<InvoiceResponse>> GetInvoiceById(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) 
                     ?? User.FindFirstValue("sub") 
                     ?? User.FindFirstValue("userId");
        
        InvoiceResponse? invoiceResponse; // Kiểu trả về đã là DTO
        
        if (string.IsNullOrEmpty(userId))
        {
            // Service-to-service call (dùng API Key)
            var apiKey = Request.Headers["X-Service-Api-Key"].FirstOrDefault();
            var configuredApiKey = HttpContext.RequestServices
                .GetRequiredService<IConfiguration>()["ServiceApiKey"];
            
            if (string.IsNullOrEmpty(apiKey) || apiKey != configuredApiKey)
            {
                return Unauthorized(new { error = "Invalid or missing authentication" });
            }
            
<<<<<<< HEAD
            // ⭐ GỌI HÀM SERVICE MỚI (Trả về DTO đã làm giàu)
=======
            //  GỌI HÀM SERVICE MỚI (Trả về DTO đã làm giàu)
>>>>>>> origin/main
            invoiceResponse = await _invoiceService.GetInvoiceByIdAsync(id);
        }
        else
        {
<<<<<<< HEAD
            // JWT auth
            // ⭐ GỌI HÀM SERVICE MỚI (Trả về DTO đã làm giàu)
            invoiceResponse = await _invoiceService.GetInvoiceByIdAsync(id, userId);
=======
            // JWT auth - check if user is owner or tenant
            var userInfo = await _userServiceClient.GetUserInfoAsync(userId);
            
            if (userInfo?.OwnerId == null)
            {
                // User is an owner - get invoice and check if it belongs to one of their tenants
                var tenantUserIds = await _userServiceClient.GetUserIdsByOwnerAsync(userId);
                invoiceResponse = await _invoiceService.GetInvoiceByIdForOwnerAsync(id, userId, tenantUserIds);
            }
            else
            {
                // User is a tenant - only allow access to their own invoices
                invoiceResponse = await _invoiceService.GetInvoiceByIdAsync(id, userId);
            }
>>>>>>> origin/main
        }
        
        if (invoiceResponse == null)
        {
            return NotFound(new { error = $"Invoice with ID {id} not found" });
        }
        
        // Bổ sung UserName nếu cần (Controller vẫn cần UserServiceClient)
        await EnrichSingleResponseWithUserNameAsync(invoiceResponse); 

        return Ok(invoiceResponse);
    }

    /// <summary>
    /// Get invoices by status for the current user
    /// If user is an owner, returns invoices for all their tenants with the specified status
    /// If user is a regular tenant, returns only their own invoices with the specified status
<<<<<<< HEAD
    /// </summary>
    [HttpGet("status/{status}")]
    public async Task<ActionResult<IEnumerable<InvoiceResponse>>> GetInvoicesByStatus(string status)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) 
                     ?? User.FindFirstValue("sub") 
                     ?? User.FindFirstValue("userId");
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { error = "UserId not found in access token" });
        }

        var userInfo = await _userServiceClient.GetUserInfoAsync(userId);
        IEnumerable<InvoiceResponse> invoices;
        
        if (userInfo?.OwnerId == null)
        {
            var tenantUserIds = await _userServiceClient.GetUserIdsByOwnerAsync(userId);
            // ⭐ GỌI HÀM SERVICE MỚI (Trả về DTO đã làm giàu)
            invoices = await _invoiceService.GetInvoicesByStatusForOwnerAsync(userId, tenantUserIds, status);
        }
        else
        {
            // ⭐ GỌI HÀM SERVICE MỚI (Trả về DTO đã làm giàu)
            invoices = await _invoiceService.GetInvoicesByStatusAsync(userId, status);
        }

        var response = await EnrichResponseWithUserNameAsync(invoices);
        return Ok(response);
    }

    // ==================== POST Endpoints ====================

    /// <summary>
    /// Create a new invoice for the current user
=======
>>>>>>> origin/main
    /// </summary>
    [HttpGet("status/{status}")]
    public async Task<ActionResult<IEnumerable<InvoiceResponse>>> GetInvoicesByStatus(string status)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) 
                     ?? User.FindFirstValue("sub") 
                     ?? User.FindFirstValue("userId");
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { error = "UserId not found in access token" });
        }

        var userInfo = await _userServiceClient.GetUserInfoAsync(userId);
        IEnumerable<InvoiceResponse> invoices;
        
        if (userInfo?.OwnerId == null)
        {
            var tenantUserIds = await _userServiceClient.GetUserIdsByOwnerAsync(userId);
            //  GỌI HÀM SERVICE MỚI (Trả về DTO đã làm giàu)
            invoices = await _invoiceService.GetInvoicesByStatusForOwnerAsync(userId, tenantUserIds, status);
        }
        else
        {
            //  GỌI HÀM SERVICE MỚI (Trả về DTO đã làm giàu)
            invoices = await _invoiceService.GetInvoicesByStatusAsync(userId, status);
        }

        var response = await EnrichResponseWithUserNameAsync(invoices);
        return Ok(response);
    }

    // ==================== POST Endpoints ====================

    /// <summary>
    /// Create a new invoice for the current user
    /// </summary>
    [AllowAnonymous]
    [HttpPost]
    public async Task<ActionResult<InvoiceResponse>> CreateInvoice([FromBody] CreateInvoiceRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Lấy userId (logic giữ nguyên)
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) 
                    ?? User.FindFirstValue("sub") 
                    ?? User.FindFirstValue("userId");
        
        if (string.IsNullOrEmpty(userId))
        {
            var apiKey = Request.Headers["X-Service-Api-Key"].FirstOrDefault();
            var configuredApiKey = HttpContext.RequestServices
                .GetRequiredService<IConfiguration>()["ServiceApiKey"];
            
            if (string.IsNullOrEmpty(apiKey) || apiKey != configuredApiKey)
            {
                return Unauthorized(new { error = "Invalid or missing authentication" });
            }
            
            userId = request.UserId;
        }
        
        if (string.IsNullOrEmpty(userId))
        {
            return BadRequest(new { error = "UserId is required" });
        }

        // ----------------------------------------------------------------------
<<<<<<< HEAD
        // ⭐ BƯỚC QUAN TRỌNG: Truy vấn TenantContractId đang Active
=======
        //  BƯỚC QUAN TRỌNG: Truy vấn TenantContractId đang Active
>>>>>>> origin/main
        // ----------------------------------------------------------------------
        var propertyService = HttpContext.RequestServices.GetRequiredService<Features.Property.IPropertyService>();
        int? tenantContractId = await propertyService.GetActiveContractIdByUserIdAsync(userId); 

        if (!tenantContractId.HasValue)
        {
            return BadRequest(new { error = $"Không tìm thấy Hợp đồng đang Active cho người dùng {userId}. Không thể tạo hóa đơn." });
        }
<<<<<<< HEAD
=======

        var tenantContract = await propertyService.GetTenantContractByIdAsync(tenantContractId.Value);
        if (tenantContract == null)
        {
            return BadRequest(new { error = $"Không tìm thấy chi tiết hợp đồng {tenantContractId}." });
        }

        // Tạo description ưu tiên theo tháng/năm, sau đó dùng Contract ID
        var descriptionSource = "";
        if (request.CycleMonth.HasValue && request.CycleYear.HasValue)
        {
            descriptionSource = $"tháng {request.CycleMonth}/{request.CycleYear}";
        }
        else 
        {
            // Dùng TenantContractId (Đã được đảm bảo có)
            descriptionSource = $"Hợp đồng {tenantContractId}"; 
        }
>>>>>>> origin/main
        // ----------------------------------------------------------------------

        var invoice = new Invoice
        {
            UserId = userId,
            InvoiceDate = request.InvoiceDate,
            DueDate = request.DueDate,
<<<<<<< HEAD
            // ⭐ GÁN CONTRACT ID ACTIVE VÀO INVOICE MODEL (Liên kết vĩnh viễn)
=======
            //  GÁN CONTRACT ID ACTIVE VÀO INVOICE MODEL (Liên kết vĩnh viễn)
>>>>>>> origin/main
            TenantContractId = tenantContractId, 
        };

        // If usage data is provided, calculate items from pricing
        if (request.ElectricUsage.HasValue || request.WaterUsage.HasValue)
        {
            var pricingService = HttpContext.RequestServices.GetRequiredService<Features.Pricing.IPricingService>();
            var activePricing = await pricingService.GetActiveAsync();

            if (activePricing == null)
            {
                return BadRequest(new { error = "No active pricing found. Please set up pricing first." });
            }

            var items = new List<InvoiceItem>();

<<<<<<< HEAD
            // Tạo description ưu tiên theo tháng/năm, sau đó dùng Contract ID
            var descriptionSource = "";
            if (request.CycleMonth.HasValue && request.CycleYear.HasValue)
            {
                descriptionSource = $"tháng {request.CycleMonth}/{request.CycleYear}";
            }
            else 
            {
                // Dùng TenantContractId (Đã được đảm bảo có)
                descriptionSource = $"Hợp đồng {tenantContractId}"; 
            }
            
=======
>>>>>>> origin/main
            // Tiền điện
            if (request.ElectricUsage.HasValue && request.ElectricUsage.Value > 0)
            {
                var amount = request.ElectricUsage.Value * activePricing.ElectricPerKwh;
                items.Add(new InvoiceItem
                {
                    Description = $"Tiền điện {descriptionSource}",
                    Quantity = request.ElectricUsage.Value,
                    UnitPrice = activePricing.ElectricPerKwh,
                    Amount = amount,
                    ProductCode = "ELECTRIC"
                });
            }

            // Tiền nước
            if (request.WaterUsage.HasValue && request.WaterUsage.Value > 0)
            {
                var amount = request.WaterUsage.Value * activePricing.WaterPerCubicMeter;
                items.Add(new InvoiceItem
                {
                    Description = $"Tiền nước {descriptionSource}",
                    Quantity = request.WaterUsage.Value,
                    UnitPrice = activePricing.WaterPerCubicMeter,
                    Amount = amount,
                    ProductCode = "WATER"
                });
            }

            // Thêm tiền phòng
<<<<<<< HEAD
            if (activePricing.RoomPrice > 0)
=======
            if (tenantContract.Price > 0)
>>>>>>> origin/main
            {
                items.Add(new InvoiceItem
                {
                    Description = $"Tiền phòng {descriptionSource}",
                    Quantity = 1,
<<<<<<< HEAD
                    UnitPrice = activePricing.RoomPrice,
                    Amount = activePricing.RoomPrice,
=======
                    UnitPrice = tenantContract.Price,
                    Amount = tenantContract.Price,
>>>>>>> origin/main
                    ProductCode = "ROOM"
                });
            }

            if (!items.Any())
            {
                return BadRequest(new { error = "No usage data provided or resulting items are zero" });
            }

            invoice.Items = items;
        }
        else
        {
            // Manual invoice creation
            if (!request.Items.Any())
            {
                return BadRequest(new { error = "Invoice must have at least one item or usage data" });
            }

            invoice.Items = request.Items.Select(item => new InvoiceItem
            {
                Description = item.Description,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                Amount = item.Amount,
                ProductCode = item.ProductCode
            }).ToList();
        }

        // Luôn thêm tiền phòng từ hợp đồng nếu chưa có
        if (tenantContract.Price > 0 && !invoice.Items.Any(i => i.ProductCode == "ROOM"))
        {
            invoice.Items.Add(new InvoiceItem
            {
                Description = $"Tiền phòng {descriptionSource}",
                Quantity = 1,
                UnitPrice = tenantContract.Price,
                Amount = tenantContract.Price,
                ProductCode = "ROOM"
            });
        }

        var createdInvoice = await _invoiceService.CreateInvoiceAsync(invoice);
        
        // Gọi GetInvoiceByIdAsync để đảm bảo Response được làm giàu (Enrich)
        var response = await _invoiceService.GetInvoiceByIdAsync(createdInvoice.Id, createdInvoice.UserId);

        if (response == null) return StatusCode(500, new { error = "Invoice created but failed to retrieve details." });

        // Bổ sung UserName (vì Service Layer chưa làm điều này)
        await EnrichSingleResponseWithUserNameAsync(response);

        return CreatedAtAction(
            nameof(GetInvoiceById), 
            new { id = createdInvoice.Id }, 
            response);
    }

    /// <summary>
    /// Mark invoice as paid
    /// Supports both JWT auth (user access) and API key auth (service-to-service)
    /// </summary>
    [HttpPost("{id}/mark-paid")]
    [AllowAnonymous]
    public async Task<ActionResult<InvoiceResponse>> MarkInvoiceAsPaid(int id)
    {
        // Try to get userId from JWT token first
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) 
                     ?? User.FindFirstValue("sub") 
                     ?? User.FindFirstValue("userId");
        
        // If no JWT token, check for service API key
        if (string.IsNullOrEmpty(userId))
        {
            var apiKey = Request.Headers["X-Service-Api-Key"].FirstOrDefault();
            var configuredApiKey = HttpContext.RequestServices
                .GetRequiredService<IConfiguration>()["ServiceApiKey"];
            
            if (string.IsNullOrEmpty(apiKey) || apiKey != configuredApiKey)
            {
                return Unauthorized(new { error = "Invalid or missing authentication" });
            }
            
            // API Key is valid, allow marking any invoice as paid
            var invoice = await _invoiceService.MarkInvoiceAsPaidAsync(id);
            if (invoice == null)
            {
                return NotFound(new { error = $"Invoice with ID {id} not found" });
            }
            
            // Notify WebSocket clients about payment status update
            await _wsHandler.NotifyPaymentStatusAsync(id, "Paid");
            
            return Ok(MapToResponse(invoice));
        }

        // JWT auth: only mark user's own invoice as paid
        var userInvoice = await _invoiceService.MarkInvoiceAsPaidAsync(id, userId);
        if (userInvoice == null)
        {
            return NotFound(new { error = $"Invoice with ID {id} not found for user {userId}" });
        }

        // Notify WebSocket clients about payment status update
        await _wsHandler.NotifyPaymentStatusAsync(id, "Paid");

        return Ok(MapToResponse(userInvoice));
    }

    // ==================== PUT Endpoints ====================

    /// <summary>
    /// Update an existing invoice for the current user
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<InvoiceResponse>> UpdateInvoice(
        int id,
        [FromBody] UpdateInvoiceRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) 
                     ?? User.FindFirstValue("sub") 
                     ?? User.FindFirstValue("userId");
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { error = "UserId not found in access token" });
        }

        if (!request.Items.Any())
        {
            return BadRequest(new { error = "Invoice must have at least one item" });
        }

        var invoice = new Invoice
        {
            InvoiceDate = request.InvoiceDate,
            DueDate = request.DueDate,
            Status = request.Status,
            Items = request.Items.Select(item => new InvoiceItem
            {
                Description = item.Description,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                Amount = item.Amount,
                ProductCode = item.ProductCode
            }).ToList()
        };

        var updatedInvoice = await _invoiceService.UpdateInvoiceAsync(id, invoice, userId);
        if (updatedInvoice == null)
        {
            return NotFound(new { error = $"Invoice with ID {id} not found for user {userId}" });
        }

        return Ok(MapToResponse(updatedInvoice));
    }

    // ==================== DELETE Endpoints ====================

    /// <summary>
    /// Delete an invoice for the current user
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteInvoice(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) 
                     ?? User.FindFirstValue("sub") 
                     ?? User.FindFirstValue("userId");
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { error = "UserId not found in access token" });
        }

        var result = await _invoiceService.DeleteInvoiceAsync(id, userId);
        if (!result)
        {
            return NotFound(new { error = $"Invoice with ID {id} not found for user {userId}" });
        }

        return NoContent();
    }

    // ==================== Private Helper Methods ====================

    private static InvoiceResponse MapToResponse(Invoice invoice)
    {
        return new InvoiceResponse
        {
            Id = invoice.Id,
            UserId = invoice.UserId,
            UserName = string.Empty, // Sẽ được bổ sung sau
            InvoiceDate = invoice.InvoiceDate,
            DueDate = invoice.DueDate,
            TotalAmount = invoice.TotalAmount,
            Status = invoice.Status,
            PaidDate = invoice.PaidDate,
            CreatedAt = invoice.CreatedAt,
            UpdatedAt = invoice.UpdatedAt,
            Items = invoice.Items.Select(item => new InvoiceService.Features.Invoice.DTOs.InvoiceItemResponse
            {
                Id = item.Id,
                Description = item.Description,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                Amount = item.Amount,
                ProductCode = item.ProductCode
            }).ToList()
            // KHÔNG cần ánh xạ HouseName/RoomName/Floor ở đây, vì hàm này chỉ dành cho
            // các trường hợp trả về Model từ Service (POST/PUT/DELETE/MarkPaid)
        };
    }

<<<<<<< HEAD
    // private async Task<List<InvoiceResponse>> MapToResponseWithUserNameAsync(IEnumerable<Invoice> invoices)
    // {
    //     var response = new List<InvoiceResponse>();
        
    //     foreach (var invoice in invoices)
    //     {
    //         var invoiceResponse = MapToResponse(invoice);
            
    //         // Fetch user name from AA service
    //         var userInfo = await _userServiceClient.GetUserInfoAsync(invoice.UserId);
    //         if (userInfo != null)
    //         {
    //             invoiceResponse.UserName = userInfo.FullName;
    //         }
            
    //         response.Add(invoiceResponse);
    //     }
        
    //     return response;
    // }



    // [HttpPost("{invoiceId}/remind")]
    // public async Task<IActionResult> RemindPayment(Guid invoiceId) // Dùng async
    // {
    //     // 1. Lấy dữ liệu nghiệp vụ từ MySQL/DBear bằng hàm mới
    //     var invoice = await _invoiceRepository.GetOverdueInvoiceDetailsAsync(invoiceId);
        
    //     if (invoice == null)
    //     {
    //         // Trả về nếu không tìm thấy, hoặc nếu hóa đơn đã được thanh toán/chưa quá hạn
    //         return NotFound("Invoice not found or payment not yet overdue.");
    //     }
        
    //     // 2. Tạo Event Object
    //     var eventData = new InvoiceOverdueEvent
    //     {
    //         InvoiceId = invoice.Id,
    //         // Sử dụng ID Tenant từ model Invoice
    //         RecipientUserId = invoice.TenantId.ToString(), // Chuyển Guid/int sang string
    //         Amount = invoice.TotalAmount,
    //         DueDate = invoice.DueDate
    //     };

    //     // 3. Publish Event
    //     _publisher.PublishInvoiceOverdue(eventData);

    //     return Ok(new { Message = $"Nhắc thanh toán cho hóa đơn {invoiceId} đã được gửi." });
    // }
=======
    [HttpGet("pending-this-month")]
    [Authorize(Roles = "Owner")]
    [ProducesResponseType(typeof(IEnumerable<InvoiceService.Features.Invoice.DTOs.PendingInvoiceDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPendingInvoicesThisMonth()
    {
        try
        {
            var ownerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(ownerId))
            {
                return Unauthorized("Owner ID not found in token");
            }

            var pendingInvoices = await _invoiceService.GetPendingInvoicesThisMonthAsync(ownerId);
            return Ok(pendingInvoices);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting pending invoices for current month");
            return StatusCode(500, "Internal server error");
        }
    }
    
    /// <summary>
    /// Kích hoạt quá trình nhắc nhở thanh toán cho tất cả khách thuê thuộc Owner hiện tại.
    /// </summary>
    [HttpPost("remind-unpaid")]
    [Authorize(Roles = "Owner")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> RemindUnpaidInvoices()
    {
        // Lấy OwnerId từ Token (ClaimTypes.NameIdentifier)
        var ownerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(ownerId))
        {
            _logger.LogWarning("RemindUnpaidInvoices attempted without a valid Owner ID.");
            return Unauthorized("Owner ID not found in token.");
        }
        
        try
        {
            // ⭐️ Gọi Service logic đã viết, truyền OwnerId vào để xử lý đúng phạm vi
            await _reminderService.SendPaymentRemindersAsync(ownerId);
            
            _logger.LogInformation("Owner {OwnerId} successfully triggered payment reminders.", ownerId);
            
            return Ok(new { Message = "Yêu cầu nhắc nhở thanh toán đã được gửi đi. Hệ thống đang xử lý." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing manual payment reminder for Owner {OwnerId}", ownerId);
            return StatusCode(StatusCodes.Status500InternalServerError, "Lỗi hệ thống khi gửi nhắc nhở.");
        }
    }

    [HttpGet("monthly-revenue")]
    [Authorize(Roles = "Owner")]
    [ProducesResponseType(typeof(List<MonthlyRevenueDataPoint>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMonthlyRevenue()
    {
        var ownerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(ownerId)) return Unauthorized();

        try
        {
            var report = await _invoiceService.GetMonthlyRevenueReportAsync(ownerId);
            return Ok(report);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting monthly revenue report for owner {OwnerId}", ownerId);
            return StatusCode(500, "Internal server error: Could not generate revenue report.");
        }
    }
>>>>>>> origin/main
}
