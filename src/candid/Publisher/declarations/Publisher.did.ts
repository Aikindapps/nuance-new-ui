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

export interface SocialLinksObject {
  'website' : string,
  'socialChannels' : Array<string>,
}
export interface PublicationStyling {
  'fontType' : string,
  'logo' : string,
  'primaryColor' : string,
}
export interface PublicationCta {
  'buttonCopy' : string,
  'ctaCopy' : string,
  'icon' : string,
  'link' : string,
}
export interface Publication {
  'avatar' : string,
  'categories' : Array<string>,
  'created' : string,
  'cta' : PublicationCta,
  'description' : string,
  'editors' : Array<string>,
  'headerImage' : string,
  'modified' : string,
  'nftCanisterId' : string,
  'publicationHandle' : string,
  'publicationTitle' : string,
  'socialLinks' : SocialLinksObject,
  'styling' : PublicationStyling,
  'subtitle' : string,
  'writers' : Array<string>,
}
export type Result_2 = { 'ok' : Publication } | { 'err' : string };

export interface _SERVICE {
  'getEditorAndWriterPrincipalIds' : ActorMethod<[], [Array<string>, Array<string>]>,
  'updatePublicationPostDraft' : ActorMethod<[string, boolean], Result_1>,
  'getPublicationQuery' : ActorMethod<[string], Result_2>,
  'updatePublicationDetails' : ActorMethod<[string, string, string, Array<string>, Array<string>, Array<string>, string, string, SocialLinksObject, string], Result_2>,
  'updatePublicationStyling' : ActorMethod<[string, string, string], Result_2>,
  'updatePublicationCta' : ActorMethod<[PublicationCta], Result_2>,
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
  const SocialLinksObject = IDL.Record({
    'website' : IDL.Text,
    'socialChannels' : IDL.Vec(IDL.Text),
  });
  const PublicationStyling = IDL.Record({
    'fontType' : IDL.Text,
    'logo' : IDL.Text,
    'primaryColor' : IDL.Text,
  });
  const PublicationCta = IDL.Record({
    'buttonCopy' : IDL.Text,
    'ctaCopy' : IDL.Text,
    'icon' : IDL.Text,
    'link' : IDL.Text,
  });
  const Publication = IDL.Record({
    'avatar' : IDL.Text,
    'categories' : IDL.Vec(IDL.Text),
    'created' : IDL.Text,
    'cta' : PublicationCta,
    'description' : IDL.Text,
    'editors' : IDL.Vec(IDL.Text),
    'headerImage' : IDL.Text,
    'modified' : IDL.Text,
    'nftCanisterId' : IDL.Text,
    'publicationHandle' : IDL.Text,
    'publicationTitle' : IDL.Text,
    'socialLinks' : SocialLinksObject,
    'styling' : PublicationStyling,
    'subtitle' : IDL.Text,
    'writers' : IDL.Vec(IDL.Text),
  });
  const Result_2 = IDL.Variant({ 'ok' : Publication, 'err' : IDL.Text });
  return IDL.Service({
    'getEditorAndWriterPrincipalIds' : IDL.Func([], [IDL.Vec(IDL.Text), IDL.Vec(IDL.Text)], ['query']),
    'updatePublicationPostDraft' : IDL.Func([IDL.Text, IDL.Bool], [Result_1], []),
    'getPublicationQuery' : IDL.Func([IDL.Text], [Result_2], ['query']),
    'updatePublicationDetails' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Vec(IDL.Text), IDL.Vec(IDL.Text), IDL.Vec(IDL.Text), IDL.Text, IDL.Text, SocialLinksObject, IDL.Text], [Result_2], []),
    'updatePublicationStyling' : IDL.Func([IDL.Text, IDL.Text, IDL.Text], [Result_2], []),
    'updatePublicationCta' : IDL.Func([PublicationCta], [Result_2], []),
  });
};
