import { Injectable } from "@nestjs/common";

export interface AppStatusResponse {
  service: "Expense Tracker & Budget Manager API";
  status: "ok";
}

@Injectable()
export class AppService {
  getStatus(): AppStatusResponse {
    return {
      service: "Expense Tracker & Budget Manager API",
      status: "ok",
    };
  }
}
