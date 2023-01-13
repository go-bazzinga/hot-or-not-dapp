use candid::Principal;
use ic_cdk::api::call;
use shared_utils::common::types::known_principal::KnownPrincipalType;

use crate::CANISTER_DATA;

pub async fn backup_data_to_backup_canister() {
    let data_backup_canister_id = CANISTER_DATA
        .with(|canister_data_ref_cell| canister_data_ref_cell.borrow().known_principal_ids.clone())
        .get(&KnownPrincipalType::CanisterIdDataBackup)
        .expect("Failed to get the canister id of the data_backup canister")
        .clone();

    send_user_principal_id_to_canister_id_mapping(&data_backup_canister_id).await;
    send_unique_user_name_to_user_principal_id_mapping(&data_backup_canister_id).await;
}

const CHUNK_SIZE: usize = 1_000;

async fn send_user_principal_id_to_canister_id_mapping(data_backup_canister_id: &Principal) {
    let kv_pair_vec_of_user_principal_id_to_canister_id =
        CANISTER_DATA.with(|canister_data_ref_cell| {
            canister_data_ref_cell
                .borrow()
                .user_principal_id_to_canister_id_map
                .iter()
                .map(|(k, v)| (k.clone(), v.clone()))
                .collect::<Vec<_>>()
        });

    let chunks_to_send: Vec<&[(Principal, Principal)]> =
        kv_pair_vec_of_user_principal_id_to_canister_id
            .chunks(CHUNK_SIZE)
            .collect::<Vec<_>>();

    for chunk in chunks_to_send {
        let _response: () = call::call(
            data_backup_canister_id.clone(),
            "receive_user_principal_id_to_canister_id_mapping_from_user_index_canister",
            (chunk.to_vec(),),
        )
        .await
        .expect("Failed to call the receive_user_principal_id_to_canister_id_mapping_from_user_index_canister method on the data_backup canister");
    }
}

async fn send_unique_user_name_to_user_principal_id_mapping(data_backup_canister_id: &Principal) {
    let kv_pair_vec_of_unique_user_name_to_user_principal_id =
        CANISTER_DATA.with(|canister_data_ref_cell| {
            canister_data_ref_cell
                .borrow()
                .unique_user_name_to_user_principal_id_map
                .iter()
                .map(|(k, v)| (k.clone(), v.clone()))
                .collect::<Vec<_>>()
        });

    let chunks_to_send = kv_pair_vec_of_unique_user_name_to_user_principal_id
        .chunks(CHUNK_SIZE)
        .collect::<Vec<_>>();

    for chunk in chunks_to_send {
        let _response: () = call::call(
            data_backup_canister_id.clone(),
            "receive_unique_user_name_to_user_principal_id_mapping_from_user_index_canister",
            (chunk.to_vec(),),
        )
        .await
        .expect("Failed to call the receive_unique_user_name_to_user_principal_id_mapping_from_user_index_canister method on the data_backup canister");
    }
}
