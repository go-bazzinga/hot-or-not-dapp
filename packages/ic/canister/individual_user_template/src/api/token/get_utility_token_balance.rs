use crate::data_model::MyTokenBalance;
use ic_stable_memory::s;

#[ic_cdk_macros::query]
#[candid::candid_method(query)]
fn get_utility_token_balance() -> u64 {
    let my_token_balance = s!(MyTokenBalance);

    my_token_balance.get_utility_token_balance()
}
