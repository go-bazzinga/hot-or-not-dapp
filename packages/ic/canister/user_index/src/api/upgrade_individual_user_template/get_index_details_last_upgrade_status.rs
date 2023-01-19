use crate::{data::canister_upgrade::upgrade_status::UpgradeStatusV1, CANISTER_DATA};

#[ic_cdk_macros::query]
#[candid::candid_method(query)]
fn get_index_details_last_upgrade_status() -> UpgradeStatusV1 {
    CANISTER_DATA.with(|canister_data_ref_cell| {
        canister_data_ref_cell
            .borrow()
            .last_run_upgrade_status
            .clone()
    })
}
