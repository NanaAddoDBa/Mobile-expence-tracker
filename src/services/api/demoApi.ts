import { DemoApi } from "./api.types";
import { demoDataService } from "../demo/demoDataService";

export const demoApi: DemoApi = {
  async loadStarterDemoData() {
    return demoDataService.loadStarterDemoData();
  },

  async resetDemoData() {
    return demoDataService.resetDemoData();
  },

  async clearDemoData() {
    demoDataService.clearDemoData();
  },

  async hasUserData() {
    return demoDataService.hasUserData();
  },
};
