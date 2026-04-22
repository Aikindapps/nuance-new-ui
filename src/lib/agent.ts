import { HttpAgent } from "@icp-sdk/core/agent";

export const IC_HOST = "https://icp-api.io";

let agent: HttpAgent | null = null;

export function getAgent(): HttpAgent {
  if (!agent) {
    agent = HttpAgent.createSync({ host: IC_HOST });
  }
  return agent;
}
