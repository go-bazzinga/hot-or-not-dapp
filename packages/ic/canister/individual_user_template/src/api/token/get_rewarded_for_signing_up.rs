use crate::CANISTER_DATA;
use ic_stable_memory::utils::ic_types::SPrincipal;
use shared_utils::{
    common::types::known_principal::KnownPrincipalType,
    date_time::system_time,
    types::utility_token::{v0::MintEvent, v1::TokenEventV1},
};

#[ic_cdk_macros::update]
#[candid::candid_method(update)]
fn get_rewarded_for_signing_up() {
    // * access control
    let request_maker = ic_cdk::caller();
    let user_index_canister_principal_id = CANISTER_DATA.with(|canister_data_ref_cell| {
        canister_data_ref_cell
            .borrow()
            .known_principal_ids
            .get(&KnownPrincipalType::CanisterIdUserIndex)
            .cloned()
            .unwrap()
    });

    if user_index_canister_principal_id != request_maker {
        return;
    }

    CANISTER_DATA.with(|canister_data_ref_cell| {
        let mut canister_data_ref = canister_data_ref_cell.borrow_mut();
        let my_token_balance = canister_data_ref.my_token_balance.clone();
        let profile = canister_data_ref.profile.clone();
        let updated_token_balance = my_token_balance.handle_token_event(TokenEventV1::Mint {
            details: MintEvent::NewUserSignup {
                new_user_principal_id: SPrincipal(profile.principal_id.unwrap()),
            },
            timestamp: system_time::get_current_system_time_from_ic(),
        });
        canister_data_ref.my_token_balance = updated_token_balance;
    });
}
