use std::time::Duration;

use ic_cdk::storage;

use crate::{
    api::{
        backup_and_restore::backup_data_to_backup_canister,
        well_known_principal::update_locally_stored_well_known_principals,
    },
    CANISTER_DATA,
};

#[ic_cdk_macros::post_upgrade]
fn post_upgrade() {
    restore_data_from_stable_memory();
    refetch_well_known_principals();
    // TODO: test if this can be moved to pre_upgrade
    initiate_backup_to_backup_canister();
}

fn restore_data_from_stable_memory() {
    match storage::stable_restore() {
        Ok((canister_data,)) => {
            CANISTER_DATA.with(|canister_data_ref_cell| {
                *canister_data_ref_cell.borrow_mut() = canister_data;
            });
        }
        Err(_) => {
            panic!("Failed to restore canister data from stable memory");
        }
    }
}

const DELAY_FOR_REFETCHING_WELL_KNOWN_PRINCIPALS: Duration = Duration::from_secs(1);
fn refetch_well_known_principals() {
    ic_cdk::timer::set_timer(DELAY_FOR_REFETCHING_WELL_KNOWN_PRINCIPALS, || {
        ic_cdk::spawn(update_locally_stored_well_known_principals::update_locally_stored_well_known_principals())
    });
}

const DELAY_FOR_INITIATING_BACKUP_TO_BACKUP_CANISTER: Duration = Duration::from_secs(10);
fn initiate_backup_to_backup_canister() {
    ic_cdk::timer::set_timer(DELAY_FOR_INITIATING_BACKUP_TO_BACKUP_CANISTER, || {
        ic_cdk::spawn(backup_data_to_backup_canister::backup_data_to_backup_canister())
    });
}
