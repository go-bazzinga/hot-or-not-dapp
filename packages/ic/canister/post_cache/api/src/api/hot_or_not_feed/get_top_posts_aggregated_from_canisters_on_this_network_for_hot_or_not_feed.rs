use crate::CANISTER_DATA;
use post_cache_lib::CanisterData;
use shared_utils::{
    pagination::{self, PaginationError},
    types::{
        canister_specific::post_cache::error_types::TopPostsFetchError,
        top_posts::v0::PostScoreIndexItem,
    },
};

#[ic_cdk_macros::query]
#[candid::candid_method(query)]
fn get_top_posts_aggregated_from_canisters_on_this_network_for_hot_or_not_feed(
    from_inclusive_index: u64,
    to_exclusive_index: u64,
) -> Result<Vec<PostScoreIndexItem>, TopPostsFetchError> {
    CANISTER_DATA.with(|canister_data| {
        let canister_data = canister_data.borrow();

        get_top_posts_aggregated_from_canisters_on_this_network_for_hot_or_not_feed_impl(
            from_inclusive_index,
            to_exclusive_index,
            &canister_data,
        )
    })
}

fn get_top_posts_aggregated_from_canisters_on_this_network_for_hot_or_not_feed_impl(
    from_inclusive_index: u64,
    to_exclusive_index: u64,
    canister_data: &CanisterData,
) -> Result<Vec<PostScoreIndexItem>, TopPostsFetchError> {
    let all_posts = &canister_data.posts_index_sorted_by_hot_or_not_feed_score;

    let (from_inclusive_index, to_exclusive_index) = pagination::get_pagination_bounds(
        from_inclusive_index,
        to_exclusive_index,
        all_posts.iter().count() as u64,
    )
    .map_err(|e| match e {
        PaginationError::InvalidBoundsPassed => TopPostsFetchError::InvalidBoundsPassed,
        PaginationError::ReachedEndOfItemsList => TopPostsFetchError::ReachedEndOfItemsList,
        PaginationError::ExceededMaxNumberOfItemsAllowedInOneRequest => {
            TopPostsFetchError::ExceededMaxNumberOfItemsAllowedInOneRequest
        }
    })?;

    Ok(all_posts
        .iter()
        .skip(from_inclusive_index as usize)
        .take(to_exclusive_index as usize)
        .cloned()
        .collect())
}

#[cfg(test)]
mod test {
    use candid::Principal;
    use ic_stable_memory::utils::ic_types::SPrincipal;
    use post_cache_lib::CanisterData;
    use shared_utils::types::top_posts::v0::PostScoreIndexItem;

    #[test]
    fn test_get_top_posts_aggregated_from_canisters_on_this_network_for_hot_or_not_feed_impl() {
        let mut canister_data = CanisterData::default();

        let result =
            super::get_top_posts_aggregated_from_canisters_on_this_network_for_hot_or_not_feed_impl(
                0,
                10,
                &canister_data,
            );

        assert!(result.is_err());
        assert_eq!(
            result,
            Err(super::TopPostsFetchError::ReachedEndOfItemsList)
        );

        canister_data
            .posts_index_sorted_by_hot_or_not_feed_score
            .replace(&PostScoreIndexItem {
                post_id: 1,
                score: 1,
                publisher_canister_id: SPrincipal(Principal::from_text("aaaaa-aa").unwrap()),
            });

        canister_data
            .posts_index_sorted_by_hot_or_not_feed_score
            .replace(&PostScoreIndexItem {
                post_id: 1,
                score: 2,
                publisher_canister_id: SPrincipal(Principal::from_text("aaaaa-aa").unwrap()),
            });

        canister_data
            .posts_index_sorted_by_hot_or_not_feed_score
            .replace(&PostScoreIndexItem {
                post_id: 2,
                score: 5,
                publisher_canister_id: SPrincipal(Principal::from_text("aaaaa-aa").unwrap()),
            });

        assert!(super::get_top_posts_aggregated_from_canisters_on_this_network_for_hot_or_not_feed_impl(
            0,
            10,
            &canister_data
        ).is_ok());
        assert!(
            super::get_top_posts_aggregated_from_canisters_on_this_network_for_hot_or_not_feed_impl(
                0,
                10,
                &canister_data
            )
            .unwrap()
            .len() == 2
        );
    }
}
