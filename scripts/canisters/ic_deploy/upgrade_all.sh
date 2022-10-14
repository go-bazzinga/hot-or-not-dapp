#!/usr/bin/env bash
set -euo pipefail

cargo test

dfx build --network=ic individual_user_template
dfx build --network=ic user_index
dfx build --network=ic post_cache

dfx canister --network=ic install --mode upgrade user_index
dfx canister --network=ic install --mode upgrade post_cache