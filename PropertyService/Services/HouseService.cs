using AutoMapper;
<<<<<<< HEAD
using PropertyService;
=======
using PropertyService.Data; // Có thể không cần nếu không dùng DbContext trực tiếp
>>>>>>> origin/main
using PropertyService.DTOs.Houses;
using PropertyService.Models;
using PropertyService.Services.Interfaces;
using PropertyService.Repositories;
using Microsoft.EntityFrameworkCore;
using PropertyService.DTOs.Contracts;
using PropertyService.Models.Enums;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
<<<<<<< HEAD
using System.ComponentModel.DataAnnotations;
=======
using PropertyService.Repositories;
using Microsoft.EntityFrameworkCore; // Cần cho AnyAsync
using PropertyService.DTOs.Contracts;
using PropertyService.Models.Enums;
using System.ComponentModel.DataAnnotations;
namespace PropertyService.Services;
>>>>>>> origin/main

namespace PropertyService.Services;
public class HouseService : IHouseService
{
    private readonly IGenericRepository<House> _repo;
    private readonly IMapper _mapper;
    public HouseService(IGenericRepository<House> repo, IMapper mapper)
    {
        _repo = repo;
        _mapper = mapper;
    }

<<<<<<< HEAD
    // ⭐ CREATE HOUSE
=======
    //  CREATE HOUSE
>>>>>>> origin/main
    public async Task<HouseDto> CreateAsync(CreateHouseDto dto, Guid ownerId)
    {
        var house = new House
        {
            OwnerId = ownerId,
            Name = dto.Name,
            Address = dto.Address
        };

        await _repo.AddAsync(house);
        return _mapper.Map<HouseDto>(house);
    }

<<<<<<< HEAD
    // ⭐ GET ALL HOUSES BY OWNER ID
=======
    //  GET ALL HOUSES BY OWNER ID
>>>>>>> origin/main
    public async Task<IEnumerable<HouseDto>> GetAllAsync(Guid ownerId)
    {
        var houses = await _repo.FindAsync(h => h.OwnerId == ownerId);

        return _mapper.Map<IEnumerable<HouseDto>>(houses);
    }

<<<<<<< HEAD
    // ⭐ GET HOUSE BY ID
    public async Task<HouseDto?> GetByIdAsync(int id)
    {
        // Lưu ý: Controller cần kiểm tra quyền sở hữu sau khi gọi hàm này
=======
    //  GET HOUSE BY ID
    public async Task<HouseDto?> GetByIdAsync(int id)
    {
        // Note: Controller needs to check ownership after calling this function
>>>>>>> origin/main
        var house = await _repo.GetByIdAsync(id); 
        return _mapper.Map<HouseDto>(house);
    }

<<<<<<< HEAD
    // ⭐ UPDATE HOUSE
=======
    //  UPDATE HOUSE
>>>>>>> origin/main
    public async Task UpdateAsync(int id, UpdateHouseDto dto)
    {
        // Giả định Controller đã kiểm tra quyền sở hữu trước khi gọi hàm này
        var house = await _repo.GetByIdAsync(id);
        if (house == null)
            throw new Exception("House not found");

        house.Name = dto.Name;
        house.Address = dto.Address;

        await _repo.UpdateAsync(house);
    }

<<<<<<< HEAD
    // ⭐ DELETE HOUSE
=======
    //  DELETE HOUSE
>>>>>>> origin/main
    public async Task DeleteAsync(int id)
    {
        // Giả định Controller đã kiểm tra quyền sở hữu trước khi gọi hàm này
        var house = await _repo.GetByIdAsync(id);
        if (house == null)
            throw new Exception("House not found");

        await _repo.DeleteAsync(house);
    }

<<<<<<< HEAD
    // ⭐ KIỂM TRA QUYỀN SỞ HỮU (Dùng cho Controller)
=======
    //  KIỂM TRA QUYỀN SỞ HỮU (Dùng cho Controller)
>>>>>>> origin/main
    public async Task<bool> IsOwnedByAsync(int houseId, Guid ownerId)
    {
        // Kiểm tra xem có bất kỳ nhà nào khớp với cả ID nhà VÀ Owner ID hay không
        var isOwned = await _repo.Query()
                                 .AnyAsync(h => h.Id == houseId && h.OwnerId == ownerId);
        return isOwned;
    }
	public async Task<IEnumerable<HouseDto>> GetHousesOwnedByAsync(Guid ownerId)
        {
            // Tìm tất cả các nhà (House) có OwnerId khớp
            var houses = await _repo.FindAsync(h => h.OwnerId == ownerId);
            
            // Map kết quả sang DTO và trả về
            return _mapper.Map<IEnumerable<HouseDto>>(houses);
        }
}