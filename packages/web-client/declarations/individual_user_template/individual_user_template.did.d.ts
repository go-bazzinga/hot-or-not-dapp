import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface AggregateStats {
  'total_number_of_not_bets' : bigint,
  'total_amount_bet' : bigint,
  'total_number_of_hot_bets' : bigint,
}
export type AnotherUserFollowedMeError = {
    'UserIndexCrossCanisterCallFailed' : null
  } |
  { 'FollowersListFull' : null } |
  { 'NotAuthorized' : null } |
  { 'UserTryingToFollowMeDoesNotExist' : null };
export interface BetDetails {
  'bet_direction' : BetDirection,
  'amount' : bigint,
}
export type BetDirection = { 'Hot' : null } |
  { 'Not' : null };
export type BetOnCurrentlyViewingPostError = { 'InsufficientBalance' : null } |
  { 'UserAlreadyParticipatedInThisPost' : null } |
  { 'BettingClosed' : null } |
  { 'UserNotLoggedIn' : null };
export type BettingStatus = {
    'BettingOpen' : {
      'number_of_participants' : number,
      'ongoing_room' : bigint,
      'ongoing_slot' : number,
      'has_this_user_participated_in_this_post' : [] | [boolean],
      'started_at' : SystemTime,
    }
  } |
  { 'BettingClosed' : null };
export interface FeedScore {
  'current_score' : bigint,
  'last_synchronized_at' : SystemTime,
  'last_synchronized_score' : bigint,
}
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
export type GetPostsOfUserProfileError = { 'ReachedEndOfItemsList' : null } |
  { 'InvalidBoundsPassed' : null } |
  { 'ExceededMaxNumberOfItemsAllowedInOneRequest' : null };
export interface HotOrNotDetails {
  'hot_or_not_feed_score' : FeedScore,
  'aggregate_stats' : AggregateStats,
  'score' : bigint,
  'slot_history' : Array<[number, SlotDetails]>,
}
export interface IndividualUserTemplateInitArgs {
  'known_principal_ids' : [] | [Array<[KnownPrincipalType, Principal]>],
  'profile_owner' : [] | [Principal],
  'upgrade_version_number' : [] | [bigint],
}
export type KnownPrincipalType = { 'CanisterIdUserIndex' : null } |
  { 'CanisterIdConfiguration' : null } |
  { 'CanisterIdProjectMemberIndex' : null } |
  { 'CanisterIdTopicCacheIndex' : null } |
  { 'CanisterIdRootCanister' : null } |
  { 'CanisterIdDataBackup' : null } |
  { 'CanisterIdPostCache' : null } |
  { 'CanisterIdSNSController' : null } |
  { 'UserIdGlobalSuperAdmin' : null };
export type MintEvent = {
    'NewUserSignup' : { 'new_user_principal_id' : Principal }
  } |
  {
    'Referral' : {
      'referrer_user_principal_id' : Principal,
      'referee_user_principal_id' : Principal,
    }
  };
export interface PlaceBetArg {
  'bet_amount' : bigint,
  'post_id' : bigint,
  'bet_direction' : BetDirection,
}
export interface Post {
  'id' : bigint,
  'status' : PostStatus,
  'share_count' : bigint,
  'hashtags' : Array<string>,
  'description' : string,
  'created_at' : SystemTime,
  'likes' : Array<Principal>,
  'video_uid' : string,
  'home_feed_score' : FeedScore,
  'view_stats' : PostViewStatistics,
  'hot_or_not_details' : [] | [HotOrNotDetails],
  'homefeed_ranking_score' : bigint,
  'creator_consent_for_inclusion_in_hot_or_not' : boolean,
}
export interface PostDetailsForFrontend {
  'id' : bigint,
  'status' : PostStatus,
  'home_feed_ranking_score' : bigint,
  'hashtags' : Array<string>,
  'hot_or_not_betting_status' : [] | [BettingStatus],
  'like_count' : bigint,
  'description' : string,
  'total_view_count' : bigint,
  'created_by_display_name' : [] | [string],
  'created_at' : SystemTime,
  'created_by_unique_user_name' : [] | [string],
  'video_uid' : string,
  'created_by_user_principal_id' : Principal,
  'hot_or_not_feed_ranking_score' : [] | [bigint],
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
export interface PostViewStatistics {
  'total_view_count' : bigint,
  'average_watch_percentage' : number,
  'threshold_view_count' : bigint,
}
export type Result = { 'Ok' : bigint } |
  { 'Err' : string };
export type Result_1 = { 'Ok' : BettingStatus } |
  { 'Err' : BetOnCurrentlyViewingPostError };
export type Result_2 = { 'Ok' : Array<PostDetailsForFrontend> } |
  { 'Err' : GetPostsOfUserProfileError };
export type Result_3 = { 'Ok' : Array<Principal> } |
  { 'Err' : GetPostsOfUserProfileError };
export type Result_4 = { 'Ok' : Array<[bigint, TokenEvent]> } |
  { 'Err' : GetPostsOfUserProfileError };
export type Result_5 = { 'Ok' : boolean } |
  { 'Err' : FollowAnotherUserProfileError };
export type Result_6 = { 'Ok' : boolean } |
  { 'Err' : AnotherUserFollowedMeError };
export type Result_7 = { 'Ok' : UserProfileDetailsForFrontend } |
  { 'Err' : UpdateProfileDetailsError };
export type Result_8 = { 'Ok' : null } |
  { 'Err' : UpdateProfileSetUniqueUsernameError };
export interface RoomDetails { 'bets_made' : Array<[Principal, BetDetails]> }
export interface SlotDetails { 'room_details' : Array<[bigint, RoomDetails]> }
export interface SystemTime {
  'nanos_since_epoch' : number,
  'secs_since_epoch' : bigint,
}
export type TokenEvent = { 'Stake' : null } |
  { 'Burn' : null } |
  { 'Mint' : { 'timestamp' : SystemTime, 'details' : MintEvent } } |
  { 'Transfer' : null };
export type UpdateProfileDetailsError = { 'NotAuthorized' : null };
export type UpdateProfileSetUniqueUsernameError = {
    'UsernameAlreadyTaken' : null
  } |
  { 'UserIndexCrossCanisterCallFailed' : null } |
  { 'SendingCanisterDoesNotMatchUserCanisterId' : null } |
  { 'NotAuthorized' : null } |
  { 'UserCanisterEntryDoesNotExist' : null };
export interface UserProfile {
  'unique_user_name' : [] | [string],
  'profile_picture_url' : [] | [string],
  'display_name' : [] | [string],
  'principal_id' : [] | [Principal],
  'profile_stats' : UserProfileGlobalStats,
}
export interface UserProfileDetailsForFrontend {
  'unique_user_name' : [] | [string],
  'following_count' : bigint,
  'profile_picture_url' : [] | [string],
  'display_name' : [] | [string],
  'principal_id' : Principal,
  'profile_stats' : UserProfileGlobalStats,
  'followers_count' : bigint,
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
  'add_post_v2' : ActorMethod<[PostDetailsFromFrontend], Result>,
  'backup_data_to_backup_canister' : ActorMethod<
    [Principal, Principal],
    undefined
  >,
  'bet_on_currently_viewing_post' : ActorMethod<[PlaceBetArg], Result_1>,
  'get_following_status_do_i_follow_this_user' : ActorMethod<
    [Principal],
    boolean
  >,
  'get_hot_or_not_bet_details_for_this_post' : ActorMethod<
    [bigint],
    BettingStatus
  >,
  'get_individual_post_details_by_id' : ActorMethod<
    [bigint],
    PostDetailsForFrontend
  >,
  'get_posts_of_this_user_profile_with_pagination' : ActorMethod<
    [bigint, bigint],
    Result_2
  >,
  'get_principals_i_follow_paginated' : ActorMethod<[bigint, bigint], Result_3>,
  'get_principals_that_follow_me_paginated' : ActorMethod<
    [bigint, bigint],
    Result_3
  >,
  'get_profile_details' : ActorMethod<[], UserProfileDetailsForFrontend>,
  'get_rewarded_for_referral' : ActorMethod<[Principal, Principal], undefined>,
  'get_rewarded_for_signing_up' : ActorMethod<[], undefined>,
  'get_user_utility_token_transaction_history_with_pagination' : ActorMethod<
    [bigint, bigint],
    Result_4
  >,
  'get_utility_token_balance' : ActorMethod<[], bigint>,
  'get_well_known_principal_value' : ActorMethod<
    [KnownPrincipalType],
    [] | [Principal]
  >,
  'receive_my_created_posts_from_data_backup_canister' : ActorMethod<
    [Array<Post>],
    undefined
  >,
  'receive_my_profile_from_data_backup_canister' : ActorMethod<
    [UserProfile],
    undefined
  >,
  'receive_my_utility_token_balance_from_data_backup_canister' : ActorMethod<
    [bigint],
    undefined
  >,
  'receive_my_utility_token_transaction_history_from_data_backup_canister' : ActorMethod<
    [Array<[bigint, TokenEvent]>],
    undefined
  >,
  'receive_principals_i_follow_from_data_backup_canister' : ActorMethod<
    [Array<Principal>],
    undefined
  >,
  'receive_principals_that_follow_me_from_data_backup_canister' : ActorMethod<
    [Array<Principal>],
    undefined
  >,
  'return_cycles_to_user_index_canister' : ActorMethod<[], undefined>,
  'update_post_add_view_details' : ActorMethod<
    [bigint, PostViewDetailsFromFrontend],
    undefined
  >,
  'update_post_as_ready_to_view' : ActorMethod<[bigint], undefined>,
  'update_post_increment_share_count' : ActorMethod<[bigint], bigint>,
  'update_post_toggle_like_status_by_caller' : ActorMethod<[bigint], boolean>,
  'update_principals_i_follow_toggle_list_with_principal_specified' : ActorMethod<
    [Principal],
    Result_5
  >,
  'update_principals_that_follow_me_toggle_list_with_specified_principal' : ActorMethod<
    [Principal],
    Result_6
  >,
  'update_profile_display_details' : ActorMethod<
    [UserProfileUpdateDetailsFromFrontend],
    Result_7
  >,
  'update_profile_set_unique_username_once' : ActorMethod<[string], Result_8>,
}
