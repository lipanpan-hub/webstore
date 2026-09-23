import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { CardEntity, CardSchema } from './card.schema.js'
import { CardService } from './card.service.js'
import { CardController } from './card.controller.js'
import { CardAdminController } from './card.admin.controller.js'
import { AuthModule } from '../auth/auth.module.js'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CardEntity.name, schema: CardSchema }]),
    AuthModule,
  ],
  controllers: [CardController, CardAdminController],
  providers: [CardService],
  exports: [CardService],
})
export class CardModule {}
