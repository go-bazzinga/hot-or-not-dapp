#!/home/saikat/bin/ic-repl

import user_index_canister = "r7inp-6aaaa-aaaaa-aaabq-cai";

identity alice;

let my_canister = call user_index_canister.get_user_index_create_if_not_exists_else_return_canister_id_for_embedded_user_principal_id();

call my_canister.add_post(record { hashtags = vec { "a"; "b"; "c" }; description = "This is post from integration test"; video_uid = "#1234567890"; creator_consent_for_inclusion_in_hot_or_not = false; });

call my_canister.add_post(record { hashtags = vec { "a"; "b"; "c" }; description = "This is post from integration test"; video_uid = "#1234567890"; creator_consent_for_inclusion_in_hot_or_not = false; });




identity bob;

let my_canister = call user_index_canister.get_user_index_create_if_not_exists_else_return_canister_id_for_embedded_user_principal_id();

call my_canister.add_post(record { hashtags = vec { "a"; "b"; "c" }; description = "This is post from integration test"; video_uid = "#1234567890"; creator_consent_for_inclusion_in_hot_or_not = false; });

call my_canister.add_post(record { hashtags = vec { "a"; "b"; "c" }; description = "This is post from integration test"; video_uid = "#1234567890"; creator_consent_for_inclusion_in_hot_or_not = false; });




identity charlie;
let my_canister = call user_index_canister.get_user_index_create_if_not_exists_else_return_canister_id_for_embedded_user_principal_id();

call my_canister.add_post(record { hashtags = vec { "a"; "b"; "c" }; description = "This is post from integration test"; video_uid = "#1234567890"; creator_consent_for_inclusion_in_hot_or_not = false; });

call my_canister.add_post(record { hashtags = vec { "a"; "b"; "c" }; description = "This is post from integration test"; video_uid = "#1234567890"; creator_consent_for_inclusion_in_hot_or_not = false; });

