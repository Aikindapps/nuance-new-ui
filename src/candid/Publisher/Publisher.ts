/* eslint-disable */
// @ts-nocheck

import { Actor, HttpAgent, type HttpAgentOptions, type ActorConfig, type Agent, type ActorSubclass } from "@icp-sdk/core/agent";
import { idlFactory, type _SERVICE } from "./declarations/Publisher.did";

export interface PublisherInterface {
  getEditorAndWriterPrincipalIds(): Promise<[Array<string>, Array<string>]>;
}

export class Publisher implements PublisherInterface {
  constructor(private actor: ActorSubclass<_SERVICE>) {}
  async getEditorAndWriterPrincipalIds(): Promise<[Array<string>, Array<string>]> {
    const result = await this.actor.getEditorAndWriterPrincipalIds();
    return result;
  }
}

export interface CreateActorOptions {
  agent?: Agent;
  agentOptions?: HttpAgentOptions;
  actorOptions?: ActorConfig;
}

export function createActor(canisterId: string, options: CreateActorOptions = {}): Publisher {
  const agent = options.agent || HttpAgent.createSync({ ...options.agentOptions });
  if (options.agent && options.agentOptions) {
    console.warn("Detected both agent and agentOptions passed to createActor. Ignoring agentOptions and proceeding with the provided agent.");
  }
  const actor = Actor.createActor<_SERVICE>(idlFactory, {
    agent,
    canisterId: canisterId,
    ...options.actorOptions,
  });
  return new Publisher(actor);
}
