import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { validate } from 'class-validator';
import { AuthService } from './auth.service';
import { AuthController, extractRefreshToken } from './auth.controller';
import { ResetPasswordDto } from './dto/reset-password.dto';

const SENSITIVE_USER_KEYS = [
  'password_hash',
  'verify_token',
  'verify_token_expires_at',
  'google_id',
];

const PUBLIC_USER_KEYS = [
  'id',
  'email',
  'full_name',
  'avatar_url',
  'bio',
  'phone_number',
  'is_verified',
  'created_at',
  'updated_at',
];

function createFullDbUser(overrides: Record<string, any> = {}) {
  return {
    id: 'user-123',
    email: 'user@test.com',
    password_hash: 'hashed-pw',
    full_name: 'Wanderer',
    avatar_url: null,
    bio: null,
    phone_number: null,
    is_verified: true,
    verify_token: 'secret-verify-token',
    verify_token_expires_at: new Date('2026-12-01T00:00:00.000Z'),
    google_id: 'google-123',
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  };
}

function expectSafePublicUser(user: Record<string, any>) {
  for (const key of SENSITIVE_USER_KEYS) {
    expect(user).not.toHaveProperty(key);
  }
  expect(Object.keys(user).sort()).toEqual([...PUBLIC_USER_KEYS].sort());
}

describe('AuthService', () => {
  let mockPrisma: any;
  let mockTx: any;
  let mockJwt: any;
  let service: AuthService;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    mockTx = {
      user: {
        update: vi.fn().mockResolvedValue({}),
      },
      refreshToken: {
        create: vi.fn().mockResolvedValue({ id: 'rt-new' }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };

    mockPrisma = {
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
      $transaction: vi.fn(async (cb: (tx: any) => Promise<any>) => cb(mockTx)),
    };

    mockJwt = {
      signAsync: vi.fn().mockResolvedValue('mock-token'),
    };

    service = new AuthService(mockPrisma as any, mockJwt as any);
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

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

  it('should update and resend verification email if registering with unverified email', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: '1',
      email: 'unverified@test.com',
      is_verified: false,
    });
    mockPrisma.user.update.mockResolvedValueOnce({
      id: '1',
      email: 'unverified@test.com',
    });

    const result = await service.register({
      email: 'unverified@test.com',
      password: 'Password@123',
      full_name: 'Test Updated',
    });

    expect(result.requiresVerification).toBe(true);
    expect(result.email).toBe('unverified@test.com');
  });

  it('should throw UnauthorizedException if login password does not match', async () => {
    const hashed = await bcrypt.hash('correct-password', 10);
    mockPrisma.user.findUnique.mockResolvedValueOnce(
      createFullDbUser({ password_hash: hashed }),
    );

    await expect(
      service.login({
        email: 'user@test.com',
        password: 'wrong-password',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if user email is not verified', async () => {
    const hashed = await bcrypt.hash('secret123', 10);
    mockPrisma.user.findUnique.mockResolvedValueOnce(
      createFullDbUser({ password_hash: hashed, is_verified: false }),
    );

    await expect(
      service.login({
        email: 'user@test.com',
        password: 'secret123',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should successfully login and return safe user, access token and create refresh token', async () => {
    const hashed = await bcrypt.hash('secret123', 10);
    mockPrisma.user.findUnique.mockResolvedValueOnce(
      createFullDbUser({ password_hash: hashed }),
    );

    const result = await service.login({
      email: 'user@test.com',
      password: 'secret123',
    });

    expect(result.accessToken).toBe('mock-token');
    expectSafePublicUser(result.user);
    expect(mockPrisma.refreshToken.create).toHaveBeenCalled();
  });

  it('should authenticate via Google Login and return token without sensitive fields', async () => {
    mockPrisma.user.findFirst.mockResolvedValueOnce(null);
    mockPrisma.user.create.mockResolvedValueOnce(
      createFullDbUser({
        id: 'google-user-1',
        email: 'dev@gmail.com',
        full_name: 'Google User',
        google_id: 'mock_gid_dev@gmail.com',
      }),
    );

    const result = await service.googleLogin({
      credential: 'mock:dev',
      email: 'dev@gmail.com',
      full_name: 'Google User',
    });

    expect(result.accessToken).toBe('mock-token');
    expect(result.user.email).toBe('dev@gmail.com');
    expectSafePublicUser(result.user);
  });

  it('should refresh token atomically, set cookie after transaction, and return safe user', async () => {
    const res = {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as any;

    mockPrisma.refreshToken.findFirst.mockResolvedValueOnce({
      id: 'rt-old',
      user_id: 'user-123',
      is_revoked: false,
      expires_at: new Date(Date.now() + 1000 * 60 * 60),
      user: createFullDbUser(),
    });

    const result = await service.refreshToken('valid-token-string', res);

    expect(result.accessToken).toBe('mock-token');
    expectSafePublicUser(result.user);
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    expect(mockTx.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { id: 'rt-old', is_revoked: false },
      data: { is_revoked: true },
    });
    expect(mockTx.refreshToken.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.refreshToken.create).not.toHaveBeenCalled();
    expect(res.cookie).toHaveBeenCalledWith(
      'refresh_token',
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
      }),
    );
    expect(res.clearCookie).not.toHaveBeenCalled();
  });

  it('should throw 401, not create token, and not clear cookie when atomic revoke count is 0', async () => {
    const res = {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as any;

    mockPrisma.refreshToken.findFirst.mockResolvedValueOnce({
      id: 'rt-race',
      user_id: 'user-123',
      is_revoked: false,
      expires_at: new Date(Date.now() + 1000 * 60 * 60),
      user: createFullDbUser(),
    });
    mockTx.refreshToken.updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(service.refreshToken('raced-token', res)).rejects.toThrow(
      UnauthorizedException,
    );

    expect(mockTx.refreshToken.create).not.toHaveBeenCalled();
    expect(res.cookie).not.toHaveBeenCalled();
    expect(res.clearCookie).not.toHaveBeenCalled();
  });

  it('should not set cookie if transaction fails during refresh', async () => {
    const res = {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as any;

    mockPrisma.refreshToken.findFirst.mockResolvedValueOnce({
      id: 'rt-old',
      user_id: 'user-123',
      is_revoked: false,
      expires_at: new Date(Date.now() + 1000 * 60 * 60),
      user: createFullDbUser(),
    });
    mockPrisma.$transaction.mockRejectedValueOnce(new Error('DB commit failed'));

    await expect(service.refreshToken('valid-token', res)).rejects.toThrow(
      'DB commit failed',
    );
    expect(res.cookie).not.toHaveBeenCalled();
    expect(res.clearCookie).not.toHaveBeenCalled();
  });

  it('should throw 401 when refreshing with missing, invalid, or expired token without clearing cookie', async () => {
    const res = {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as any;

    await expect(service.refreshToken(undefined, res)).rejects.toThrow(
      UnauthorizedException,
    );

    mockPrisma.refreshToken.findFirst.mockResolvedValueOnce(null);
    await expect(service.refreshToken('invalid-token', res)).rejects.toThrow(
      UnauthorizedException,
    );

    mockPrisma.refreshToken.findFirst.mockResolvedValueOnce({
      id: 'rt-expired',
      user_id: 'user-123',
      is_revoked: false,
      expires_at: new Date(Date.now() - 1000),
      user: createFullDbUser(),
    });
    await expect(service.refreshToken('expired-token', res)).rejects.toThrow(
      UnauthorizedException,
    );

    expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { id: 'rt-expired', is_revoked: false },
      data: { is_revoked: true },
    });
    expect(mockTx.refreshToken.create).not.toHaveBeenCalled();
    expect(res.cookie).not.toHaveBeenCalled();
    expect(res.clearCookie).not.toHaveBeenCalled();
  });

  it('should logout with exact SHA-256 hash and clear cookie with matching options', async () => {
    process.env.NODE_ENV = 'production';
    const rawToken = 'some-token-to-revoke';
    const expectedHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const res = {
      clearCookie: vi.fn(),
    } as any;

    const result = await service.logout(rawToken, res);

    expect(result.message).toBe('Đăng xuất thành công');
    expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: {
        token_hash: expectedHash,
        is_revoked: false,
      },
      data: {
        is_revoked: true,
      },
    });
    expect(res.clearCookie).toHaveBeenCalledWith('refresh_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
    });
  });

  it('should return 200 on logout even without cookie', async () => {
    const res = {
      clearCookie: vi.fn(),
    } as any;

    const result = await service.logout(undefined, res);

    expect(result).toEqual({ message: 'Đăng xuất thành công' });
    expect(mockPrisma.refreshToken.updateMany).not.toHaveBeenCalled();
    expect(res.clearCookie).toHaveBeenCalledWith('refresh_token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });
  });

  it('should create refresh token and set cookie on verifyEmail', async () => {
    const res = {
      cookie: vi.fn(),
    } as any;
    const publicUser = createFullDbUser({ is_verified: true });
    delete (publicUser as any).password_hash;
    delete (publicUser as any).verify_token;
    delete (publicUser as any).verify_token_expires_at;
    delete (publicUser as any).google_id;

    mockPrisma.user.findUnique.mockResolvedValueOnce(
      createFullDbUser({
        is_verified: false,
        verify_token: 'verify-tok',
        verify_token_expires_at: new Date(Date.now() + 60_000),
      }),
    );
    mockPrisma.user.update.mockResolvedValueOnce(publicUser);

    const result = await service.verifyEmail('verify-tok', 'user@test.com', res);

    expect(result.message).toContain('Kích hoạt tài khoản thành công');
    expect(result.accessToken).toBe('mock-token');
    expectSafePublicUser(result.user);
    expect(mockPrisma.refreshToken.create).toHaveBeenCalledTimes(1);
    expect(res.cookie).toHaveBeenCalledWith(
      'refresh_token',
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        path: '/',
      }),
    );
  });

  it('should update password and revoke all active refresh tokens in a transaction on resetPassword', async () => {
    const otpHash = await bcrypt.hash('123456', 10);
    mockPrisma.user.findUnique.mockResolvedValueOnce(
      createFullDbUser({
        verify_token: otpHash,
        verify_token_expires_at: new Date(Date.now() + 60_000),
      }),
    );

    const result = await service.resetPassword({
      email: 'user@test.com',
      otp: '123456',
      new_password: 'NewPassword@123',
    });

    expect(result.message).toContain('Đặt lại mật khẩu thành công');
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    expect(mockTx.user.update).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      data: {
        password_hash: expect.any(String),
        verify_token: null,
        verify_token_expires_at: null,
      },
    });
    expect(mockTx.refreshToken.updateMany).toHaveBeenCalledWith({
      where: {
        user_id: 'user-123',
        is_revoked: false,
      },
      data: {
        is_revoked: true,
      },
    });
  });

  it('should generate OTP on forgotPassword', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      email: 'forgot@test.com',
    });
    mockPrisma.user.update.mockResolvedValueOnce({});

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

describe('extractRefreshToken & AuthController cookie safety', () => {
  it('should return undefined without throwing when refresh_token cookie is malformed', async () => {
    const req = { headers: { cookie: 'refresh_token=%E0%A4%A' } } as any;
    expect(extractRefreshToken(req)).toBeUndefined();

    const mockService = {
      refreshToken: vi.fn().mockRejectedValue(new UnauthorizedException('Missing')),
    };
    const controller = new AuthController(mockService as any);
    await expect(controller.refreshToken(req, {} as any)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(mockService.refreshToken).toHaveBeenCalledWith(undefined, expect.anything());
  });

  it('should extract valid refresh_token even when another cookie is malformed', () => {
    const req = {
      headers: { cookie: 'broken=%E0%A4%A; refresh_token=valid%2Dtoken' },
    } as any;
    expect(extractRefreshToken(req)).toBe('valid-token');
  });
});

describe('ResetPasswordDto Validation', () => {
  it('should reject Password123 because it lacks a special character', async () => {
    const dto = new ResetPasswordDto();
    dto.email = 'test@example.com';
    dto.otp = '123456';
    dto.new_password = 'Password123';

    const errors = await validate(dto);
    const pwError = errors.find((e) => e.property === 'new_password');
    expect(pwError).toBeDefined();
    expect(pwError?.constraints?.matches).toContain('ký tự đặc biệt');
  });

  it('should accept Password@123', async () => {
    const dto = new ResetPasswordDto();
    dto.email = 'test@example.com';
    dto.otp = '123456';
    dto.new_password = 'Password@123';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
