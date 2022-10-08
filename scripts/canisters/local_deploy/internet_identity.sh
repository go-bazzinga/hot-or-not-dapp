#!/usr/bin/env bash

# Download the Internet Identity canister's development wasm as well as its candid interface file. See dfx.json for details.
curl -sSL https://github.com/dfinity/internet-identity/releases/latest/download/internet_identity_dev.wasm -o internet_identity.wasm
curl -sSL https://github.com/dfinity/internet-identity/releases/latest/download/internet_identity.did -o internet_identity.did