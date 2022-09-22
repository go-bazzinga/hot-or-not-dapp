import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export type AnotherUserFollowedMeError = {
    'UserIndexCrossCanisterCallFailed' : null
  } |
  { 'FollowersListFull' : null } |
  { 'NotAuthorized' : null } |
  { 'UserTryingToFollowMeDoesNotExist' : null };
export type FollowAnotherUserProfileError = {
    'UserToFollowDoesNotExist' : null
  } |
  { 'UserIndexCrossCanisterCallFailed' : null } |
  { 'UserITriedToFollowCrossCanisterCallFailed' : null } |
  { 'UsersICanFollowListIsFull' : null } |
  {
    'MyCanisterIDDoesNotMatchMyPrincipalCanisterIDMappingSeenByUserITriedToFollow' : null
  } |
  { 'UserITriedToFollowDidNotFindMe' : null } |
  { 'NotAuthorized' : null } |
  { 'UserITriedToFollowHasTheirFollowersListFull' : null };
export interface PostDetailsForFrontend {
  'id' : bigint,
  'status' : PostStatus,
  'hashtags' : Array<string>,
  'like_count' : bigint,
  'description' : string,
  'total_view_count' : bigint,
  'created_by_display_name' : [] | [string],
  'created_by_unique_user_name' : [] | [string],
  'video_url' : string,
  'created_by_user_principal_id' : Principal,
  'liked_by_me' : boolean,
  'created_by_profile_photo_url' : [] | [string],
}
export interface PostDetailsFromFrontend {
  'hashtags' : Array<string>,
  'description' : string,
  'video_uid' : string,
  'creator_consent_for_inclusion_in_hot_or_not' : boolean,
}
export type PostStatus = { 'BannedForExplicitness' : null } |
  { 'BannedDueToUserReporting' : null } |
  { 'Uploaded' : null } |
  { 'CheckingExplicitness' : null } |
  { 'ReadyToView' : null } |
  { 'Transcoding' : null } |
  { 'Deleted' : null };
export type PostViewDetailsFromFrontend = {
    'WatchedMultipleTimes' : {
      'percentage_watched' : number,
      'watch_count' : number,
    }
  } |
  { 'WatchedPartially' : { 'percentage_watched' : number } };
export type Result = { 'Ok' : boolean } |
  { 'Err' : FollowAnotherUserProfileError };
export type Result_1 = { 'Ok' : boolean } |
  { 'Err' : AnotherUserFollowedMeError };
export type Result_2 = { 'Ok' : UserProfileDetailsForFrontend } |
  { 'Err' : UpdateProfileDetailsError };
export type Result_3 = { 'Ok' : null } |
  { 'Err' : UpdateProfileSetUniqueUsernameError };
export type UpdateProfileDetailsError = { 'NotAuthorized' : null };
export type UpdateProfileSetUniqueUsernameError = {
    'UsernameAlreadyTaken' : null
  } |
  { 'UserIndexCrossCanisterCallFailed' : null } |
  { 'SendingCanisterDoesNotMatchUserCanisterId' : null } |
  { 'NotAuthorized' : null } |
  { 'UserCanisterEntryDoesNotExist' : null };
export type UserAccessRole = { 'CanisterController' : null } |
  { 'ProfileOwner' : null } |
  { 'CanisterAdmin' : null } |
  { 'ProjectCanister' : null };
export interface UserProfile {
  'unique_user_name' : [] | [string],
  'profile_picture_url' : [] | [string],
  'display_name' : [] | [string],
  'principal_id' : Principal,
  'profile_stats' : UserProfileGlobalStats,
}
export interface UserProfileDetailsForFrontend {
  'unique_user_name' : [] | [string],
  'profile_picture_url' : [] | [string],
  'display_name' : [] | [string],
  'principal_id' : Principal,
}
export interface UserProfileGlobalStats {
  'lifetime_earnings' : bigint,
  'hots_earned_count' : bigint,
  'nots_earned_count' : bigint,
}
export interface UserProfileUpdateDetailsFromFrontend {
  'profile_picture_url' : [] | [string],
  'display_name' : [] | [string],
}
export interface _SERVICE {
  'add_post' : ActorMethod<[PostDetailsFromFrontend], bigint>,
  'get_individual_post_details_by_id' : ActorMethod<
    [bigint],
    PostDetailsForFrontend,
  >,
  'get_posts_of_this_user_profile_with_pagination' : ActorMethod<
    [bigint, bigint],
    Array<PostDetailsForFrontend>,
  >,
  'get_profile_details' : ActorMethod<[], UserProfile>,
  'get_user_roles' : ActorMethod<[Principal], Array<UserAccessRole>>,
  'update_post_add_view_details' : ActorMethod<
    [bigint, PostViewDetailsFromFrontend],
    undefined,
  >,
  'update_post_as_ready_to_view' : ActorMethod<[bigint], undefined>,
  'update_post_increment_share_count' : ActorMethod<[bigint], bigint>,
  'update_post_toggle_like_status_by_caller' : ActorMethod<[bigint], boolean>,
  'update_principals_i_follow_toggle_list_with_principal_specified' : ActorMethod<
    [Principal],
    Result,
  >,
  'update_principals_that_follow_me_toggle_list_with_specified_principal' : ActorMethod<
    [Principal],
    Result_1,
  >,
  'update_profile_display_details' : ActorMethod<
    [UserProfileUpdateDetailsFromFrontend],
    Result_2,
  >,
  'update_profile_set_unique_username_once' : ActorMethod<[string], Result_3>,
  'update_user_add_role' : ActorMethod<[UserAccessRole, Principal], undefined>,
  'update_user_remove_role' : ActorMethod<
    [UserAccessRole, Principal],
    undefined,
  >,
}
