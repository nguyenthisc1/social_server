import {
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { LoginDto, RefreshTokenDto } from 'src/modules/auth/dto/login.dto';
import { CreateUserDto } from 'src/modules/user/dto/create-user.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    email: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(
    @Body() dto: CreateUserDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
    @Headers('device-id') deviceId: string,
  ) {
    return this.authService.register(dto, ip, userAgent, deviceId);
  }

  @Post('login')
  login(
    @Body() dto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
    @Headers('device-id') deviceId: string,
  ) {
    return this.authService.login(
      dto.email,
      dto.password,
      ip,
      userAgent,
      deviceId,
    );
  }

  @Post('refresh')
  refresh(
    @Body() dto: RefreshTokenDto,
    @Headers('device-id') deviceId: string,
  ) {
    return this.authService.refresh(dto, deviceId);
  }

  @Post('logout')
  logout(
    @Request() req,
    @Headers('device-id') deviceId: string,
    @Body() userId: string,
  ) {
    console.log('device: ', deviceId);
    return this.authService.logout(userId, deviceId);
  }

  // @UseGuards(JwtAuthGuard)
  // @Post('logout-all')
  // logoutAllDevices(@Request() req: AuthenticatedRequest) {
  //   return this.authService.logoutAllDevices(req.user.sub);
  // }

  // @UseGuards(JwtAuthGuard)
  // @Get('sessions')
  // getActiveSessions(@Request() req: AuthenticatedRequest) {
  //   return this.authService.getActiveSessions(req.user.sub);
  // }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req: AuthenticatedRequest) {
    return this.authService.getProfile(req.user.sub);
  }
}
