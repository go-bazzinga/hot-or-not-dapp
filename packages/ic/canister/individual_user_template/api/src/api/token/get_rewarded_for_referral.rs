use candid::Principal;
use ic_stable_memory::{s, utils::ic_types::SPrincipal};
use individual_user_template_lib::{
    model::token::TokenBalance, MyKnownPrincipalIdsMap, MyTokenBalance,
};
use shared_utils::{
    constant::get_user_index_canister_principal_id,
    shared_types::utility_token::{v0::MintEvent, v1::TokenEventV1},
};

#[cfg(not(test))]
use shared_utils::date_time::system_time::for_prod::get_current_system_time;
#[cfg(test)]
use shared_utils::date_time::system_time::for_tests::get_current_system_time;

#[ic_cdk_macros::update]
#[candid::candid_method(update)]
fn get_rewarded_for_referral(referrer: Principal, referree: Principal) {
    // * access control
    let request_maker = ic_cdk::caller();
    let known_principal_ids: MyKnownPrincipalIdsMap = s!(MyKnownPrincipalIdsMap);

    if !(get_user_index_canister_principal_id(known_principal_ids) == request_maker) {
        return;
    }

    let my_token_balance: TokenBalance = s!(MyTokenBalance);

    let updated_token_balance = my_token_balance.handle_token_event(TokenEventV1::Mint {
        details: MintEvent::Referral {
            referrer_user_principal_id: SPrincipal(referrer),
            referee_user_principal_id: SPrincipal(referree),
        },
        timestamp: get_current_system_time(),
    });

    s! { MyTokenBalance = updated_token_balance };
}
