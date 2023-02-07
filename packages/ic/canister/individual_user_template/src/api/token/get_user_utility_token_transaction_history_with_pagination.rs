use crate::data_model::MyTokenBalance;
use ic_stable_memory::s;
use shared_utils::{
    pagination::{self, PaginationError},
    types::{
        canister_specific::individual_user_template::error_types::GetUserUtilityTokenTransactionHistoryError,
        utility_token::v1::TokenEventV1,
    },
};

#[ic_cdk_macros::query]
#[candid::candid_method(query)]
fn get_user_utility_token_transaction_history_with_pagination(
    from_inclusive_id: u64,
    to_exclusive_id: u64,
) -> Result<Vec<(u64, TokenEventV1)>, GetUserUtilityTokenTransactionHistoryError> {
    let my_token_balance = s!(MyTokenBalance);

    let (from_inclusive_id, to_exclusive_id) = pagination::get_pagination_bounds(
        from_inclusive_id,
        to_exclusive_id,
        my_token_balance
            .get_utility_token_transaction_history()
            .len() as u64,
    )
    .map_err(|e| match e {
        PaginationError::InvalidBoundsPassed => {
            GetUserUtilityTokenTransactionHistoryError::InvalidBoundsPassed
        }
        PaginationError::ReachedEndOfItemsList => {
            GetUserUtilityTokenTransactionHistoryError::ReachedEndOfItemsList
        }
        PaginationError::ExceededMaxNumberOfItemsAllowedInOneRequest => {
            GetUserUtilityTokenTransactionHistoryError::ExceededMaxNumberOfItemsAllowedInOneRequest
        }
    })?;

    Ok(my_token_balance
        .get_utility_token_transaction_history()
        .iter()
        .skip(from_inclusive_id as usize)
        .take((to_exclusive_id - from_inclusive_id) as usize)
        .map(|(time, token_event)| (*time, token_event.clone()))
        .collect())
}