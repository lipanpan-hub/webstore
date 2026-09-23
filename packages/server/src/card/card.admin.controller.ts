import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import type { ApiResponse, AdminAddCardsInput, Card, CardStatus } from '@webstore/shared'
import { CardService } from './card.service.js'
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js'
import { PermissionsGuard } from '../auth/permissions.guard.js'
import { RequirePermissions } from '../auth/require-permissions.decorator.js'
import { PERMISSIONS } from '../auth/permissions.js'

// 卡密管理接口：受 card 读/写权限保护
@Controller('admin/cards')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CardAdminController {
  constructor(private readonly cardService: CardService) {}

  @Get('product/:productId')
  @RequirePermissions(PERMISSIONS.CARD_READ)
  async listByProduct(@Param('productId') productId: string): Promise<ApiResponse<Card[]>> {
    const data = await this.cardService.listByProduct(productId)
    return { code: 200, message: 'ok', data }
  }

  @Get('stock/:productId')
  @RequirePermissions(PERMISSIONS.CARD_READ)
  async stock(
    @Param('productId') productId: string,
  ): Promise<ApiResponse<{ productId: string; stock: number }>> {
    const stock = await this.cardService.countStock(productId)
    return { code: 200, message: 'ok', data: { productId, stock } }
  }

  @Post()
  @RequirePermissions(PERMISSIONS.CARD_WRITE)
  async add(@Body() body: AdminAddCardsInput): Promise<ApiResponse<{ count: number }>> {
    const count = await this.cardService.addCards(body.productId, body.secrets)
    return { code: 200, message: 'ok', data: { count } }
  }

  // 批量删除某商品卡密：status 缺省删全部（放在 :id 之前以免被通配匹配）
  @Delete('product/:productId')
  @RequirePermissions(PERMISSIONS.CARD_WRITE)
  async clear(
    @Param('productId') productId: string,
    @Query('status') status?: CardStatus,
  ): Promise<ApiResponse<{ count: number }>> {
    const count = await this.cardService.deleteByProduct(productId, status)
    return { code: 200, message: 'ok', data: { count } }
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.CARD_WRITE)
  async remove(@Param('id') id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    const deleted = await this.cardService.deleteCard(id)
    return { code: 200, message: 'ok', data: { deleted } }
  }
}
