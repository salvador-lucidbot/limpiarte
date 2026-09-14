import "dotenv/config";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { resolveUploadsDirectory } from "./modules/uploads/upload-storage.service";

const PRODUCTION_REQUIRED = ["DATABASE_URL", "JWT_SECRET", "ENCRYPTION_KEY", "CORS_ORIGINS", "PUBLIC_BASE_URL", "STOREFRONT_URL"];
const INSECURE_DEFAULTS = ["development-only-jwt-secret", "development-only-encryption-key", "change-me", "32-characters-random-key-change!"];

function assertProductionEnv(): void {
  if (process.env.NODE_ENV !== "production") return;

  const missing = PRODUCTION_REQUIRED.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Faltan variables de entorno obligatorias en produccion: ${missing.join(", ")}`);
  }

  const insecure = PRODUCTION_REQUIRED.filter((name) => INSECURE_DEFAULTS.includes(process.env[name] ?? ""));
  if (insecure.length > 0) {
    throw new Error(`Estas variables conservan el valor de ejemplo y deben cambiarse: ${insecure.join(", ")}`);
  }

  if ((process.env.JWT_SECRET ?? "").length < 32) {
    throw new Error("JWT_SECRET debe tener al menos 32 caracteres en produccion");
  }
  if ((process.env.ENCRYPTION_KEY ?? "").length < 32) {
    throw new Error("ENCRYPTION_KEY debe tener al menos 32 caracteres en produccion");
  }
}

async function bootstrap(): Promise<void> {
  assertProductionEnv();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });

  app.use(helmet());
  app.setGlobalPrefix("api/v1");
  app.enableCors({
    origin: (process.env.CORS_ORIGINS ?? "http://localhost:3000").split(",").map((origin) => origin.trim()),
    credentials: true
  });

  app.useStaticAssets(resolveUploadsDirectory(), {
    prefix: "/uploads",
    index: false,
    redirect: false,
    maxAge: "30d",
    setHeaders: (response) => {
      response.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      response.setHeader("X-Content-Type-Options", "nosniff");
    }
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: false }
    })
  );

  if (process.env.NODE_ENV !== "production") {
    const config = new DocumentBuilder()
      .setTitle("Limpiarte E-commerce API")
      .setDescription("API de la plataforma de comercio electrónico de Limpiarte")
      .setVersion("1.0")
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("docs", app, document);
  }

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
}

void bootstrap();
