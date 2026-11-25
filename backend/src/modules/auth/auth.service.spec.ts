import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { validate } from 'class-validator';
import { AuthService } from './auth.service';
import { AuthController, extractRefreshToken } from './auth.controller';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

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

function setupStatefulRefreshTokens(
  mockPrisma: any,
  mockTx: any,
  initialRecords: Array<{
    id: string;
    user_id: string;
    token_hash: string;
    is_revoked: boolean;
    expires_at: Date;
    user: Record<string, any>;
  }>,
) {
  const records = initialRecords.map((record) => ({ ...record }));

  const matchesWhere = (record: any, where: Record<string, any> = {}) => {
    if (where.id !== undefined && record.id !== where.id) return false;
    if (where.user_id !== undefined && record.user_id !== where.user_id) return false;
    if (where.token_hash !== undefined && record.token_hash !== where.token_hash) return false;
    if (where.is_revoked !== undefined && record.is_revoked !== where.is_revoked) return false;
    if (where.expires_at?.gt !== undefined && !(record.expires_at > where.expires_at.gt)) {
      return false;
    }
    return true;
  };

  const findFirstImpl = async ({ where }: any) => {
    const found = records.find((record) => matchesWhere(record, where));
    return found ? { ...found } : null;
  };

  const updateManyImpl = async ({ where, data }: any) => {
    let count = 0;
    for (const record of records) {
      if (matchesWhere(record, where)) {
        Object.assign(record, data);
        count += 1;
      }
    }
    return { count };
  };

  const createImpl = async ({ data }: any) => {
    const created = {
      id: `rt-${records.length + 1}`,
      is_revoked: false,
      user: records[0]?.user ?? createFullDbUser(),
      ...data,
    };
    records.push(created);
    return created;
  };

  mockPrisma.refreshToken.findFirst.mockImplementation(findFirstImpl);
  mockPrisma.refreshToken.updateMany.mockImplementation(updateManyImpl);
  mockTx.refreshToken.updateMany.mockImplementation(updateManyImpl);
  mockTx.refreshToken.create.mockImplementation(createImpl);

  return records;
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
    vi.useRealTimers();
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

  it('should rotate token on first refresh by shortening expires_at to now + 10s without revoking', async () => {
    const now = new Date('2026-06-01T00:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const res = {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as any;

    mockPrisma.refreshToken.findFirst.mockResolvedValueOnce({
      id: 'rt-old',
      user_id: 'user-123',
      is_revoked: false,
      expires_at: new Date('2026-06-08T00:00:00.000Z'),
      user: createFullDbUser(),
    });

    const result = await service.refreshToken('valid-token-string', res);
    const expectedGraceExpiresAt = new Date('2026-06-01T00:00:10.000Z');

    expect(result.accessToken).toBe('mock-token');
    expectSafePublicUser(result.user);
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    expect(mockTx.refreshToken.updateMany).toHaveBeenCalledTimes(1);
    expect(mockTx.refreshToken.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'rt-old',
        is_revoked: false,
        expires_at: { gt: expectedGraceExpiresAt },
      },
      data: { expires_at: expectedGraceExpiresAt },
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

  it('should allow reusing old token within 10s grace window without extending expires_at', async () => {
    const t0 = new Date('2026-06-01T00:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(t0);

    const rawOldToken = 'old-refresh-token';
    const oldTokenHash = crypto.createHash('sha256').update(rawOldToken).digest('hex');
    const records = setupStatefulRefreshTokens(mockPrisma, mockTx, [
      {
        id: 'rt-1',
        user_id: 'user-123',
        token_hash: oldTokenHash,
        is_revoked: false,
        expires_at: new Date('2026-06-08T00:00:00.000Z'),
        user: createFullDbUser(),
      },
    ]);

    const res1 = { cookie: vi.fn(), clearCookie: vi.fn() } as any;
    await service.refreshToken(rawOldToken, res1);

    const expectedGraceDeadline = new Date('2026-06-01T00:00:10.000Z');
    expect(records[0].is_revoked).toBe(false);
    expect(records[0].expires_at).toEqual(expectedGraceDeadline);

    // F5 lại sau 4 giây khi trình duyệt chưa nhận được Set-Cookie mới
    vi.advanceTimersByTime(4_000);
    const res2 = { cookie: vi.fn(), clearCookie: vi.fn() } as any;
    const secondResult = await service.refreshToken(rawOldToken, res2);

    expect(secondResult.accessToken).toBe('mock-token');
    expectSafePublicUser(secondResult.user);
    expect(records[0].is_revoked).toBe(false);
    expect(records[0].expires_at).toEqual(expectedGraceDeadline);
    expect(mockTx.refreshToken.updateMany).toHaveBeenLastCalledWith({
      where: {
        id: 'rt-1',
        is_revoked: false,
        expires_at: { gt: new Date('2026-06-01T00:00:04.000Z') },
      },
      data: { is_revoked: false },
    });
    expect(res2.cookie).toHaveBeenCalledWith(
      'refresh_token',
      expect.any(String),
      expect.objectContaining({ httpOnly: true, path: '/' }),
    );
    expect(records).toHaveLength(3);

    // Tái sử dụng ở giây thứ 9 vẫn trong ân hạn và không gia hạn thêm
    vi.advanceTimersByTime(5_000);
    const res3 = { cookie: vi.fn(), clearCookie: vi.fn() } as any;
    await service.refreshToken(rawOldToken, res3);
    expect(records[0].expires_at).toEqual(expectedGraceDeadline);
    expect(res3.cookie).toHaveBeenCalledTimes(1);
  });

  it('should not extend expires_at when token already expires within 10s', async () => {
    const t0 = new Date('2026-06-01T00:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(t0);

    const rawToken = 'near-expiry-token';
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const originalExpiry = new Date('2026-06-01T00:00:05.000Z');
    const records = setupStatefulRefreshTokens(mockPrisma, mockTx, [
      {
        id: 'rt-near',
        user_id: 'user-123',
        token_hash: tokenHash,
        is_revoked: false,
        expires_at: originalExpiry,
        user: createFullDbUser(),
      },
    ]);

    const res = { cookie: vi.fn(), clearCookie: vi.fn() } as any;
    const result = await service.refreshToken(rawToken, res);

    expect(result.accessToken).toBe('mock-token');
    expect(records[0].expires_at).toEqual(originalExpiry);
    expect(records[0].is_revoked).toBe(false);
    expect(res.cookie).toHaveBeenCalledTimes(1);
  });

  it('should throw 401 and mark token revoked after 10s grace window expires', async () => {
    const t0 = new Date('2026-06-01T00:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(t0);

    const rawOldToken = 'old-refresh-token';
    const oldTokenHash = crypto.createHash('sha256').update(rawOldToken).digest('hex');
    const records = setupStatefulRefreshTokens(mockPrisma, mockTx, [
      {
        id: 'rt-1',
        user_id: 'user-123',
        token_hash: oldTokenHash,
        is_revoked: false,
        expires_at: new Date('2026-06-08T00:00:00.000Z'),
        user: createFullDbUser(),
      },
    ]);

    await service.refreshToken(rawOldToken, { cookie: vi.fn(), clearCookie: vi.fn() } as any);

    // Trong ân hạn vẫn hợp lệ và không gia hạn
    vi.advanceTimersByTime(5_000);
    await service.refreshToken(rawOldToken, { cookie: vi.fn(), clearCookie: vi.fn() } as any);

    // Sau 10 giây ân hạn (+1ms tính từ lần xoay đầu) -> 401 và đánh dấu revoked
    vi.advanceTimersByTime(5_001);
    const resLate = { cookie: vi.fn(), clearCookie: vi.fn() } as any;

    await expect(service.refreshToken(rawOldToken, resLate)).rejects.toThrow(
      UnauthorizedException,
    );

    expect(records[0].is_revoked).toBe(true);
    expect(records).toHaveLength(3);
    expect(resLate.cookie).not.toHaveBeenCalled();
    expect(resLate.clearCookie).not.toHaveBeenCalled();
  });

  it('should always throw 401 for revoked token with no grace period', async () => {
    const t0 = new Date('2026-06-01T00:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(t0);

    const rawOldToken = 'old-refresh-token';
    const oldTokenHash = crypto.createHash('sha256').update(rawOldToken).digest('hex');
    const rawPreRevokedToken = 'pre-revoked-token';
    const preRevokedHash = crypto.createHash('sha256').update(rawPreRevokedToken).digest('hex');
    const records = setupStatefulRefreshTokens(mockPrisma, mockTx, [
      {
        id: 'rt-1',
        user_id: 'user-123',
        token_hash: oldTokenHash,
        is_revoked: false,
        expires_at: new Date('2026-06-08T00:00:00.000Z'),
        user: createFullDbUser(),
      },
      {
        id: 'rt-revoked',
        user_id: 'user-123',
        token_hash: preRevokedHash,
        is_revoked: true,
        expires_at: new Date('2026-06-08T00:00:00.000Z'),
        user: createFullDbUser(),
      },
    ]);

    const resRevoked = { cookie: vi.fn(), clearCookie: vi.fn() } as any;
    await expect(service.refreshToken(rawPreRevokedToken, resRevoked)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(resRevoked.cookie).not.toHaveBeenCalled();

    await service.refreshToken(rawOldToken, { cookie: vi.fn(), clearCookie: vi.fn() } as any);
    expect(records[0].is_revoked).toBe(false);

    // Logout trong khoảng ân hạn phải thu hồi ngay lập tức, không còn ân hạn
    vi.advanceTimersByTime(2_000);
    await service.logout(rawOldToken, { clearCookie: vi.fn() } as any);
    expect(records[0].is_revoked).toBe(true);

    const resAfterLogout = { cookie: vi.fn(), clearCookie: vi.fn() } as any;
    await expect(service.refreshToken(rawOldToken, resAfterLogout)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(resAfterLogout.cookie).not.toHaveBeenCalled();
  });

  it('should throw 401, not create token, and not set or clear cookie when both updateMany calls return count 0', async () => {
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
    mockTx.refreshToken.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 0 });

    await expect(service.refreshToken('raced-token', res)).rejects.toThrow(
      UnauthorizedException,
    );

    expect(mockTx.refreshToken.updateMany).toHaveBeenCalledTimes(2);
    expect(mockTx.refreshToken.create).not.toHaveBeenCalled();
    expect(mockJwt.signAsync).not.toHaveBeenCalled();
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

  it('should verify email and return { message, user } without creating refresh token or setting cookie', async () => {
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
    const setCookieSpy = vi.spyOn(service as any, 'setRefreshTokenCookie');

    const result = await service.verifyEmail('verify-tok', 'user@test.com');

    expect(Object.keys(result).sort()).toEqual(['message', 'user']);
    expect(result.message).toContain('Kích hoạt tài khoản thành công');
    expect(result).not.toHaveProperty('accessToken');
    expectSafePublicUser(result.user);
    expect(mockPrisma.refreshToken.create).not.toHaveBeenCalled();
    expect(mockTx.refreshToken.create).not.toHaveBeenCalled();
    expect(mockJwt.signAsync).not.toHaveBeenCalled();
    expect(setCookieSpy).not.toHaveBeenCalled();
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

  describe('updateProfile', () => {
    it('should update only provided fields and return public user fields', async () => {
      const updatedUser = createFullDbUser({
        full_name: 'Nguyen Van B',
        bio: 'Traveler',
      });
      delete (updatedUser as any).password_hash;
      delete (updatedUser as any).verify_token;
      delete (updatedUser as any).verify_token_expires_at;
      delete (updatedUser as any).google_id;

      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'user-123' });
      mockPrisma.user.update.mockResolvedValueOnce(updatedUser);

      const result = await service.updateProfile('user-123', {
        full_name: 'Nguyen Van B',
        bio: 'Traveler',
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { full_name: 'Nguyen Van B', bio: 'Traveler' },
        select: expect.objectContaining({
          id: true,
          email: true,
          full_name: true,
          avatar_url: true,
          bio: true,
          phone_number: true,
          is_verified: true,
          created_at: true,
          updated_at: true,
        }),
      });
      expectSafePublicUser(result);
    });

    it('should allow clearing nullable fields with null', async () => {
      const updatedUser = createFullDbUser({
        bio: null,
        phone_number: null,
        avatar_url: null,
      });
      delete (updatedUser as any).password_hash;
      delete (updatedUser as any).verify_token;
      delete (updatedUser as any).verify_token_expires_at;
      delete (updatedUser as any).google_id;

      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'user-123' });
      mockPrisma.user.update.mockResolvedValueOnce(updatedUser);

      await service.updateProfile('user-123', {
        bio: null,
        phone_number: null,
        avatar_url: null,
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { bio: null, phone_number: null, avatar_url: null },
        }),
      );
    });

    it('should return unchanged user without DB write when body is empty', async () => {
      const existingPublic = createFullDbUser();
      delete (existingPublic as any).password_hash;
      delete (existingPublic as any).verify_token;
      delete (existingPublic as any).verify_token_expires_at;
      delete (existingPublic as any).google_id;

      mockPrisma.user.findUnique.mockResolvedValueOnce(existingPublic);

      const result = await service.updateProfile('user-123', {});
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expectSafePublicUser(result);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.updateProfile('missing-user', { full_name: 'Abc' }),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('should hash new password, revoke all tokens, create new session in transaction, and set cookie', async () => {
      const oldHash = await bcrypt.hash('OldPass@123', 10);
      const res = { cookie: vi.fn(), clearCookie: vi.fn() } as any;
      const publicUpdated = createFullDbUser();
      delete (publicUpdated as any).password_hash;
      delete (publicUpdated as any).verify_token;
      delete (publicUpdated as any).verify_token_expires_at;
      delete (publicUpdated as any).google_id;

      mockPrisma.user.findUnique.mockResolvedValueOnce(
        createFullDbUser({ password_hash: oldHash }),
      );
      mockTx.user.update.mockResolvedValueOnce(publicUpdated);

      const result = await service.changePassword(
        'user-123',
        {
          current_password: 'OldPass@123',
          new_password: 'NewPass@123',
        },
        res,
      );

      expect(result.message).toContain('Đổi mật khẩu thành công');
      expect(result.accessToken).toBe('mock-token');
      expectSafePublicUser(result.user);
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);

      const updateCall = mockTx.user.update.mock.calls[0][0];
      const savedHash = updateCall.data.password_hash;
      expect(savedHash).not.toBe('NewPass@123');
      expect(await bcrypt.compare('NewPass@123', savedHash)).toBe(true);

      expect(mockTx.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { user_id: 'user-123', is_revoked: false },
        data: { is_revoked: true },
      });
      expect(mockTx.refreshToken.create).toHaveBeenCalledTimes(1);
      expect(res.cookie).toHaveBeenCalledWith(
        'refresh_token',
        expect.any(String),
        expect.objectContaining({ httpOnly: true, path: '/' }),
      );
    });

    it('should throw NotFoundException when user does not exist without writing DB', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.changePassword('missing', {
          current_password: 'OldPass@123',
          new_password: 'NewPass@123',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
      expect(mockTx.user.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException (400) for Google account without password_hash and not write DB', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(
        createFullDbUser({ password_hash: null }),
      );

      await expect(
        service.changePassword('user-123', {
          current_password: 'OldPass@123',
          new_password: 'NewPass@123',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException (400) when current password is wrong and not write DB', async () => {
      const oldHash = await bcrypt.hash('OldPass@123', 10);
      mockPrisma.user.findUnique.mockResolvedValueOnce(
        createFullDbUser({ password_hash: oldHash }),
      );

      await expect(
        service.changePassword('user-123', {
          current_password: 'WrongPass@123',
          new_password: 'NewPass@123',
        }),
      ).rejects.toThrow(
        new BadRequestException('Mật khẩu hiện tại không chính xác'),
      );

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException (400) when new password equals current password and not write DB', async () => {
      const oldHash = await bcrypt.hash('OldPass@123', 10);
      mockPrisma.user.findUnique.mockResolvedValueOnce(
        createFullDbUser({ password_hash: oldHash }),
      );

      await expect(
        service.changePassword('user-123', {
          current_password: 'OldPass@123',
          new_password: 'OldPass@123',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
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

  it('should delegate verifyEmail from controller without passing response object', async () => {
    const expected = {
      message: 'Kích hoạt tài khoản thành công!',
      user: { id: 'user-123', email: 'user@test.com' },
    };
    const mockService = {
      verifyEmail: vi.fn().mockResolvedValue(expected),
    };
    const controller = new AuthController(mockService as any);

    const result = await controller.verifyEmail('verify-tok', 'user@test.com');

    expect(mockService.verifyEmail).toHaveBeenCalledWith('verify-tok', 'user@test.com');
    expect(result).toEqual(expected);
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

describe('UpdateProfileDto & ChangePasswordDto ValidationPipe', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    transformOptions: { enableImplicitConversion: true },
  });

  const validateBody = (dtoClass: any, body: any) =>
    pipe.transform(body, { type: 'body', metatype: dtoClass });

  it('should reject full_name: null, whitespace-only full_name, invalid phone, javascript: URL, and disallowed fields', async () => {
    await expect(
      validateBody(UpdateProfileDto, { full_name: null }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      validateBody(UpdateProfileDto, { full_name: '   ' }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      validateBody(UpdateProfileDto, { phone_number: '123456' }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      validateBody(UpdateProfileDto, { avatar_url: 'javascript:alert(1)' }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      validateBody(UpdateProfileDto, { avatar_url: 'http://example.com/a.jpg' }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      validateBody(UpdateProfileDto, { email: 'hack@test.com' }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      validateBody(UpdateProfileDto, { is_verified: true }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should trim fields, convert empty bio/phone to null, allow null reset, and allow empty body', async () => {
    const empty = await validateBody(UpdateProfileDto, {});
    expect(empty).toEqual({});

    const cleaned = await validateBody(UpdateProfileDto, {
      full_name: '  Nguyen Van A  ',
      bio: '   ',
      phone_number: '  ',
      avatar_url: 'https://res.cloudinary.com/demo/image/upload/v1/avatar.jpg',
    });
    expect(cleaned).toEqual({
      full_name: 'Nguyen Van A',
      bio: null,
      phone_number: null,
      avatar_url: 'https://res.cloudinary.com/demo/image/upload/v1/avatar.jpg',
    });

    const cleared = await validateBody(UpdateProfileDto, {
      phone_number: '+84912345678',
      avatar_url: null,
      bio: null,
    });
    expect(cleared).toEqual({
      phone_number: '+84912345678',
      avatar_url: null,
      bio: null,
    });
  });

  it('should validate ChangePasswordDto without trimming passwords', async () => {
    const valid = await validateBody(ChangePasswordDto, {
      current_password: ' OldPass@1 ',
      new_password: ' NewPass@1 ',
    });
    expect(valid.current_password).toBe(' OldPass@1 ');
    expect(valid.new_password).toBe(' NewPass@1 ');

    await expect(
      validateBody(ChangePasswordDto, {
        current_password: '',
        new_password: 'NewPass@123',
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      validateBody(ChangePasswordDto, {
        current_password: 'OldPass@123',
        new_password: 'Password123',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
