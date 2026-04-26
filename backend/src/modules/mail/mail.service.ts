import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface BienvenidaData {
  nombre: string;
  apellido: string;
  email: string;
  nombre_clinica: string;
  nombre_plan: string;
  fecha_inicio: string;
  fecha_vencimiento: string;
  dias_restantes: number;
  app_url: string;
}

export interface ResetPasswordData {
  nombre: string;
  email: string;
  reset_url: string;
  app_url: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn('RESEND_API_KEY no configurado — emails deshabilitados');
    }
  }

  private get from(): string {
    return (
      this.configService.get<string>('MAIL_FROM') ??
      'Avax Health <no-reply@avaxhealth.com>'
    );
  }

  async sendBienvenida(data: BienvenidaData): Promise<void> {
    if (!this.resend) return;
    const { error } = await this.resend.emails.send({
      from: this.from,
      to: data.email,
      subject: `¡Bienvenido a Avax Health, ${data.nombre_clinica}!`,
      html: this.templateBienvenida(data),
    });
    if (error) {
      this.logger.warn(`Error enviando bienvenida a ${data.email}: ${JSON.stringify(error)}`);
    }
  }

  async sendResetPassword(data: ResetPasswordData): Promise<void> {
    if (!this.resend) return;
    const { error } = await this.resend.emails.send({
      from: this.from,
      to: data.email,
      subject: 'Restablecer contraseña — Avax Health',
      html: this.templateResetPassword(data),
    });
    if (error) {
      this.logger.warn(`Error enviando reset password a ${data.email}: ${JSON.stringify(error)}`);
    }
  }

  // ── Templates ──────────────────────────────────────────────────────────────

  private templateBienvenida(data: BienvenidaData): string {
    const {
      nombre,
      apellido,
      nombre_clinica,
      nombre_plan,
      fecha_inicio,
      fecha_vencimiento,
      dias_restantes,
      app_url,
    } = data;

    const link_dashboard = `${app_url}/dashboard`;
    const link_configuracion = `${app_url}/dashboard/configuracion`;
    const link_profesionales = `${app_url}/dashboard/configuracion`;
    const link_nuevo_turno = `${app_url}/dashboard/turnos`;
    const link_soporte = `${app_url}/dashboard/soporte`;
    const link_cancelar = `${app_url}/dashboard/suscripcion`;
    const link_privacidad = `${app_url}/privacidad`;
    const link_terminos = `${app_url}/terminos`;

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bienvenido a Avax Health</title>
</head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:'Inter',Arial,sans-serif;">

  <span style="display:none;max-height:0;overflow:hidden;">Tu trial está activo — conocé qué hacer primero en Avax Health.</span>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #E2E8F0;box-shadow:0 8px 32px rgba(15,23,42,0.08);">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#0EA5E9 0%,#0369A1 100%);padding:36px 40px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-left:0;vertical-align:middle;">
                    <p style="margin:0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.65);font-weight:500;">Avax Health</p>
                    <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.2;">Bienvenido al sistema 👋</p>
                  </td>
                </tr>
              </table>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:20px;">
                <tr>
                  <td style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);border-radius:100px;padding:5px 14px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:8px;height:8px;border-radius:50%;background:#10B981;box-shadow:0 0 8px #10B981;" width="8"></td>
                        <td style="padding-left:8px;font-size:12px;color:rgba(255,255,255,0.9);font-weight:500;">Trial activo · Vence el <strong style="color:#ffffff;">${fecha_vencimiento}</strong> · ${dias_restantes} días restantes</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- SALUDO -->
          <tr>
            <td style="padding:32px 40px 0;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#0F172A;line-height:1.3;">
                Hola, <span style="color:#0EA5E9;">${nombre} ${apellido}</span> 👋
              </p>
              <p style="margin:12px 0 0;font-size:15px;color:#334155;line-height:1.7;">
                Tu cuenta en <strong>${nombre_clinica}</strong> ya está activa. Empezaste tu período de prueba el <strong>${fecha_inicio}</strong> y tenés <strong>${dias_restantes} días</strong> para explorar todo lo que Avax Health tiene para ofrecerte.
              </p>
              <p style="margin:10px 0 0;font-size:15px;color:#334155;line-height:1.7;">
                Este no es solo un "gracias por registrarte" — queremos que desde hoy sepas exactamente qué hacer para sacarle el máximo provecho.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:28px 40px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#0EA5E9,#0369A1);border-radius:10px;box-shadow:0 4px 20px rgba(14,165,233,0.35);">
                    <a href="${link_dashboard}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.02em;">
                      Ir al dashboard →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- DIVIDER -->
          <tr><td style="padding:28px 40px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #E2E8F0;"></td></tr></table></td></tr>

          <!-- PRIMEROS PASOS -->
          <tr>
            <td style="padding:24px 40px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:6px;height:6px;border-radius:50%;background:#0F172A;vertical-align:middle;" width="6"></td>
                  <td style="padding-left:10px;font-size:13px;font-weight:700;color:#0F172A;text-transform:uppercase;letter-spacing:0.1em;vertical-align:middle;">Primeros pasos</td>
                </tr>
              </table>

              <!-- Paso 1 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="padding:0 0 0 4px;width:4px;background:linear-gradient(135deg,#0EA5E9,#0369A1);border-radius:12px 0 0 12px;" width="4"></td>
                  <td style="padding:16px 20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="vertical-align:top;width:28px;">
                          <div style="width:28px;height:28px;background:#EFF6FF;border:1px solid #BAE6FD;border-radius:50%;text-align:center;line-height:28px;font-size:12px;font-weight:700;color:#0369A1;">1</div>
                        </td>
                        <td style="padding-left:14px;vertical-align:top;">
                          <p style="margin:0;font-size:14px;font-weight:600;color:#0F172A;">Completar la configuración de la clínica</p>
                          <p style="margin:4px 0 0;font-size:13px;color:#64748B;line-height:1.55;">Cargá los datos de tu clínica: nombre, dirección, horarios de atención y logo. Solo toma unos minutos.</p>
                          <a href="${link_configuracion}" style="display:inline-block;margin-top:10px;font-size:12px;font-weight:600;color:#0EA5E9;text-decoration:none;">Ir a configuración →</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Paso 2 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="padding:0 0 0 4px;width:4px;background:linear-gradient(135deg,#10B981,#059669);border-radius:12px 0 0 12px;" width="4"></td>
                  <td style="padding:16px 20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="vertical-align:top;width:28px;">
                          <div style="width:28px;height:28px;background:#ECFDF5;border:1px solid #6EE7B7;border-radius:50%;text-align:center;line-height:28px;font-size:12px;font-weight:700;color:#059669;">2</div>
                        </td>
                        <td style="padding-left:14px;vertical-align:top;">
                          <p style="margin:0;font-size:14px;font-weight:600;color:#0F172A;">Agregar profesionales del equipo</p>
                          <p style="margin:4px 0 0;font-size:13px;color:#64748B;line-height:1.55;">Invitá a los médicos y administrativos de tu equipo para que puedan gestionar turnos y pacientes desde sus cuentas.</p>
                          <a href="${link_profesionales}" style="display:inline-block;margin-top:10px;font-size:12px;font-weight:600;color:#10B981;text-decoration:none;">Agregar profesionales →</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Paso 3 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="padding:0 0 0 4px;width:4px;background:linear-gradient(135deg,#F59E0B,#D97706);border-radius:12px 0 0 12px;" width="4"></td>
                  <td style="padding:16px 20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="vertical-align:top;width:28px;">
                          <div style="width:28px;height:28px;background:#FFFBEB;border:1px solid #FCD34D;border-radius:50%;text-align:center;line-height:28px;font-size:12px;font-weight:700;color:#D97706;">3</div>
                        </td>
                        <td style="padding-left:14px;vertical-align:top;">
                          <p style="margin:0;font-size:14px;font-weight:600;color:#0F172A;">Crear el primer turno</p>
                          <p style="margin:4px 0 0;font-size:13px;color:#64748B;line-height:1.55;">Con todo listo, agendá tu primer turno. Podés hacerlo manualmente o compartir el link de reserva online con tus pacientes.</p>
                          <a href="${link_nuevo_turno}" style="display:inline-block;margin-top:10px;font-size:12px;font-weight:600;color:#D97706;text-decoration:none;">Crear primer turno →</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- DIVIDER -->
          <tr><td style="padding:28px 40px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #E2E8F0;"></td></tr></table></td></tr>

          <!-- INFO TRIAL -->
          <tr>
            <td style="padding:20px 40px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#EFF6FF,#ECFDF5);border:1px solid #BAE6FD;border-radius:12px;border-left:4px solid #0EA5E9;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-size:13px;font-weight:700;color:#0F172A;">📅 Resumen de tu plan</p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;">
                      <tr>
                        <td style="font-size:13px;color:#334155;padding:4px 0;">Plan</td>
                        <td align="right" style="font-size:13px;font-weight:600;color:#0F172A;padding:4px 0;">${nombre_plan}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#334155;border-top:1px solid rgba(14,165,233,0.15);padding:6px 0 0;">Inicio del trial</td>
                        <td align="right" style="font-size:13px;font-weight:600;color:#0F172A;border-top:1px solid rgba(14,165,233,0.15);padding:6px 0 0;">${fecha_inicio}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#334155;border-top:1px solid rgba(14,165,233,0.15);padding:6px 0 0;">Vencimiento</td>
                        <td align="right" style="font-size:13px;font-weight:600;color:#0F172A;border-top:1px solid rgba(14,165,233,0.15);padding:6px 0 0;">${fecha_vencimiento}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#334155;border-top:1px solid rgba(14,165,233,0.15);padding:6px 0 0;">Días restantes</td>
                        <td align="right" style="border-top:1px solid rgba(14,165,233,0.15);padding:6px 0 0;">
                          <span style="display:inline-block;background:#ECFDF5;border:1px solid #6EE7B7;border-radius:100px;padding:2px 10px;font-size:12px;font-weight:700;color:#059669;">${dias_restantes} días</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:28px 40px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top:1px solid #E2E8F0;padding-top:24px;">
                    <p style="margin:0;font-size:13px;color:#64748B;line-height:1.65;">
                      ¿Tenés dudas o necesitás ayuda? Escribinos a
                      <a href="mailto:soporte@avaxhealth.com" style="color:#0EA5E9;text-decoration:none;font-weight:500;">soporte@avaxhealth.com</a>
                      o visitá nuestro <a href="${link_soporte}" style="color:#0EA5E9;text-decoration:none;font-weight:500;">centro de ayuda</a>.
                    </p>
                    <p style="margin:14px 0 0;font-size:12px;color:#94A3B8;line-height:1.6;">
                      Recibiste este email porque creaste una cuenta en Avax Health.<br />
                      <a href="${link_cancelar}" style="color:#94A3B8;text-decoration:underline;">Cancelar suscripción</a>
                      &nbsp;·&nbsp;
                      <a href="${link_privacidad}" style="color:#94A3B8;text-decoration:underline;">Política de privacidad</a>
                      &nbsp;·&nbsp;
                      <a href="${link_terminos}" style="color:#94A3B8;text-decoration:underline;">Términos de uso</a>
                    </p>
                    <p style="margin:18px 0 0;font-size:12px;color:#CBD5E1;">
                      © ${new Date().getFullYear()} <strong style="color:#0EA5E9;">Avax Health</strong> · Todos los derechos reservados.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private templateResetPassword(data: ResetPasswordData): string {
    const { nombre, reset_url, app_url } = data;
    const link_privacidad = `${app_url}/privacidad`;
    const link_terminos = `${app_url}/terminos`;
    const year = new Date().getFullYear();

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Restablecer contraseña – Avax Health</title>
</head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:'Inter',Arial,sans-serif;">

  <span style="display:none;max-height:0;overflow:hidden;">Recibimos una solicitud para restablecer tu contraseña. El link expira en 1 hora.</span>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #E2E8F0;box-shadow:0 8px 32px rgba(15,23,42,0.08);">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#0F172A 0%,#1E293B 100%);padding:32px 40px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-size:11px;letter-spacing:0.13em;text-transform:uppercase;color:rgba(255,255,255,0.45);font-weight:500;">Avax Health</p>
                    <p style="margin:3px 0 0;font-size:18px;font-weight:700;color:#ffffff;line-height:1.2;">Seguridad de cuenta</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ICONO CENTRAL -->
          <tr>
            <td align="center" style="padding:36px 40px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="width:72px;height:72px;background:#EFF6FF;border:2px solid #BAE6FD;border-radius:50%;">
                    <img
                      src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzNiIgaGVpZ2h0PSIzNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwRUE1RTkiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTIgMjJzOC00IDgtMTBWNWwtOC0zLTggM3Y3YzAgNiA4IDEwIDggMTB6Ii8+PC9zdmc+"
                      alt="Seguridad" width="36" height="36" style="display:block;margin:18px auto 0;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- SALUDO Y CUERPO -->
          <tr>
            <td style="padding:20px 40px 0;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#0F172A;line-height:1.3;">
                Hola, <span style="color:#0EA5E9;">${nombre}</span>
              </p>
              <p style="margin:12px 0 0;font-size:15px;color:#334155;line-height:1.75;">
                Recibimos una solicitud para <strong>restablecer la contraseña</strong> asociada a tu cuenta en Avax Health.
              </p>
              <p style="margin:8px 0 0;font-size:15px;color:#334155;line-height:1.75;">
                Si fuiste vos, hacé clic en el botón de abajo para crear una nueva contraseña. Si no realizaste esta solicitud, podés ignorar este email — <strong>tu contraseña no fue modificada</strong>.
              </p>
            </td>
          </tr>

          <!-- CTA BOTÓN -->
          <tr>
            <td align="center" style="padding:28px 40px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#0EA5E9,#0369A1);border-radius:12px;box-shadow:0 4px 20px rgba(14,165,233,0.35);">
                    <a href="${reset_url}" target="_blank" style="display:inline-block;padding:16px 40px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.02em;">
                      🔑 &nbsp;Restablecer contraseña
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- EXPIRACIÓN -->
          <tr>
            <td align="center" style="padding:16px 40px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#FFFBEB;border:1px solid #FCD34D;border-radius:100px;padding:6px 16px;">
                    <p style="margin:0;font-size:12px;font-weight:600;color:#D97706;">
                      ⏱ &nbsp;Este link expira en <strong>1 hora</strong>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- LINK ALTERNATIVO -->
          <tr>
            <td style="padding:20px 40px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;">
                <tr>
                  <td style="padding:14px 16px;">
                    <p style="margin:0;font-size:11px;color:#94A3B8;font-weight:500;text-transform:uppercase;letter-spacing:0.08em;">¿El botón no funciona? Copiá este link:</p>
                    <p style="margin:6px 0 0;font-size:12px;color:#0EA5E9;word-break:break-all;line-height:1.5;">${reset_url}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- AVISO DE SEGURIDAD -->
          <tr>
            <td style="padding:20px 40px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FEF2F2;border:1px solid #FCA5A5;border-radius:10px;border-left:4px solid #EF4444;">
                <tr>
                  <td style="padding:14px 16px;">
                    <p style="margin:0;font-size:13px;font-weight:700;color:#0F172A;">🔒 &nbsp;Aviso de seguridad</p>
                    <p style="margin:6px 0 0;font-size:13px;color:#64748B;line-height:1.6;">
                      Si no solicitaste este cambio, ignorá este email — tu contraseña <strong>no fue modificada</strong> y tu cuenta está segura. Si creés que alguien intentó acceder a tu cuenta, contactanos de inmediato.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- DIVIDER -->
          <tr><td style="padding:28px 40px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #E2E8F0;"></td></tr></table></td></tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:20px 40px 32px;">
              <p style="margin:0;font-size:13px;color:#64748B;line-height:1.65;">
                ¿Necesitás ayuda? Contactanos en
                <a href="mailto:soporte@avaxhealth.com" style="color:#0EA5E9;text-decoration:none;font-weight:500;">soporte@avaxhealth.com</a>
              </p>
              <p style="margin:14px 0 0;font-size:12px;color:#94A3B8;line-height:1.6;">
                Recibiste este email porque se solicitó un restablecimiento de contraseña para tu cuenta.<br />
                <a href="${link_privacidad}" style="color:#94A3B8;text-decoration:underline;">Política de privacidad</a>
                &nbsp;·&nbsp;
                <a href="${link_terminos}" style="color:#94A3B8;text-decoration:underline;">Términos de uso</a>
              </p>
              <p style="margin:18px 0 0;font-size:12px;color:#CBD5E1;">
                © ${year} <strong style="color:#0EA5E9;">Avax Health</strong> · Todos los derechos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}
