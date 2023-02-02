use api::{
    follow::{
        get_principals_i_follow_paginated::GetFollowerOrFollowingError,
        update_principals_i_follow_toggle_list_with_principal_specified::FollowAnotherUserProfileError,
        update_principals_that_follow_me_toggle_list_with_specified_principal::AnotherUserFollowedMeError,
    },
    post::get_posts_of_this_user_profile_with_pagination::GetPostsOfUserProfileError,
    profile::update_profile_display_details::UpdateProfileDetailsError,
};
use candid::{export_service, Principal};
use individual_user_template_lib::model::{
    // hot_or_not::HotOrNotBetDetailsForPost,
    post::v0::PostViewDetailsFromFrontend,
    profile::UserProfileUpdateDetailsFromFrontend,
};
use shared_utils::{
    access_control::UserAccessRole,
    canister_specific::individual_user_template::types::{
        args::IndividualUserTemplateInitArgs, profile::UserProfileDetailsForFrontend,
    },
    types::{
        canister_specific::individual_user_template::{
            error_types::{
                GetUserUtilityTokenTransactionHistoryError, UpdateProfileSetUniqueUsernameError,
            },
            post::PostDetailsForFrontend,
        },
        post::PostDetailsFromFrontend,
        utility_token::v1::TokenEventV1,
    },
};

mod api;
#[cfg(test)]
mod test;

#[ic_cdk_macros::query(name = "__get_candid_interface_tmp_hack")]
fn export_candid() -> String {
    export_service!();
    __export_service()
}
