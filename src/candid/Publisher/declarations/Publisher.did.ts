/* eslint-disable */
// @ts-nocheck

// Minimal hand-written binding for the per-publication Publisher canister.
// Bound methods:
//   * getEditorAndWriterPrincipalIds (NIC-225: editor-aware premium mint).
//   * updatePublicationPostDraft (NIC-274: editor publish/unpublish of a
//     publication post). The Publisher checks isEditor(caller) and then flips
//     the draft flag AS the publication canister — the only path a browser
//     editor is authorized for. (A direct PostBucket.updatePostDraft is rejected
//     because a publication post's author principal is the publication canister,
//     not the editor.)
// Kept in the bindgen shape (idlFactory + _SERVICE) so it plugs into createActor
// exactly like the generated bindings.

import type { ActorMethod } from '@icp-sdk/core/agent';
import { IDL } from '@icp-sdk/core/candid';

// updatePublicationPostDraft returns variant { ok : Post; err : text }. The full
// Post record must be declared so the response decodes; it mirrors the Post
// record in the PostBucket binding.
export interface PostTagModel { 'tagId' : string, 'tagName' : string }
export interface Post {
  'url' : string,
  'bucketCanisterId' : string,
  'title' : string,
  'created' : string,
  'modified' : string,
  'content' : string,
  'views' : string,
  'wordCount' : string,
  'isPremium' : boolean,
  'publishedDate' : string,
  'claps' : string,
  'tags' : Array<PostTagModel>,
  'nftCanisterId' : [] | [string],
  'isDraft' : boolean,
  'creatorPrincipal' : string,
  'category' : string,
  'handle' : string,
  'creatorHandle' : string,
  'headerImage' : string,
  'isMembersOnly' : boolean,
  'subtitle' : string,
  'isPublication' : boolean,
  'postId' : string,
}
export type Result_1 = { 'ok' : Post } | { 'err' : string };

export interface _SERVICE {
  'getEditorAndWriterPrincipalIds' : ActorMethod<[], [Array<string>, Array<string>]>,
  'updatePublicationPostDraft' : ActorMethod<[string, boolean], Result_1>,
}

export const idlFactory: IDL.InterfaceFactory = ({ IDL }) => {
  const PostTagModel = IDL.Record({ 'tagId' : IDL.Text, 'tagName' : IDL.Text });
  const Post = IDL.Record({
    'url' : IDL.Text,
    'bucketCanisterId' : IDL.Text,
    'title' : IDL.Text,
    'created' : IDL.Text,
    'modified' : IDL.Text,
    'content' : IDL.Text,
    'views' : IDL.Text,
    'wordCount' : IDL.Text,
    'isPremium' : IDL.Bool,
    'publishedDate' : IDL.Text,
    'claps' : IDL.Text,
    'tags' : IDL.Vec(PostTagModel),
    'nftCanisterId' : IDL.Opt(IDL.Text),
    'isDraft' : IDL.Bool,
    'creatorPrincipal' : IDL.Text,
    'category' : IDL.Text,
    'handle' : IDL.Text,
    'creatorHandle' : IDL.Text,
    'headerImage' : IDL.Text,
    'isMembersOnly' : IDL.Bool,
    'subtitle' : IDL.Text,
    'isPublication' : IDL.Bool,
    'postId' : IDL.Text,
  });
  const Result_1 = IDL.Variant({ 'ok' : Post, 'err' : IDL.Text });
  return IDL.Service({
    'getEditorAndWriterPrincipalIds' : IDL.Func([], [IDL.Vec(IDL.Text), IDL.Vec(IDL.Text)], ['query']),
    'updatePublicationPostDraft' : IDL.Func([IDL.Text, IDL.Bool], [Result_1], []),
  });
};
