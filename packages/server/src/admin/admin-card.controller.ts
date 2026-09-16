import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import type { ApiResponse, Card, CardStatus } from '@webstore/shared'
import { ApiKeyGuard } from '../apikey/api-key.guard.js'
import { RequireScopes } from '../apikey/require-scopes.decorator.js'
import { CardService } from '../card/card.service.js'

interface ImportCardBody {
  productId?: string
  secrets?: string[]
}

interface ClearCardBody {
  productId?: string
  status?: CardStatus
}

@Controller('admin/cards')
@UseGuards(ApiKeyGuard)
export class AdminCardController {
  constructor(private readonly cardService: CardService) {}

  @Get()
  @RequireScopes('card:read')
  async list(@Query('productId') productId?: string): Promise<ApiResponse<Card[]>> {
    if (!productId?.trim()) throw new BadRequestException('缺少 productId 查询参数')
    const data = await this.cardService.listByProduct(productId.trim())
    return { code: 200, message: 'ok', data }
  }

  @Get('stock')
  @RequireScopes('card:read')
  async stock(@Query('productId') productId?: string): Promise<ApiResponse<{ stock: number }>> {
    if (!productId?.trim()) throw new BadRequestException('缺少 productId 查询参数')
    const stock = await this.cardService.countStock(productId.trim())
    return { code: 200, message: 'ok', data: { stock } }
  }

  @Post()
  @RequireScopes('card:import')
  async import(@Body() body: ImportCardBody): Promise<ApiResponse<{ imported: number }>> {
    if (!body.productId?.trim()) throw new BadRequestException('缺少 productId')
    const secrets = (body.secrets ?? []).map((s) => s.trim()).filter(Boolean)
    if (secrets.length === 0) throw new BadRequestException('secrets 不能为空')
    const imported = await this.cardService.addCards(body.productId.trim(), secrets)
    return { code: 200, message: 'ok', data: { imported } }
  }

  @Delete(':id')
  @RequireScopes('card:delete')
  async remove(@Param('id') id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    const deleted = await this.cardService.deleteCard(id)
    return { code: 200, message: 'ok', data: { deleted } }
  }

  @Post('clear')
  @RequireScopes('card:delete')
  async clear(@Body() body: ClearCardBody): Promise<ApiResponse<{ deleted: number }>> {
    if (!body.productId?.trim()) throw new BadRequestException('缺少 productId')
    if (body.status !== undefined && body.status !== 'unsold' && body.status !== 'sold') {
      throw new BadRequestException('status 只能为 unsold 或 sold')
    }
    const deleted = await this.cardService.deleteByProduct(body.productId.trim(), body.status)
    return { code: 200, message: 'ok', data: { deleted } }
  }
}
