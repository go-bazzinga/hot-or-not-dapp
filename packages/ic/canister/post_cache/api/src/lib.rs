use std::collections::HashMap;

use candid::{export_service, Principal};
use ic_stable_memory::{
    s, stable_memory_init, stable_memory_post_upgrade, stable_memory_pre_upgrade,
};
use post_cache_lib::{
    access_control::setup_initial_access_control, model::api_error::TopPostsFetchError,
    util::known_principal_ids, AccessControlMap, MyKnownPrincipalIdsMap, PostsIndexSortedByScore,
    PostsIndexSortedByScoreV1,
};
use shared_utils::{
    access_control::UserAccessRole,
    shared_types::{init_args::PostCacheInitArgs, top_posts::v0::PostScoreIndexItem},
};

mod api;
#[cfg(test)]
mod test;

#[ic_cdk_macros::init]
#[candid::candid_method(init)]
fn init(init_args: PostCacheInitArgs) {
    // * initialize stable memory
    stable_memory_init(true, 0);

    // * initialize stable variables
    s! { MyKnownPrincipalIdsMap = HashMap::new() }
    known_principal_ids::save_known_principal_ids_from_user_index_init_args_to_my_known_principal_ids_map(init_args);

    // * initialize stable collections
    s! { AccessControlMap = AccessControlMap::new_with_capacity(100) };
    s! { PostsIndexSortedByScore = PostsIndexSortedByScore::new() };
    s! { PostsIndexSortedByScoreV1 = PostsIndexSortedByScoreV1::default() };

    // * initialize access control
    let mut user_id_access_control_map = s!(AccessControlMap);
    setup_initial_access_control(&mut user_id_access_control_map);
    s! { AccessControlMap = user_id_access_control_map };
}

#[ic_cdk_macros::pre_upgrade]
fn pre_upgrade() {
    // * save stable variables meta-info
    stable_memory_pre_upgrade();
}

#[ic_cdk_macros::post_upgrade]
fn post_upgrade() {
    // * reinitialize stable memory and variables
    stable_memory_post_upgrade(0);
}

#[ic_cdk_macros::query(name = "__get_candid_interface_tmp_hack")]
fn export_candid() -> String {
    export_service!();
    __export_service()
}
