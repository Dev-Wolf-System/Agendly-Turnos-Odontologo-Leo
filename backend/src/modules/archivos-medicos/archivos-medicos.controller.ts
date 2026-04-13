import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Req,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ArchivosMedicosService } from './archivos-medicos.service';
import { CreateArchivoMedicoDto } from './dto/create-archivo-medico.dto';

@Controller('archivos-medicos')
export class ArchivosMedicosController {
  constructor(private readonly archivosMedicosService: ArchivosMedicosService) {}

  @Post()
  @UseInterceptors(FileInterceptor('archivo'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateArchivoMedicoDto,
    @Req() req: any,
  ) {
    return this.archivosMedicosService.upload(
      file,
      req.user.clinicaId,
      dto.paciente_id,
      req.user.userId,
      dto.categoria,
      dto.notas,
    );
  }

  @Get('paciente/:pacienteId')
  async findByPaciente(
    @Param('pacienteId', ParseUUIDPipe) pacienteId: string,
    @Req() req: any,
  ) {
    return this.archivosMedicosService.findByPaciente(
      pacienteId,
      req.user.clinicaId,
    );
  }

  @Get(':id/url')
  async getSignedUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    const url = await this.archivosMedicosService.getSignedUrl(
      id,
      req.user.clinicaId,
    );
    return { url };
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    await this.archivosMedicosService.remove(id, req.user.clinicaId);
    return { message: 'Archivo eliminado' };
  }

  @Post('logo')
  @UseInterceptors(FileInterceptor('logo'))
  async uploadLogo(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const url = await this.archivosMedicosService.uploadLogo(
      file,
      req.user.clinicaId,
    );
    return { url };
  }
}
