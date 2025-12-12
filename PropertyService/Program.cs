using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PropertyService;
using System.Text;
using PropertyService.Services;
using PropertyService.Services.Interfaces;
using PropertyService.Repositories;
using PropertyService.Services.Clients;
using PropertyService.Models;

var builder = WebApplication.CreateBuilder(args);

// =============================
// 1. DATABASE (MySQL)
// =============================
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");
}

// ĐÃ ĐỔI ApplicationDbContext -> AppDbContext
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString));
});

// =============================
// 2. CORS
// =============================
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
});

// =============================
// 3. JWT Authentication
// =============================
var jwtSettings = builder.Configuration.GetSection("JwtSettings");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings["Secret"]!)
            )
        };
    });

// =============================
// 4. Swagger + JWT support
// =============================
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new()
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header
    });

    c.AddSecurityRequirement(new()
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

// =============================
// 5. DI services
// =============================
builder.Services.AddAutoMapper(typeof(Program));
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));

builder.Services.AddScoped<IContractService, ContractService>();
builder.Services.AddScoped<IHouseService, HouseService>();
builder.Services.AddScoped<IRoomService, RoomService>();
builder.Services.AddScoped<IGenericRepository<House>, GenericRepository<House>>();
builder.Services.AddScoped<IGenericRepository<Room>, GenericRepository<Room>>();
builder.Services.AddScoped<IPropertyQueryService, PropertyQueryService>();

// =============================
// 6. HttpClient gọi sang AA (UserService)
// =============================
builder.Services.AddHttpClient<IUserServiceClient, UserServiceClient>(client =>
{
    var aaServiceUrl = builder.Configuration["ServiceUrls:AA"]; // ví dụ: http://localhost:5286

    if (string.IsNullOrEmpty(aaServiceUrl))
    {
        throw new InvalidOperationException("AA Service URL not configured in appsettings (ServiceUrls:AA).");
    }

    client.BaseAddress = new Uri(aaServiceUrl);
    // Header X-Service-Api-Key thường set trong UserServiceClient, không nhất thiết set ở đây
});

builder.Services.AddControllers();

var app = builder.Build();

// =============================
// 7. Middleware pipeline
// =============================
app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
