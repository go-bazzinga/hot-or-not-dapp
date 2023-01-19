use std::collections::{BTreeMap, HashMap};

use candid::{CandidType, Deserialize, Principal};
use shared_utils::{
    access_control::UserAccessRole, common::types::known_principal::KnownPrincipalMapV1,
};

use self::canister_upgrade::upgrade_status::UpgradeStatusV1;

pub mod canister_upgrade;

#[derive(Default, CandidType, Deserialize)]
pub struct CanisterData {
    pub last_run_upgrade_status: UpgradeStatusV1,
    pub known_principal_ids: KnownPrincipalMapV1,
    pub access_control_map: HashMap<Principal, Vec<UserAccessRole>>,
    pub user_principal_id_to_canister_id_map: BTreeMap<Principal, Principal>,
    pub unique_user_name_to_user_principal_id_map: BTreeMap<String, Principal>,
}
