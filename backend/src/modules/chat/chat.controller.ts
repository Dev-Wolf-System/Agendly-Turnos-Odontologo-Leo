import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Patch,
  Delete,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { CurrentUser, CurrentClinica, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('messages')
  sendMessage(
    @CurrentClinica() clinicaId: string,
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateMessageDto,
  ) {
    return this.chatService.sendMessage(clinicaId, user.userId, dto);
  }

  @Get('messages')
  getMessages(
    @CurrentClinica() clinicaId: string,
    @CurrentUser() user: { userId: string },
    @Query('with') otherUserId?: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    return this.chatService.getMessages(
      clinicaId,
      user.userId,
      otherUserId,
      limit ? parseInt(limit, 10) : 50,
      before,
    );
  }

  @Patch('messages/read')
  markAsRead(
    @CurrentClinica() clinicaId: string,
    @CurrentUser() user: { userId: string },
    @Body('messageIds') messageIds: string[],
  ) {
    return this.chatService.markAsRead(clinicaId, user.userId, messageIds);
  }

  @Get('unread-count')
  getUnreadCount(
    @CurrentClinica() clinicaId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.chatService.getUnreadCount(clinicaId, user.userId);
  }

  @Get('users')
  getClinicUsers(@CurrentClinica() clinicaId: string) {
    return this.chatService.getClinicUsers(clinicaId);
  }

  @Get('unread-per-user')
  getUnreadPerUser(
    @CurrentClinica() clinicaId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.chatService.getUnreadPerUser(clinicaId, user.userId);
  }

  @Delete('messages')
  @Roles(UserRole.ADMIN)
  clearChat(
    @CurrentClinica() clinicaId: string,
    @Query('with') otherUserId?: string,
  ) {
    return this.chatService.clearChat(clinicaId, otherUserId);
  }
}
