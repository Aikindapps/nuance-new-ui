/* eslint-disable */
// @ts-nocheck

import { Actor, HttpAgent, type HttpAgentOptions, type ActorConfig, type Agent, type ActorSubclass } from "@icp-sdk/core/agent";
import { idlFactory, type _SERVICE } from "./declarations/Publisher.did";

// Normalized result shape matching the PostBucket binding's Result_1
// ({ __kind__: 'ok', ok } | { __kind__: 'err', err }) so callers branch on
// __kind__ exactly like updatePostDraft.
export type UpdatePublicationPostDraftResult =
  | { __kind__: "ok"; ok: unknown }
  | { __kind__: "err"; err: string };

export interface PublisherInterface {
  getEditorAndWriterPrincipalIds(): Promise<[Array<string>, Array<string>]>;
  updatePublicationPostDraft(
    postId: string,
    isDraft: boolean,
  ): Promise<UpdatePublicationPostDraftResult>;
}

export class Publisher implements PublisherInterface {
  constructor(private actor: ActorSubclass<_SERVICE>) {}
  async getEditorAndWriterPrincipalIds(): Promise<[Array<string>, Array<string>]> {
    const result = await this.actor.getEditorAndWriterPrincipalIds();
    return result;
  }
  async updatePublicationPostDraft(
    postId: string,
    isDraft: boolean,
  ): Promise<UpdatePublicationPostDraftResult> {
    const result = await this.actor.updatePublicationPostDraft(postId, isDraft);
    return "ok" in result
      ? { __kind__: "ok", ok: result.ok }
      : { __kind__: "err", err: result.err };
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
