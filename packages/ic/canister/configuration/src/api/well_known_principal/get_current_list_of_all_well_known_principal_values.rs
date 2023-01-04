use candid::Principal;
use shared_utils::common::types::known_principal::{KnownPrincipalMapV1, KnownPrincipalType};

use crate::CANISTER_DATA;

#[ic_cdk_macros::query]
#[candid::candid_method(query)]
fn get_current_list_of_all_well_known_principal_values() -> Vec<(KnownPrincipalType, Principal)> {
    CANISTER_DATA.with(|canister_data_ref_cell| {
        let known_principal_ids = &canister_data_ref_cell.borrow().known_principal_ids;
        get_current_list_of_all_well_known_principal_values_impl(&known_principal_ids)
    })
}

fn get_current_list_of_all_well_known_principal_values_impl(
    known_principal_ids: &KnownPrincipalMapV1,
) -> Vec<(KnownPrincipalType, Principal)> {
    known_principal_ids
        .iter()
        .map(|(known_principal_type, principal)| (known_principal_type.clone(), principal.clone()))
        .collect()
}

#[cfg(test)]
mod test {
    use test_utils::setup::test_constants::{
        get_global_super_admin_principal_id_v1, get_mock_canister_id_configuration,
        get_mock_canister_id_data_backup, get_mock_canister_id_post_cache,
        get_mock_canister_id_user_index,
    };

    use super::*;

    #[test]
    fn test_get_well_known_principal_value_impl() {
        let mut known_principal_ids = KnownPrincipalMapV1::new();
        known_principal_ids.insert(
            KnownPrincipalType::UserIdGlobalSuperAdmin,
            get_global_super_admin_principal_id_v1(),
        );
        known_principal_ids.insert(
            KnownPrincipalType::CanisterIdConfiguration,
            get_mock_canister_id_configuration(),
        );
        known_principal_ids.insert(
            KnownPrincipalType::CanisterIdDataBackup,
            get_mock_canister_id_data_backup(),
        );
        known_principal_ids.insert(
            KnownPrincipalType::CanisterIdPostCache,
            get_mock_canister_id_post_cache(),
        );
        known_principal_ids.insert(
            KnownPrincipalType::CanisterIdUserIndex,
            get_mock_canister_id_user_index(),
        );

        assert!(
            get_current_list_of_all_well_known_principal_values_impl(&known_principal_ids)
                .contains(&(
                    KnownPrincipalType::UserIdGlobalSuperAdmin,
                    get_global_super_admin_principal_id_v1()
                ))
        );
        assert!(
            get_current_list_of_all_well_known_principal_values_impl(&known_principal_ids)
                .contains(&(
                    KnownPrincipalType::CanisterIdConfiguration,
                    get_mock_canister_id_configuration()
                ))
        );
        assert!(
            get_current_list_of_all_well_known_principal_values_impl(&known_principal_ids)
                .contains(&(
                    KnownPrincipalType::CanisterIdDataBackup,
                    get_mock_canister_id_data_backup()
                ))
        );
        assert!(
            get_current_list_of_all_well_known_principal_values_impl(&known_principal_ids)
                .contains(&(
                    KnownPrincipalType::CanisterIdPostCache,
                    get_mock_canister_id_post_cache()
                ))
        );
        assert!(
            get_current_list_of_all_well_known_principal_values_impl(&known_principal_ids)
                .contains(&(
                    KnownPrincipalType::CanisterIdUserIndex,
                    get_mock_canister_id_user_index()
                ))
        );
    }
}
