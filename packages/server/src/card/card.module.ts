import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { CardEntity, CardSchema } from './card.schema.js'
import { CardService } from './card.service.js'
import { CardController } from './card.controller.js'

@Module({
  imports: [MongooseModule.forFeature([{ name: CardEntity.name, schema: CardSchema }])],
  controllers: [CardController],
  providers: [CardService],
  exports: [CardService],
})
export class CardModule {}
