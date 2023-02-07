use crate::{data_model::CanisterData, CANISTER_DATA};
use shared_utils::canister_specific::individual_user_template::types::args::IndividualUserTemplateInitArgs;

#[ic_cdk_macros::init]
#[candid::candid_method(init)]
fn init(init_args: IndividualUserTemplateInitArgs) {
    CANISTER_DATA.with(|canister_data_ref_cell| {
        let mut data = canister_data_ref_cell.borrow_mut();
        init_impl(init_args, &mut data);
    });
}

fn init_impl(init_args: IndividualUserTemplateInitArgs, data: &mut CanisterData) {
    init_args
        .known_principal_ids
        .unwrap_or_default()
        .iter()
        .for_each(|(principal_belongs_to, principal_id)| {
            data.known_principal_ids
                .insert(principal_belongs_to.clone(), principal_id.clone());
        });

    data.profile.principal_id = init_args.profile_owner;
}

#[cfg(test)]
mod test {
    use shared_utils::common::types::known_principal::{KnownPrincipalMapV1, KnownPrincipalType};
    use test_utils::setup::test_constants::{
        get_global_super_admin_principal_id_v1, get_mock_canister_id_configuration,
        get_mock_canister_id_user_index, get_mock_user_alice_principal_id,
    };

    use super::*;

    #[test]
    fn test_init_impl() {
        // * Add some known principals
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
            KnownPrincipalType::CanisterIdUserIndex,
            get_mock_canister_id_user_index(),
        );

        // * Create the init args
        let init_args = IndividualUserTemplateInitArgs {
            known_principal_ids: Some(known_principal_ids),
            profile_owner: Some(get_mock_user_alice_principal_id()),
        };
        let mut data = CanisterData::default();

        // * Run the init impl
        init_impl(init_args, &mut data);

        // * Check the data
        assert_eq!(
            data.known_principal_ids
                .get(&KnownPrincipalType::UserIdGlobalSuperAdmin)
                .unwrap(),
            &get_global_super_admin_principal_id_v1()
        );
        assert_eq!(
            data.known_principal_ids
                .get(&KnownPrincipalType::CanisterIdConfiguration)
                .unwrap(),
            &get_mock_canister_id_configuration()
        );
        assert_eq!(
            data.known_principal_ids
                .get(&KnownPrincipalType::CanisterIdUserIndex)
                .unwrap(),
            &get_mock_canister_id_user_index()
        );

        assert_eq!(
            data.profile.principal_id,
            Some(get_mock_user_alice_principal_id())
        );
    }
}
