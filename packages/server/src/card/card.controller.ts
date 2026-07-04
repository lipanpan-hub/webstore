import { Controller, Get, Param } from '@nestjs/common'
import type { ApiResponse } from '@webstore/shared'
import { CardService } from './card.service.js'

@Controller('cards')
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Get('stock/:productId')
  async stock(@Param('productId') productId: string): Promise<ApiResponse<{ productId: string; stock: number }>> {
    const stock = await this.cardService.countStock(productId)
    return { code: 200, message: 'ok', data: { productId, stock } }
  }
}
