import { Controller, Get } from "@nestjs/common";
import {
  HealthResponse,
  HealthService,
  ReadinessResponse,
} from "./health.service";

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getHealth(): HealthResponse {
    return this.healthService.getHealth();
  }

  @Get("live")
  getLiveness(): HealthResponse {
    return this.healthService.getHealth();
  }

  @Get("ready")
  getReadiness(): Promise<ReadinessResponse> {
    return this.healthService.getReadiness();
  }
}
