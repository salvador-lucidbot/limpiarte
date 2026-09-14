import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { IsIn, IsString } from "class-validator";
import { Public } from "../../common/decorators/public.decorator";
import { PaymentStatus } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { WompiGateway } from "../payments/wompi.gateway";
import { OrdersService } from "./orders.service";

class SimulatePaymentDto {
  @IsString()
  reference!: string;

  @IsIn(["APPROVED", "DECLINED"])
  outcome!: "APPROVED" | "DECLINED";
}

interface SimulationSummary {
  orderNumber: string;
  customerName: string;
  email: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  simulated: boolean;
}

@Public()
@Controller("payments/wompi")
export class PaymentsSimulationController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wompiGateway: WompiGateway,
    private readonly ordersService: OrdersService
  ) {}

  @Get("simulation/:reference")
  async summary(@Param("reference") reference: string): Promise<SimulationSummary> {
    this.assertSimulationEnabled();

    const payment = await this.prisma.payment.findFirst({
      where: { externalId: reference, gateway: "wompi" },
      include: { order: true }
    });
    if (!payment) throw new NotFoundException("Referencia de pago no encontrada");

    return {
      orderNumber: payment.order.orderNumber,
      customerName: payment.order.customerName,
      email: payment.order.email,
      amount: Number(payment.amount),
      currency: payment.currency,
      status: payment.status,
      simulated: true
    };
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("simulation")
  async simulate(@Body() dto: SimulatePaymentDto): Promise<{ status: PaymentStatus }> {
    this.assertSimulationEnabled();

    const payment = await this.prisma.payment.findFirst({
      where: { externalId: dto.reference, gateway: "wompi" }
    });
    if (!payment) throw new NotFoundException("Referencia de pago no encontrada");
    if (payment.status === PaymentStatus.APPROVED) return { status: payment.status };

    if (dto.outcome === "APPROVED") {
      await this.ordersService.confirmPaymentByExternalId(dto.reference, { simulated: true, gateway: "wompi" });
      return { status: PaymentStatus.APPROVED };
    }

    await this.ordersService.failPaymentByExternalId(dto.reference, "Pago rechazado (simulación)", {
      simulated: true,
      gateway: "wompi"
    });
    return { status: PaymentStatus.REJECTED };
  }

  private assertSimulationEnabled(): void {
    if (!this.wompiGateway.simulationEnabled()) {
      throw new BadRequestException("La simulación de pagos está deshabilitada");
    }
  }
}
