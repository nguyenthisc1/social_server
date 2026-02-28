/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model, Types } from 'mongoose';
import { CreateUserDto } from 'src/modules/user/dto/create-user.dto';
import { UserService } from '../user/user.service';
import { RefreshTokenDto } from './dto/login.dto';
import { RefreshToken } from './schema/refresh-token.schema';

@Injectable()
export class AuthService {
  private readonly jwtAccessSecret: string;
  private readonly jwtRefreshSecret: string;
  private readonly jwtAccessExpires: string | number;
  private readonly jwtRefreshExpires: string | number;

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshToken>,
    private configService: ConfigService,
  ) {
    // Fetch environment variables for secrets and expiration times
    this.jwtAccessSecret = this.configService.get('JWT_ACCESS_SECRET')!;
    this.jwtRefreshSecret = this.configService.get('JWT_REFRESH_SECRET')!;
    this.jwtAccessExpires =
      this.configService.get('JWT_ACCESS_EXPIRES') || '15m';
    this.jwtRefreshExpires =
      this.configService.get('JWT_REFRESH_EXPIRES') || '7d';
  }

  async register(
    dto: CreateUserDto,
    ip: string,
    userAgent: string,
    deviceId: string,
  ) {
    if (!deviceId) {
      throw new UnauthorizedException(
        'Device ID is required for registration.',
      );
    }

    console.log(deviceId);

    const existingUser = await this.userService.findByEmail(dto.email);
    if (existingUser.data) {
      throw new UnauthorizedException('Email is already registered.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.userService.create({
      ...dto,
      password: hashedPassword,
    });

    if (!user) {
      throw new UnauthorizedException('Registration failed.');
    }

    const payload = { sub: user._id.toString(), email: user.email };
    const jwtAccessOptions: JwtSignOptions = {
      expiresIn: this.jwtAccessExpires as any,
      secret: this.jwtAccessSecret,
    };
    const jwtRefreshOptions: JwtSignOptions = {
      expiresIn: this.jwtRefreshExpires as any,
      secret: this.jwtRefreshSecret,
    };

    // Issue tokens
    const accessToken = this.jwtService.sign(payload, jwtAccessOptions);
    const refreshToken = this.jwtService.sign(payload, jwtRefreshOptions);

    // Always delete previous tokens for this user-device pair
    await this.refreshTokenModel.deleteMany({
      userId: user._id,
      deviceId: deviceId,
    });

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await this.refreshTokenModel.create({
      userId: user._id,
      tokenHash: hashedRefreshToken,
      deviceId,
      ip,
      userAgent,
      expiresAt: new Date(
        Date.now() + this.parseExpireToMs(this.jwtRefreshExpires),
      ),
    });

    return {
      success: true,
      message: 'User registered successfully.',
      data: {
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: new Date(
            Date.now() + this.parseExpireToMs(this.jwtAccessExpires),
          ).toISOString(),
          token_type: 'Bearer',
        },
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
        },
      },
    };
  }

  async login(
    email: string,
    password: string,
    ip: string,
    userAgent: string,
    deviceId: string,
  ) {
    if (!deviceId)
      throw new UnauthorizedException('Device ID is required for login.');

    const user = await this.userService['userModel'].findOne({ email });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user._id.toString(), email: user.email };
    const jwtAccessOptions: JwtSignOptions = {
      expiresIn: this.jwtAccessExpires as any,
      secret: this.jwtAccessSecret,
    };
    const jwtRefreshOptions: JwtSignOptions = {
      expiresIn: this.jwtRefreshExpires as any,
      secret: this.jwtRefreshSecret,
    };

    // Issue tokens
    const accessToken = this.jwtService.sign(payload, jwtAccessOptions);
    const refreshToken = this.jwtService.sign(payload, jwtRefreshOptions);

    await this.refreshTokenModel.deleteMany({
      userId: user._id,
      deviceId: deviceId,
    });

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await this.refreshTokenModel.create({
      userId: user._id,
      tokenHash: hashedRefreshToken,
      deviceId,
      ip,
      userAgent,
      expiresAt: new Date(
        Date.now() + this.parseExpireToMs(this.jwtRefreshExpires),
      ),
    });

    return {
      success: true,
      message: 'Login successful.',
      data: {
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: new Date(
            Date.now() + this.parseExpireToMs(this.jwtAccessExpires),
          ).toISOString(),
          token_type: 'Bearer',
        },
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
        },
      },
    };
  }

  async refresh(dto: RefreshTokenDto, deviceId: string) {
    if (!deviceId) {
      throw new UnauthorizedException('Device ID is required for refresh.');
    }

    try {
      // Verify the refresh token
      const decoded = this.jwtService.verify<{
        sub: string;
        email: string;
      }>(dto.refreshToken, { secret: this.jwtRefreshSecret });

      // Validate decoded.sub is a proper ObjectId, or throw
      let userObjectId: Types.ObjectId;
      try {
        userObjectId = new Types.ObjectId(decoded.sub);
      } catch (e) {
        // If not a valid ObjectId, reject for security
        throw new UnauthorizedException('Invalid refresh token', e);
      }

      // Find refresh token for the correct user + deviceId pair
      const refreshTokenDoc = await this.refreshTokenModel.findOne({
        userId: userObjectId,
        deviceId,
      });

      if (!refreshTokenDoc) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Verify the refresh token matches the one stored in database (hashed)
      const isRefreshTokenValid = await bcrypt.compare(
        dto.refreshToken,
        refreshTokenDoc.tokenHash,
      );

      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Retrieve user details
      const user = await this.userService['userModel'].findById(userObjectId);
      if (!user) {
        throw new UnauthorizedException('User not found.');
      }

      // Generate new tokens
      const payload = { sub: user._id.toString(), email: user.email };
      const jwtAccessOptions: JwtSignOptions = {
        expiresIn: this.jwtAccessExpires as any,
        secret: this.jwtAccessSecret,
      };
      const jwtRefreshOptions: JwtSignOptions = {
        expiresIn: this.jwtRefreshExpires as any,
        secret: this.jwtRefreshSecret,
      };
      const newAccessToken = this.jwtService.sign(payload, jwtAccessOptions);
      const newRefreshToken = this.jwtService.sign(payload, jwtRefreshOptions);

      // Ensure only one refresh token for this user-device
      await this.refreshTokenModel.deleteMany({
        userId: user._id,
        deviceId: deviceId,
        _id: { $ne: refreshTokenDoc._id },
      });

      // Update refresh token in database (token rotation for security)
      const hashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);
      refreshTokenDoc.tokenHash = hashedRefreshToken;
      refreshTokenDoc.expiresAt = new Date(
        Date.now() + this.parseExpireToMs(this.jwtRefreshExpires),
      );
      await refreshTokenDoc.save();

      const expiresAt = new Date(
        Date.now() + this.parseExpireToMs(this.jwtAccessExpires),
      );
      const tokenType = 'Bearer';

      return {
        success: true,
        message: 'Token refreshed successfully.',
        data: {
          tokens: {
            access_token: newAccessToken,
            refresh_token: newRefreshToken,
            expires_at: expiresAt.toISOString(),
            token_type: tokenType,
          },
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            avatarUrl: user.avatarUrl,
          },
        },
      };
    } catch (err) {
      // If the error is a CastError or BSONError, treat as Unauthorized
      if (
        err?.name === 'CastError' ||
        err?.name === 'BSONError' ||
        err?.message?.toString().includes('ObjectId') ||
        err?.message
          ?.toString()
          .includes('input must be a 24 character hex string')
      ) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string, deviceId: string) {
    if (deviceId) {
      await this.refreshTokenModel.deleteMany({ userId, deviceId });
    } else {
      await this.refreshTokenModel.deleteMany({ userId });
    }

    return {
      success: true,
      message: 'Logged out successfully.',
    };
  }

  async getProfile(userId: string) {
    const user = await this.userService['userModel']
      .findById(userId)
      .select('-password')
      .lean<{
        _id: string;
        username: string;
        email: string;
        avatarUrl?: string;
        bio?: string;
        isActive: boolean;
        createdAt?: Date;
        updatedAt?: Date;
      }>();

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      success: true,
      message: 'Profile fetched successfully.',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    };
  }

  /**
   * Helper to convert duration string to ms.
   * Supports 'Nd', 'Nh', 'Nm', 'Ns' and plain ms number
   */
  private parseExpireToMs(duration: string | number): number {
    if (!duration) return 0;
    if (typeof duration === 'number') return duration;
    const match = /^(\d+)([dhms])$/.exec(duration);
    if (!match) return parseInt(duration, 10);
    const num = parseInt(match[1], 10);
    switch (match[2]) {
      case 'd':
        return num * 24 * 60 * 60 * 1000;
      case 'h':
        return num * 60 * 60 * 1000;
      case 'm':
        return num * 60 * 1000;
      case 's':
        return num * 1000;
      default:
        return parseInt(duration, 10);
    }
  }
}
