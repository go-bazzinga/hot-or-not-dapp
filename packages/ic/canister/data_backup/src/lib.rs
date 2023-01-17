use std::cell::RefCell;

use candid::{export_service, Principal};
use data::memory_layout::CanisterData;
use shared_utils::{
    access_control::UserAccessRole,
    canister_specific::data_backup::types::{
        args::DataBackupInitArgs, backup_statistics::BackupStatistics,
    },
    common::types::known_principal::KnownPrincipalType,
};

mod api;
mod data;
#[cfg(test)]
mod test;

thread_local! {
    pub static CANISTER_DATA: RefCell<CanisterData> = RefCell::new(CanisterData::default());
}

#[ic_cdk_macros::query(name = "__get_candid_interface_tmp_hack")]
fn export_candid() -> String {
    export_service!();
    __export_service()
}
