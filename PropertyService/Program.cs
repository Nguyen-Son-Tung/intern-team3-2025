using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
<<<<<<< HEAD
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
=======
using Microsoft.OpenApi.Models;
using PropertyService.Data;
using PropertyService.Models;
using PropertyService.Repositories;
using PropertyService.Services;
using PropertyService.Services.Clients;
using PropertyService.Services.Interfaces;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// =====================
// 1. DATABASE
// =====================
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("DefaultConnection"))
    )
);

// =====================
// 2. CORS (AN TOÀN, DEV DỄ CHẠY)
// =====================
// Add Cors
string allowedOrigins = builder.Configuration
                             .GetSection("Cors:AllowedOrigins")
                             .Get<string>() ?? string.Empty;
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFE", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// =====================
// 3. JWT AUTHENTICATION
// =====================
>>>>>>> origin/main
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

<<<<<<< HEAD
// =============================
// 4. Swagger + JWT support
// =============================
=======
// =====================
// 4. SWAGGER
// =====================
>>>>>>> origin/main
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Property Service API",
        Version = "v1"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Nhập token theo format: Bearer {token}"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

<<<<<<< HEAD
// =============================
// 5. DI services
// =============================
=======
// =====================
// 5. DEPENDENCY INJECTION
// =====================
>>>>>>> origin/main
builder.Services.AddAutoMapper(typeof(Program));

builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
<<<<<<< HEAD

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
=======
builder.Services.AddScoped<IContractService, ContractService>();
builder.Services.AddScoped<IHouseService, HouseService>();
builder.Services.AddScoped<IRoomService, RoomService>();
builder.Services.AddScoped<IPropertyQueryService, PropertyQueryService>();

// HTTP Client → AA Service
builder.Services.AddHttpClient<IUserServiceClient, UserServiceClient>(client =>
{
    var aaServiceUrl = builder.Configuration["ServiceUrls:AA"];

    client.BaseAddress = new Uri(aaServiceUrl);
>>>>>>> origin/main
});

builder.Services.AddControllers();

var app = builder.Build();

<<<<<<< HEAD
// =============================
// 7. Middleware pipeline
// =============================
app.UseSwagger();
app.UseSwaggerUI();
=======
// =====================
// 6. PIPELINE
// =====================
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFE");
>>>>>>> origin/main

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
