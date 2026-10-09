import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';
import { RegisterDto } from './register.dto';

describe('RegisterDto Validation', () => {
  it('should fail validation when password lacks special character', async () => {
    const dto = new RegisterDto();
    dto.full_name = 'Nguyen Van A';
    dto.email = 'test@example.com';
    dto.password = 'Password123'; // No special character

    const errors = await validate(dto);
    const passwordError = errors.find((e) => e.property === 'password');
    expect(passwordError).toBeDefined();
    expect(passwordError?.constraints?.matches).toContain('ký tự đặc biệt');
  });

  it('should fail validation when password is shorter than 8 characters', async () => {
    const dto = new RegisterDto();
    dto.full_name = 'Nguyen Van A';
    dto.email = 'test@example.com';
    dto.password = 'Pass@1'; // Only 6 chars

    const errors = await validate(dto);
    const passwordError = errors.find((e) => e.property === 'password');
    expect(passwordError).toBeDefined();
  });

  it('should pass validation when password contains uppercase, lowercase, number, and special character', async () => {
    const dto = new RegisterDto();
    dto.full_name = 'Nguyen Van A';
    dto.email = 'test@example.com';
    dto.password = 'Password@123'; // Meets all requirements

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
