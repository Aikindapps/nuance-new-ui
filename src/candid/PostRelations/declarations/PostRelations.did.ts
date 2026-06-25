/* eslint-disable */

// @ts-nocheck

// Minimal hand-written binding for the PostRelations canister.
// Only the methods consumed by the frontend are declared here.
// Source: src/candid/PostRelations.did

import type { ActorMethod } from '@icp-sdk/core/agent';
import type { Principal } from '@icp-sdk/core/principal';
import { IDL } from '@icp-sdk/core/candid';

export interface _SERVICE {
  'searchPost' : ActorMethod<[string], Array<string>>;
}

export const idlFactory: IDL.InterfaceFactory = ({ IDL }) => {
  return IDL.Service({
    'searchPost' : IDL.Func([IDL.Text], [IDL.Vec(IDL.Text)], ['query']),
  });
};

export const init: (args: { IDL: typeof IDL }) => IDL.Type[] = ({ IDL }) => {
  return [];
};
