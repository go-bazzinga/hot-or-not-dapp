use candid::Principal;
use ic_state_machine_tests::{CanisterId, PrincipalId, StateMachine, WasmResult};
use individual_user_template_lib::model::profile::UserProfileDetailsForFrontend;
use test_utils::setup::{
    initialize_test_env_with_known_canisters::{
        get_initialized_env_with_provisioned_known_canisters, KnownCanisters,
    },
    test_constants::get_alice_principal_id,
};

#[test]
fn when_setting_unique_username_then_new_username_persisted_in_personal_canister_and_updated_in_user_index(
) {
    let state_machine = StateMachine::new();
    let KnownCanisters {
        user_index_canister_id,
        ..
    } = get_initialized_env_with_provisioned_known_canisters(&state_machine);
    let alice_principal_id = get_alice_principal_id();

    let alice_canister_id = state_machine.execute_ingress_as(
        alice_principal_id,
        user_index_canister_id,
        "get_user_index_create_if_not_exists_else_return_canister_id_for_embedded_user_principal_id",
        candid::encode_one(()).unwrap(),
    ).map(|reply_payload| {
        let alice_canister_id: Principal = match reply_payload {
            WasmResult::Reply(payload) => candid::decode_one(&payload).unwrap(),
            _ => panic!("\n🛑 get_user_index_create_if_not_exists_else_return_canister_id_for_embedded_user_principal_id failed\n"),
        };
        alice_canister_id
    }).unwrap();

    // TODO: test the error cases
    // TODO: figure out how to get the error message from the reply payload

    state_machine
        .execute_ingress_as(
            alice_principal_id,
            CanisterId::new(PrincipalId(alice_canister_id)).unwrap(),
            "update_profile_set_unique_username_once",
            candid::encode_one(String::from("cool_alice_1234")).unwrap(),
        )
        .unwrap();

    let profile_details_from_user_canister = state_machine
        .query_as(
            PrincipalId::new_anonymous(),
            CanisterId::new(PrincipalId(alice_canister_id)).unwrap(),
            "get_profile_details",
            candid::encode_args(()).unwrap(),
        )
        .map(|reply_payload| {
            let profile_details_from_user_canister: UserProfileDetailsForFrontend =
                match reply_payload {
                    WasmResult::Reply(payload) => candid::decode_one(&payload).unwrap(),
                    _ => panic!("\n🛑 get_profile_details failed\n"),
                };
            profile_details_from_user_canister
        })
        .unwrap();

    let is_alice_username_taken = state_machine
        .query_as(
            PrincipalId::new_anonymous(),
            user_index_canister_id,
            "get_index_details_is_user_name_taken",
            candid::encode_args(("cool_alice_1234",)).unwrap(),
        )
        .map(|reply_payload| {
            let (is_alice_username_taken,): (bool,) = match reply_payload {
                WasmResult::Reply(payload) => candid::decode_args(&payload).unwrap(),
                _ => panic!("\n🛑 get_index_details_is_user_name_taken failed\n"),
            };
            is_alice_username_taken
        })
        .unwrap();

    let alice_canister_id_corresponding_to_username = state_machine
        .query(
            user_index_canister_id,
            "get_user_canister_id_from_unique_user_name",
            candid::encode_one("cool_alice_1234".to_string()).unwrap(),
        )
        .map(|reply_payload| {
            let alice_principal_id_corresponding_to_username: Option<Principal> =
                match reply_payload {
                    WasmResult::Reply(payload) => candid::decode_one(&payload).unwrap(),
                    _ => panic!("\n🛑 get_user_canister_id_from_unique_user_name failed\n"),
                };
            alice_principal_id_corresponding_to_username
        })
        .unwrap();
    let alice_canister_id_corresponding_to_principal_id = state_machine
        .query(
            user_index_canister_id,
            "get_user_canister_id_from_user_principal_id",
            candid::encode_one(alice_principal_id.0).unwrap(),
        )
        .map(|reply_payload| {
            let alice_principal_id_corresponding_to_username: Option<Principal> =
                match reply_payload {
                    WasmResult::Reply(payload) => candid::decode_one(&payload).unwrap(),
                    _ => panic!("\n🛑 get_user_canister_id_from_user_principal_id failed\n"),
                };
            alice_principal_id_corresponding_to_username
        })
        .unwrap();

    assert_eq!(
        profile_details_from_user_canister.unique_user_name,
        Some("cool_alice_1234".to_string())
    );
    assert_eq!(is_alice_username_taken, true);
    assert_eq!(
        alice_canister_id_corresponding_to_username,
        alice_canister_id_corresponding_to_principal_id
    );
}
