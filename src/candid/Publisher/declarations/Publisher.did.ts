/* eslint-disable */
// @ts-nocheck

// Minimal hand-written binding for the per-publication Publisher canister.
// Only getEditorAndWriterPrincipalIds is needed (NIC-225: editor-aware premium
// mint minimum). Kept in the bindgen shape (idlFactory + _SERVICE) so it plugs
// into createActor exactly like the generated bindings.

import type { ActorMethod } from '@icp-sdk/core/agent';
import { IDL } from '@icp-sdk/core/candid';

export interface _SERVICE {
  'getEditorAndWriterPrincipalIds' : ActorMethod<[], [Array<string>, Array<string>]>,
}

export const idlFactory: IDL.InterfaceFactory = ({ IDL }) => {
  return IDL.Service({
    'getEditorAndWriterPrincipalIds' : IDL.Func([], [IDL.Vec(IDL.Text), IDL.Vec(IDL.Text)], ['query']),
  });
};
