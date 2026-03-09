import { Controller, Post, Get, Body, Query, UseGuards, Request, Inject } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  AuthResponseDto,
  ApiErrorDto,
} from '../../common/dto'

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error', type: ApiErrorDto })
  @ApiResponse({ status: 409, description: 'User already exists', type: ApiErrorDto })
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body)
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error', type: ApiErrorDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials', type: ApiErrorDto })
  async login(@Body() body: LoginDto) {
    return this.authService.login(body)
  }

  @Get('dev/login-as')
  @ApiOperation({ summary: '[DEV ONLY] Login as any user without password' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'User not found or not in dev mode', type: ApiErrorDto })
  async loginAs(@Query('email') email?: string, @Query('role') role?: string) {
    return this.authService.loginAs(email, role)
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid refresh token', type: ApiErrorDto })
  async refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refreshToken(body.refreshToken)
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout current user' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: ApiErrorDto })
  async logout(@Request() req: any, @Body() body: RefreshTokenDto) {
    await this.authService.logout(req.user.userId, body.refreshToken)
    return { message: 'Logged out successfully' }
  }
}
