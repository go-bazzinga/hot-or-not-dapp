use candid::{CandidType, Deserialize, Principal};
use ic_stable_memory::utils::ic_types::SPrincipal;
use speedy::{Readable, Writable};
use std::collections::BTreeSet;

#[derive(Readable, Writable, CandidType)]
pub struct UserProfile {
    display_name: Option<String>,
    unique_user_name: Option<String>,
    principal_id: SPrincipal,
    profile_picture_url: Option<String>,
    profile_stats: UserProfileGlobalStats,
    followers: BTreeSet<SPrincipal>,
    following: BTreeSet<SPrincipal>,
}

#[derive(Readable, Writable, CandidType)]
pub struct UserProfileGlobalStats {
    lifetime_earnings: u64,
    hots_earned_count: u64,
    nots_earned_count: u64,
}

#[derive(CandidType)]
pub struct UserProfileDetailsForFrontend {
    pub principal_id: Principal,
    pub display_name: Option<String>,
    pub unique_user_name: Option<String>,
    pub profile_picture_url: Option<String>,
}

#[derive(Deserialize, CandidType)]
pub struct UserProfileUpdateDetailsFromFrontend {
    pub display_name: Option<String>,
    pub profile_picture_url: Option<String>,
}

impl UserProfile {
    pub fn new(principal_id: Principal) -> Self {
        // let generated_name = generate_random_names(principal_id).await;

        Self {
            display_name: None,
            unique_user_name: None,
            principal_id: SPrincipal(principal_id),
            profile_picture_url: None,
            profile_stats: UserProfileGlobalStats {
                lifetime_earnings: 0,
                hots_earned_count: 0,
                nots_earned_count: 0,
            },
            followers: BTreeSet::new(),
            following: BTreeSet::new(),
        }
    }

    pub fn get_user_profile_details_for_frontend(&self) -> UserProfileDetailsForFrontend {
        UserProfileDetailsForFrontend {
            principal_id: self.principal_id.0,
            display_name: self.display_name.clone(),
            unique_user_name: self.unique_user_name.clone(),
            profile_picture_url: self.profile_picture_url.clone(),
        }
    }

    pub fn update_profile_toggle_following_list_of_follower_by_user_to_follow(
        &mut self,
        user_to_follow: SPrincipal,
    ) -> bool {
        assert!(
            self.following.len() < 1000,
            "You can only follow 1000 users at a time."
        );

        if self.following.contains(&user_to_follow) {
            self.following.remove(&user_to_follow);

            return false;
        } else {
            self.following.insert(user_to_follow.clone());

            return true;
        }
    }

    pub fn update_profile_toggle_follower_list_of_followee_by_calling_principal(
        &mut self,
        user_who_followed_me: SPrincipal,
    ) -> bool {
        assert!(
            self.followers.len() < 1000,
            "You can only be followed by 1000 users at a time."
        );

        if self.followers.contains(&user_who_followed_me) {
            self.followers.remove(&user_who_followed_me);

            return false;
        } else {
            self.followers.insert(user_who_followed_me.clone());

            return true;
        }
    }

    pub fn update_profile_details(
        &mut self,
        user_profile_details: UserProfileUpdateDetailsFromFrontend,
    ) {
        self.display_name = user_profile_details.display_name;
        self.profile_picture_url = user_profile_details.profile_picture_url;
    }

    pub fn set_unique_user_name(&mut self, unique_user_name: String) {
        self.unique_user_name = Some(unique_user_name);
    }
}
