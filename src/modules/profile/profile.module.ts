import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from '../access/models/user.entity'
import { ProfileService } from './services/v1/ProfileService'
import { ProfileWebController } from './controllers/web/v1/ProfileWebController'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    AuthModule,
  ],
  controllers: [ProfileWebController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
