import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { UserEntity, UserSchema } from './user.schema.js'
import { UserService } from './user.service.js'
import { RoleModule } from '../role/role.module.js'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserEntity.name, schema: UserSchema }]),
    RoleModule,
  ],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
