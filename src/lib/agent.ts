import { HttpAgent } from "@icp-sdk/core/agent";

export const IC_HOST = "https://icp-api.io";

let agentPromise: Promise<HttpAgent> | null = null;

export function getAgent(): Promise<HttpAgent> {
  if (!agentPromise) {
    agentPromise = HttpAgent.create({ host: IC_HOST });
  }
  return agentPromise;
}
