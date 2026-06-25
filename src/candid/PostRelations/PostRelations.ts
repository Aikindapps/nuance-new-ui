/* eslint-disable */

// @ts-nocheck

// Minimal hand-written wrapper for the PostRelations canister.
// Mirrors the structure of src/candid/Sonic/Sonic.ts.

import { Actor, HttpAgent, type HttpAgentOptions, type ActorConfig, type Agent, type ActorSubclass } from "@icp-sdk/core/agent";
import { idlFactory, type _SERVICE } from "./declarations/PostRelations.did";

export interface PostRelationsInterface {
    searchPost(query: string): Promise<Array<string>>;
}

export class PostRelations implements PostRelationsInterface {
    constructor(private actor: ActorSubclass<_SERVICE>) {}
    async searchPost(query: string): Promise<Array<string>> {
        return this.actor.searchPost(query);
    }
}

export interface CreateActorOptions {
    agent?: Agent;
    agentOptions?: HttpAgentOptions;
    actorOptions?: ActorConfig;
}

export function createActor(canisterId: string, options: CreateActorOptions = {}): PostRelations {
    const agent = options.agent || HttpAgent.createSync({
        ...options.agentOptions,
    });
    if (options.agent && options.agentOptions) {
        console.warn("Detected both agent and agentOptions passed to createActor. Ignoring agentOptions and proceeding with the provided agent.");
    }
    const actor = Actor.createActor<_SERVICE>(idlFactory, {
        agent,
        canisterId,
        ...options.actorOptions,
    });
    return new PostRelations(actor);
}
