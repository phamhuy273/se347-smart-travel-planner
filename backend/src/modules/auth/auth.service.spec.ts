import { describe, it, expect, vi } from 'vitest';
import { AuthService } from './auth.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  };

  const mockJwt = {
    signAsync: vi.fn().mockResolvedValue('mock-token'),
  };

  const service = new AuthService(mockPrisma as any, mockJwt as any);

  it('should throw ConflictException if registering with existing email', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: '1', email: 'existing@test.com' });

    await expect(
      service.register({
        email: 'existing@test.com',
        password: 'password123',
        full_name: 'Test',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should throw UnauthorizedException if login password does not match', async () => {
    const hashed = await bcrypt.hash('correct-password', 10);
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: '1',
      email: 'user@test.com',
      password_hash: hashed,
    });

    await expect(
      service.login({
        email: 'user@test.com',
        password: 'wrong-password',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should successfully login and return access token', async () => {
    const hashed = await bcrypt.hash('secret123', 10);
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'user-123',
      email: 'user@test.com',
      password_hash: hashed,
      full_name: 'Wanderer',
    });

    const result = await service.login({
      email: 'user@test.com',
      password: 'secret123',
    });

    expect(result.accessToken).toBe('mock-token');
    expect(result.user.email).toBe('user@test.com');
  });
});
