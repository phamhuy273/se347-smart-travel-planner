import { describe, it, expect, vi } from 'vitest';
import { AuthService } from './auth.service';
import { ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    refreshToken: {
      create: vi.fn().mockResolvedValue({ id: 'rt-1' }),
      findFirst: vi.fn(),
      update: vi.fn().mockResolvedValue({ id: 'rt-1', is_revoked: true }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  };

  const mockJwt = {
    signAsync: vi.fn().mockResolvedValue('mock-token'),
  };

  const service = new AuthService(mockPrisma as any, mockJwt as any);

  it('should throw ConflictException if registering with existing verified email', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: '1',
      email: 'existing@test.com',
      is_verified: true,
    });

    await expect(
      service.register({
        email: 'existing@test.com',
        password: 'Password@123',
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
      is_verified: true,
    });

    await expect(
      service.login({
        email: 'user@test.com',
        password: 'wrong-password',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should successfully login and return access token and create refresh token', async () => {
    const hashed = await bcrypt.hash('secret123', 10);
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'user-123',
      email: 'user@test.com',
      password_hash: hashed,
      full_name: 'Wanderer',
      is_verified: true,
    });

    const result = await service.login({
      email: 'user@test.com',
      password: 'secret123',
    });

    expect(result.accessToken).toBe('mock-token');
    expect(result.user.email).toBe('user@test.com');
    expect(mockPrisma.refreshToken.create).toHaveBeenCalled();
  });

  it('should authenticate via Google Login and return token', async () => {
    (mockPrisma.user as any).findFirst = vi.fn().mockResolvedValueOnce(null);
    (mockPrisma.user as any).create = vi.fn().mockResolvedValueOnce({
      id: 'google-user-1',
      email: 'dev@gmail.com',
      full_name: 'Google User',
      google_id: 'mock_gid_dev@gmail.com',
      is_verified: true,
    });

    const result = await service.googleLogin({
      credential: 'mock:dev',
      email: 'dev@gmail.com',
      full_name: 'Google User',
    });

    expect(result.accessToken).toBe('mock-token');
    expect(result.user.email).toBe('dev@gmail.com');
  });

  it('should refresh token successfully when valid refresh token is provided', async () => {
    mockPrisma.refreshToken.findFirst.mockResolvedValueOnce({
      id: 'rt-old',
      user_id: 'user-123',
      is_revoked: false,
      expires_at: new Date(Date.now() + 1000 * 60 * 60), // not expired
      user: {
        id: 'user-123',
        email: 'user@test.com',
        full_name: 'Wanderer',
      },
    });

    const result = await service.refreshToken('valid-token-string');
    expect(result.accessToken).toBe('mock-token');
    expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'rt-old' },
        data: { is_revoked: true },
      }),
    );
  });

  it('should throw UnauthorizedException when refreshing with missing or invalid token', async () => {
    await expect(service.refreshToken(undefined)).rejects.toThrow(UnauthorizedException);

    mockPrisma.refreshToken.findFirst.mockResolvedValueOnce(null);
    await expect(service.refreshToken('invalid-token')).rejects.toThrow(UnauthorizedException);
  });

  it('should logout and revoke token in database', async () => {
    const result = await service.logout('some-token-to-revoke');
    expect(result.message).toBe('Đăng xuất thành công');
    expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalled();
  });

  it('should generate OTP on forgotPassword', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      email: 'forgot@test.com',
    });
    (mockPrisma.user as any).update = vi.fn().mockResolvedValueOnce({});

    const result = await service.forgotPassword({ email: 'forgot@test.com' });
    expect(result.message).toContain('Mã xác thực OTP');
    expect(result.isEmailSent).toBeDefined();
  });

  it('should throw NotFoundException on forgotPassword if email does not exist', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.forgotPassword({ email: 'nonexistent@test.com' }),
    ).rejects.toThrow(NotFoundException);
  });
});
