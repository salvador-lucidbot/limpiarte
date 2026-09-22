import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";

function buildAdapter(): PrismaMariaDb {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not defined");

  const parsed = new URL(url);
  return new PrismaMariaDb(
    {
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : 3306,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\//, ""),
      connectionLimit: 10
    },
    // Con el protocolo binario el driver declara los parámetros de texto como utf8mb4_bin
    // y MySQL rechaza cualquier LIKE contra columnas utf8mb4_unicode_ci con el error 1267
    // ("Illegal mix of collations"), lo que tumbaba la búsqueda del catálogo.
    { useTextProtocol: true }
  );
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({ adapter: buildAdapter() });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
