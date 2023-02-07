use crate::data_model::PrincipalsThatFollowMe;

use super::get_principals_i_follow_paginated::GetFollowerOrFollowingError;
use candid::Principal;
use ic_stable_memory::s;
use shared_utils::pagination::{self, PaginationError};

#[ic_cdk_macros::query]
#[candid::candid_method(query)]
pub fn get_principals_that_follow_me_paginated(
    from_inclusive_index: u64,
    to_exclusive_index: u64,
) -> Result<Vec<Principal>, GetFollowerOrFollowingError> {
    let principals_that_follow_me = s!(PrincipalsThatFollowMe);

    let (from_inclusive_index, to_exclusive_index) = pagination::get_pagination_bounds(
        from_inclusive_index,
        to_exclusive_index,
        principals_that_follow_me.len() as u64,
    )
    .map_err(|e| match e {
        PaginationError::InvalidBoundsPassed => GetFollowerOrFollowingError::InvalidBoundsPassed,
        PaginationError::ReachedEndOfItemsList => {
            GetFollowerOrFollowingError::ReachedEndOfItemsList
        }
        PaginationError::ExceededMaxNumberOfItemsAllowedInOneRequest => {
            GetFollowerOrFollowingError::ExceededMaxNumberOfItemsAllowedInOneRequest
        }
    })?;

    Ok(principals_that_follow_me
        .iter()
        .skip(from_inclusive_index as usize)
        .take(to_exclusive_index as usize)
        .map(|sprincipal| sprincipal.0)
        .collect())
}
