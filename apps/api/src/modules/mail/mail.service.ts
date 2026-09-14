import { Injectable, Logger } from "@nestjs/common";
import { createTransport, Transporter } from "nodemailer";
import { PrismaService } from "../../prisma/prisma.service";

const DEFAULT_TEMPLATES: Record<string, { subject: string; htmlBody: string }> = {
  two_factor_code: {
    subject: "Tu código de verificación — {{storeName}}",
    htmlBody: "<p>Hola {{name}},</p><p>Tu código de verificación es: <strong style=\"font-size:22px\">{{code}}</strong></p><p>Vence en 10 minutos. Si no intentaste iniciar sesión, ignora este correo.</p>"
  },
  customer_welcome: {
    subject: "Bienvenido a {{storeName}}",
    htmlBody: "<p>Hola {{name}},</p><p>Tu cuenta fue creada con éxito. Confirma tu correo haciendo clic aquí: <a href=\"{{verifyUrl}}\">Verificar correo</a></p>"
  },
  email_verification: {
    subject: "Verifica tu correo — {{storeName}}",
    htmlBody: "<p>Hola {{name}},</p><p>Confirma tu correo haciendo clic aquí: <a href=\"{{verifyUrl}}\">Verificar correo</a></p>"
  },
  password_reset: {
    subject: "Recupera tu contraseña — {{storeName}}",
    htmlBody: "<p>Hola {{name}},</p><p>Para restablecer tu contraseña haz clic aquí: <a href=\"{{resetUrl}}\">Restablecer contraseña</a></p><p>El enlace vence en 1 hora.</p>"
  },
  order_confirmation: {
    subject: "Pedido {{orderNumber}} confirmado — {{storeName}}",
    htmlBody: "<p>Hola {{name}},</p><p>Recibimos tu pedido <strong>{{orderNumber}}</strong> por un total de <strong>{{total}}</strong>.</p>{{itemsHtml}}<p>Te avisaremos cuando sea despachado.</p>"
  },
  order_shipped: {
    subject: "Pedido {{orderNumber}} despachado — {{storeName}}",
    htmlBody: "<p>Hola {{name}},</p><p>Tu pedido <strong>{{orderNumber}}</strong> fue despachado con {{carrier}}.</p><p>Número de guía: <strong>{{trackingNumber}}</strong></p>"
  },
  order_status_changed: {
    subject: "Actualización de tu pedido {{orderNumber}} — {{storeName}}",
    htmlBody: "<p>Hola {{name}},</p><p>Tu pedido <strong>{{orderNumber}}</strong> cambió de estado a: <strong>{{status}}</strong>.</p>"
  },
  back_in_stock: {
    subject: "¡{{productName}} está disponible de nuevo! — {{storeName}}",
    htmlBody: "<p>¡Buenas noticias!</p><p><strong>{{productName}}</strong> volvió a estar disponible en nuestra tienda.</p><p><a href=\"{{productUrl}}\">Compra ahora antes de que se agote de nuevo</a></p>"
  }
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly prisma: PrismaService) {}

  private getTransporter(): Transporter | null {
    if (this.transporter) return this.transporter;

    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const password = process.env.SMTP_PASSWORD;
    if (!host || !user || !password) return null;

    this.transporter = createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 465),
      secure: (process.env.SMTP_SECURE ?? "true") === "true",
      auth: { user, pass: password }
    });
    return this.transporter;
  }

  async sendTemplate(templateKey: string, to: string, variables: Record<string, string>): Promise<boolean> {
    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.warn(`SMTP no configurado; correo "${templateKey}" a ${to} omitido`);
      return false;
    }

    const stored = await this.prisma.emailTemplate.findFirst({ where: { key: templateKey, isActive: true } });
    const fallback = DEFAULT_TEMPLATES[templateKey];
    const template = stored ?? fallback;
    if (!template) {
      this.logger.warn(`Plantilla de correo desconocida: ${templateKey}`);
      return false;
    }

    const storeName = process.env.MAIL_FROM_NAME ?? "Limpiarte";
    const allVariables: Record<string, string> = { storeName, ...variables };

    const subject = this.render(template.subject, allVariables);
    const html = this.render(template.htmlBody, allVariables);

    try {
      await transporter.sendMail({
        from: `"${storeName}" <${process.env.MAIL_FROM_ADDRESS ?? process.env.SMTP_USER}>`,
        to,
        subject,
        html
      });
      return true;
    } catch (error) {
      this.logger.error(`Fallo enviando correo "${templateKey}" a ${to}`, error instanceof Error ? error.stack : String(error));
      return false;
    }
  }

  private render(template: string, variables: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => variables[key] ?? "");
  }
}
