use candid::Principal;
use ic_kit::{
    ic,
    interfaces::{
        management::{self, InstallMode},
        Method,
    },
};
use shared_utils::constant::{
    DYNAMIC_CANISTER_DEFAULT_CREATION_BALANCE, GLOBAL_OWNER_PRINCIPAL_ID,
};

const WASM: &[u8] = include_bytes!(
    "../../../../../target/wasm32-unknown-unknown/release/individual_user_template.wasm"
);

pub async fn create_users_canister(caller: Principal) -> Principal {
    let arg = management::CreateCanisterArgument {
        settings: Some(management::CanisterSettings {
            controllers: Some(vec![
                // this canister
                ic::id(),
                // hot or not global owner principal
                Principal::from_text(GLOBAL_OWNER_PRINCIPAL_ID).unwrap(),
            ]),
            compute_allocation: Some(0.into()),
            memory_allocation: Some(0.into()),
            freezing_threshold: Some(0.into()),
        }),
    };

    let canister_id = management::CreateCanister::perform_with_payment(
        Principal::management_canister(),
        (arg,),
        DYNAMIC_CANISTER_DEFAULT_CREATION_BALANCE,
    )
    .await
    .unwrap()
    .0
    .canister_id;

    let arg = candid::encode_args((caller,)).expect("Failed to serialize the install argument.");

    management::InstallCode::perform(
        Principal::management_canister(),
        (management::InstallCodeArgument {
            mode: InstallMode::Install,
            canister_id,
            wasm_module: WASM.into(),
            arg,
        },),
    )
    .await
    .unwrap();

    canister_id
}
