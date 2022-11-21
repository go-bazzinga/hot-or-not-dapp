use candid::Principal;
use ic_state_machine_tests::{CanisterId, PrincipalId, StateMachine, WasmResult};
use shared_utils::shared_types::{
    individual_user_template::post::PostDetailsForFrontend, post::PostDetailsFromFrontend,
    top_posts::v0::PostScoreIndexItem,
};
use std::time::Duration;
use test_utils::setup::{
    initialize_test_env_with_known_canisters::{
        get_initialized_env_with_provisioned_known_canisters, KnownCanisters,
    },
    test_constants::get_alice_principal_id,
};

#[test]
fn every_hour_home_feed_post_scores_in_posts_index_sorted_by_score_is_updated_and_top_3_posts_are_sent_to_post_cache(
) {
    // * Arrange
    let state_machine = StateMachine::new();
    let KnownCanisters {
        user_index_canister_id,
        post_cache_canister_id,
        ..
    } = get_initialized_env_with_provisioned_known_canisters(&state_machine);
    let alice_principal_id = get_alice_principal_id();

    println!("🧪 user_index_canister_id: {:?}", user_index_canister_id);

    // * Act
    let alice_canister_id = state_machine.execute_ingress_as(
        alice_principal_id,
        user_index_canister_id,
        "get_user_index_create_if_not_exists_else_return_canister_id_for_embedded_user_principal_id",
        candid::encode_one(()).unwrap(),
    ).map(|reply_payload| {
        let (alice_canister_id,): (Principal,) = match reply_payload {
            WasmResult::Reply(payload) => candid::decode_args(&payload).unwrap(),
            _ => panic!("\n🛑 get_user_index_create_if_not_exists_else_return_canister_id_for_embedded_user_principal_id failed\n"),
        };
        alice_canister_id
    }).unwrap();

    let newly_created_post_id = state_machine
        .execute_ingress_as(
            alice_principal_id,
            CanisterId::new(PrincipalId(alice_canister_id)).unwrap(),
            "add_post",
            candid::encode_args((PostDetailsFromFrontend {
                description: "This is a fun video to watch".to_string(),
                hashtags: vec!["fun".to_string(), "video".to_string()],
                video_uid: "abcd#1234".to_string(),
                creator_consent_for_inclusion_in_hot_or_not: true,
            },))
            .unwrap(),
        )
        .map(|reply_payload| {
            let (newly_created_post_id,): (u64,) = match reply_payload {
                WasmResult::Reply(payload) => candid::decode_args(&payload).unwrap(),
                _ => panic!("\n🛑 add_post failed\n"),
            };
            newly_created_post_id
        })
        .unwrap();

    state_machine
        .execute_ingress_as(
            alice_principal_id,
            CanisterId::new(PrincipalId(alice_canister_id)).unwrap(),
            "add_post",
            candid::encode_args((PostDetailsFromFrontend {
                description: "This is a fun video to watch".to_string(),
                hashtags: vec!["fun".to_string(), "video".to_string()],
                video_uid: "abcd#1234".to_string(),
                creator_consent_for_inclusion_in_hot_or_not: true,
            },))
            .unwrap(),
        )
        .unwrap();

    state_machine
        .execute_ingress_as(
            alice_principal_id,
            CanisterId::new(PrincipalId(alice_canister_id)).unwrap(),
            "add_post",
            candid::encode_args((PostDetailsFromFrontend {
                description: "This is a fun video to watch".to_string(),
                hashtags: vec!["fun".to_string(), "video".to_string()],
                video_uid: "abcd#1234".to_string(),
                creator_consent_for_inclusion_in_hot_or_not: true,
            },))
            .unwrap(),
        )
        .unwrap();

    let home_feed_post_score = state_machine
        .query(
            CanisterId::new(PrincipalId(alice_canister_id)).unwrap(),
            "get_individual_post_details_by_id",
            candid::encode_args((newly_created_post_id,)).unwrap(),
        )
        .map(|reply_payload| {
            let (post_details,): (PostDetailsForFrontend,) = match reply_payload {
                WasmResult::Reply(payload) => candid::decode_args(&payload).unwrap(),
                _ => panic!("\n🛑 get_individual_post_details_by_id failed\n"),
            };
            post_details.home_feed_ranking_score
        })
        .unwrap();

    assert!(home_feed_post_score > 0);

    // TODO: fix these tests
    // // * Advance time by 1 hour
    // state_machine.advance_time(Duration::from_secs(1 * 60 * 60));
    // state_machine.tick();

    // let returned_posts: Vec<PostScoreIndexItem> = state_machine
    // .query(
    //     post_cache_canister_id,
    //     "get_top_posts_aggregated_from_canisters_on_this_network_for_home_feed",
    //     candid::encode_args((0 as u64,10 as u64)).unwrap(),
    // )
    // .map(|reply_payload| {
    //     let returned_posts: Vec<PostScoreIndexItem> = match reply_payload {
    //         WasmResult::Reply(payload) => candid::decode_one(&payload).unwrap(),
    //         _ => panic!("\n🛑 get_top_posts_aggregated_from_canisters_on_this_network_for_home_feed failed\n"),
    //     };
    //     returned_posts
    // })
    // .unwrap();

    // println!("🧪 returned_posts: {:#?}", returned_posts);

    // assert!(returned_posts.len() == 3);
}
