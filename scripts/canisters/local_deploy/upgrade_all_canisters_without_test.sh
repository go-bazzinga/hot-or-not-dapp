#!/usr/bin/env bash
set -euo pipefail

export USER_ID_global_super_admin=$(dfx identity get-principal)
export CANISTER_ID_user_index=$(dfx canister id user_index)
export CANISTER_ID_post_cache=$(dfx canister id post_cache)
export LOCAL_TOP_POSTS_SYNC_INTERVAL="10000000000"

dfx build individual_user_template
dfx build user_index
dfx build post_cache

dfx canister install user_index --mode upgrade --argument "(record {
  known_principal_ids = vec {}
})"
dfx canister call user_index update_user_index_upgrade_user_canisters_with_latest_wasm
dfx canister install post_cache --mode upgrade --argument "(record {
  known_principal_ids = vec {}
})"

dfx generate individual_user_template
dfx generate user_index
dfx generate post_cache