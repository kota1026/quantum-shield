//! API routes module

use axum::{Router, routing::{get, post}};

mod lock;
mod unlock;
mod status;
mod prover;
mod edition;
mod health;
mod admin;
mod auth;
mod user;
mod token_hub;
mod challenge;
pub mod governance;
mod enterprise;
mod observer;
mod treasury;
mod insurance;
mod fees;
mod explorer;
pub mod council;
mod resync;
mod emergency;
mod qs_hub;

use std::sync::Arc;
use axum::middleware;
use crate::middleware::jwt_auth;
use crate::services::AppState;

pub fn api_routes() -> Router {
    Router::new()
        // Health check
        .route("/health", get(health::health_check))
        // Lock API (API-002)
        .route("/lock", post(lock::create_lock))
        .route("/lock/:lock_id/confirm", post(lock::confirm_lock))
        // Unlock API (API-003)
        .route("/unlock", post(unlock::create_unlock))
        .route("/unlock/emergency", post(unlock::create_emergency_unlock))
        // Status API (API-004)
        .route("/status/:lock_id", get(status::get_lock_status))
        .route("/status/pending", get(status::get_pending_unlocks))
        // Prover API (basic) - static routes first (MUST be before :prover_id)
        .route("/prover/register", post(prover::register_prover))
        .route("/prover/list", get(prover::list_provers))
        .route("/prover/verify-invitation", post(prover::verify_invitation))
        .route("/prover/status/by-wallet/:wallet_address", get(prover::get_prover_status_by_wallet))
        // Prover Portal API (TASK-P5-022) - specific paths before :prover_id
        .route("/prover/:prover_id/dashboard", get(prover::get_prover_dashboard))
        .route("/prover/:prover_id/stats", get(prover::get_prover_stats))
        .route("/prover/:prover_id/queue/dashboard", get(prover::get_prover_queue_dashboard))
        .route("/prover/:prover_id/queue/:queue_id", get(prover::get_queue_item))
        .route("/prover/:prover_id/queue", get(prover::get_signing_queue))
        .route("/prover/:prover_id/rewards/summary", get(prover::get_prover_rewards_summary))
        .route("/prover/:prover_id/rewards", get(prover::get_prover_rewards))
        .route("/prover/:prover_id/stake-data", get(prover::get_prover_stake_data))
        .route("/prover/:prover_id/stake", get(prover::get_prover_stake))
        .route("/prover/:prover_id/sign/batch", post(prover::batch_sign))
        .route("/prover/:prover_id/sign", post(prover::submit_signature))
        .route("/prover/:prover_id/metrics/detail", get(prover::get_prover_metrics_detail))
        .route("/prover/:prover_id/metrics", get(prover::get_prover_metrics))
        .route("/prover/:prover_id/alerts/:alert_id/acknowledge", post(prover::acknowledge_alert))
        .route("/prover/:prover_id/alerts", get(prover::get_prover_alerts))
        .route("/prover/:prover_id/challenges", get(prover::get_prover_challenges))
        .route("/prover/:prover_id/challenge-response", post(prover::submit_challenge_response))
        .route("/prover/:prover_id/enterprise-contract", get(prover::get_prover_enterprise_contract))
        .route("/prover/:prover_id/performance", get(prover::get_prover_performance))
        .route("/prover/:prover_id/signature-history", get(prover::get_prover_signature_history))
        .route("/prover/:prover_id/payouts", get(prover::get_prover_payouts))
        .route("/prover/:prover_id/exit", post(prover::initiate_prover_exit))
        // Prover Exit API (TASK-P5-031 - SEQUENCES §6)
        .route("/prover/:prover_id/exit-status", get(prover::get_prover_exit_status))
        .route("/prover/:prover_id/withdraw", post(prover::withdraw_stake))
        // Generic prover info - LAST (catches :prover_id)
        .route("/prover/:prover_id", get(prover::get_prover_info))
        // Edition API (API-006)
        .route("/edition", get(edition::get_edition))
        .route("/edition/switch", post(edition::switch_edition))
        // Challenge API (SEQUENCES §4)
        .route("/challenge", post(challenge::submit_challenge))
        .route("/challenge/:lock_id", get(challenge::get_challenge))
        .route("/challenge/:lock_id/defense", post(challenge::submit_defense))
        .route("/challenge/:lock_id/auto-resolve", post(challenge::auto_resolve))
        // Consumer App API (TASK-P5-020)
        .route("/user/dashboard", get(user::get_dashboard))
        .route("/user/transactions", get(user::get_transactions))
        .route("/user/transactions/:id", get(user::get_transaction_detail))
        .route("/user/settings", get(user::get_settings))
        .route("/user/settings", post(user::update_settings))
        .route("/user/keys", get(user::get_keys))
        // Token Hub API (TASK-P5-021) - 9 endpoints
        .route("/token-hub/dashboard", get(token_hub::get_dashboard))
        .route("/token-hub/lock", post(token_hub::create_lock))
        .route("/token-hub/locks", get(token_hub::get_locks))
        .route("/token-hub/extend", post(token_hub::extend_lock))
        .route("/token-hub/delegates", get(token_hub::get_delegates))
        .route("/token-hub/delegate", post(token_hub::delegate_power))
        .route("/token-hub/rewards", get(token_hub::get_rewards))
        .route("/token-hub/claim", post(token_hub::claim_rewards))
        .route("/token-hub/delegations/my", get(token_hub::get_my_delegations))
        // Alias for frontend compatibility (FE calls /token-hub/my-delegations)
        .route("/token-hub/my-delegations", get(token_hub::get_my_delegations))
        // Token Hub Additional Endpoints (FE-BE alignment)
        .route("/token-hub/rewards/summary", get(token_hub::get_rewards_summary))
        .route("/token-hub/rewards/breakdown", get(token_hub::get_rewards_breakdown))
        .route("/token-hub/epoch", get(token_hub::get_epoch))
        .route("/token-hub/balance", get(token_hub::get_balance))
        .route("/token-hub/locked-positions", get(token_hub::get_locked_positions))
        .route("/token-hub/user-delegation", get(token_hub::get_user_delegation))
        .route("/token-hub/rewards/claimable", get(token_hub::get_claimable_rewards))
        .route("/token-hub/rewards/history", get(token_hub::get_rewards_history))
        .route("/token-hub/rewards/history/extended", get(token_hub::get_extended_rewards_history))
        // Governance API (TASK-P5-023)
        .route("/governance/dashboard", get(governance::get_dashboard))
        .route("/governance/proposals", get(governance::list_proposals))
        .route("/governance/proposals/:id", get(governance::get_proposal))
        .route("/governance/proposals", post(governance::create_proposal))
        .route("/governance/vote", post(governance::submit_vote))
        .route("/governance/proposals/:id/vote", post(governance::submit_vote_by_proposal_id))
        .route("/governance/votes/:id", get(governance::get_vote))
        .route("/governance/voting-power", get(governance::get_voting_power))
        .route("/governance/activity", get(governance::get_activity))
        .route("/governance/council", get(governance::get_council))
        // Security Council API (TASK-P5-028) - 7 endpoints
        .route("/council/members", get(council::get_members))
        .route("/council/thresholds", get(council::get_thresholds))
        .route("/council/actions", get(council::list_actions))
        .route("/council/actions/:id", get(council::get_action))
        .route("/council/actions", post(council::propose_action))
        .route("/council/actions/:id/sign", post(council::sign_action))
        .route("/council/actions/:id/execute", post(council::execute_action))
        .route("/council/emergency-status", get(council::get_emergency_status))
        // Enterprise Admin API (TASK-P5-016) - 19 endpoints
        // Dashboard (3 EP)
        .route("/enterprise/dashboard/overview", get(enterprise::get_dashboard_overview))
        .route("/enterprise/dashboard/tvl", get(enterprise::get_dashboard_tvl))
        .route("/enterprise/dashboard/volume", get(enterprise::get_dashboard_volume))
        // Transactions (3 EP)
        .route("/enterprise/transactions", get(enterprise::get_transactions))
        .route("/enterprise/transactions/:id", get(enterprise::get_transaction_detail))
        .route("/enterprise/transactions/export", post(enterprise::export_transactions))
        // Users (5 EP)
        .route("/enterprise/users", get(enterprise::get_users))
        .route("/enterprise/users/:id", get(enterprise::get_user_detail))
        .route("/enterprise/users", post(enterprise::create_user))
        .route("/enterprise/users/invite", post(enterprise::invite_user))
        .route("/enterprise/users/:id/role", post(enterprise::update_user_role).put(enterprise::update_user_role_put))
        .route("/enterprise/users/:id/activity", get(enterprise::get_enterprise_user_activity))
        // API Keys (4 EP)
        .route("/enterprise/api-keys", get(enterprise::get_api_keys))
        .route("/enterprise/api-keys", post(enterprise::create_api_key))
        .route("/enterprise/api-keys/:id/usage", get(enterprise::get_api_key_usage))
        .route("/enterprise/api-keys/:id", axum::routing::delete(enterprise::revoke_api_key))
        // Settings (3 EP)
        .route("/enterprise/settings", get(enterprise::get_settings).post(enterprise::update_settings).put(enterprise::update_settings_put))
        .route("/enterprise/security-settings", get(enterprise::get_security_settings))
        // Reports & Audit (2 EP)
        .route("/enterprise/reports", get(enterprise::get_reports))
        .route("/enterprise/audit-log", get(enterprise::get_audit_log))
        // Enterprise Additional (FE-BE alignment)
        .route("/enterprise/provers", get(enterprise::get_enterprise_provers))
        .route("/enterprise/observers", get(enterprise::get_enterprise_observers))
        .route("/enterprise/status", get(enterprise::get_enterprise_status))
        .route("/enterprise/activity", get(enterprise::get_enterprise_activity))
        .route("/enterprise/webhooks", get(enterprise::get_enterprise_webhooks))
        .route("/enterprise/license/reports", get(enterprise::get_license_reports))
        .route("/enterprise/environments", get(enterprise::get_enterprise_environments))
        // TASK-P5-017: Enterprise Application Flow (4 EP)
        .route("/enterprise/apply", post(enterprise::submit_application))
        .route("/enterprise/application/:id", get(enterprise::get_application))
        .route("/enterprise/contract/sign", post(enterprise::sign_contract))
        .route("/enterprise/onboarding", get(enterprise::get_onboarding))
        // Observer API (TASK-P5-019) - 13 endpoints
        .route("/observer/register", post(observer::register_observer))
        .route("/observer/dashboard", get(observer::get_dashboard))
        .route("/observer/profile", get(observer::get_profile))
        .route("/observer/pending-unlocks", get(observer::get_pending_unlocks))
        .route("/observer/suspicious-txs", get(observer::get_suspicious_txs))
        .route("/observer/history", get(observer::get_history))
        .route("/observer/settings", get(observer::get_observer_settings).put(observer::update_observer_settings))
        .route("/observer/challenges/active", get(observer::get_active_challenges))
        .route("/observer/challenge", post(observer::submit_challenge))
        .route("/observer/challenge/:id", get(observer::get_challenge))
        .route("/observer/earnings", get(observer::get_earnings))
        .route("/observer/claim-earnings", post(observer::claim_earnings))
        // Treasury API (TASK-P5-029) - 6 endpoints
        .route("/treasury/dashboard", get(treasury::get_dashboard))
        .route("/treasury/proposals", get(treasury::list_proposals))
        .route("/treasury/proposals/:id", get(treasury::get_proposal))
        .route("/treasury/proposals", post(treasury::create_proposal))
        .route("/treasury/proposals/:id/approve", post(treasury::approve_proposal))
        .route("/treasury/proposals/:id/execute", post(treasury::execute_proposal))
        // Insurance Fund API (TASK-P5-029) - 4 endpoints
        .route("/insurance/dashboard", get(insurance::get_dashboard))
        .route("/insurance/claims", get(insurance::list_claims))
        .route("/insurance/claims", post(insurance::submit_claim))
        .route("/insurance/transactions", get(insurance::list_transactions))
        // Fee Distribution API (TASK-P5-029) - 2 endpoints
        .route("/fees/distribution", get(fees::get_distribution))
        .route("/fees/stats", get(fees::get_stats))
        // Explorer API (TASK-P5-024) - 23 endpoints
        .route("/explorer/overview", get(explorer::get_overview))
        .route("/explorer/search", get(explorer::search))
        // Locks — specific paths BEFORE :id
        .route("/explorer/locks/recent", get(explorer::get_recent_locks))
        .route("/explorer/locks", get(explorer::get_locks))
        .route("/explorer/locks/:id", get(explorer::get_lock_detail))
        // Unlocks — specific paths BEFORE :id
        .route("/explorer/unlocks/recent", get(explorer::get_recent_unlocks))
        .route("/explorer/unlocks", get(explorer::get_unlocks))
        .route("/explorer/unlocks/:id", get(explorer::get_unlock_detail))
        // Challenges — specific paths BEFORE :id
        .route("/explorer/challenges/active", get(explorer::get_active_challenges))
        .route("/explorer/challenges/stats", get(explorer::get_challenge_stats))
        .route("/explorer/challenges", get(explorer::get_challenges))
        .route("/explorer/challenges/:id", get(explorer::get_challenge_detail))
        .route("/explorer/address/:addr", get(explorer::get_address_info))
        // Provers — specific paths BEFORE :id
        .route("/explorer/provers/stats", get(explorer::get_prover_stats))
        .route("/explorer/provers", get(explorer::get_provers))
        .route("/explorer/provers/:id", get(explorer::get_prover_detail))
        // Analytics — specific sub-paths
        .route("/explorer/analytics/stats", get(explorer::get_analytics_stats))
        .route("/explorer/analytics/tvl", get(explorer::get_analytics_tvl))
        .route("/explorer/analytics/volume", get(explorer::get_analytics_volume))
        .route("/explorer/analytics/provers", get(explorer::get_analytics_provers))
        .route("/explorer/analytics/locks/distribution", get(explorer::get_lock_distribution))
        .route("/explorer/analytics/unlocks/distribution", get(explorer::get_unlock_distribution))
        .route("/explorer/analytics", get(explorer::get_analytics))
        // Resync API (TASK-P5-030) - 3 endpoints (Sequence #3')
        .route("/resync", post(resync::create_resync))
        .route("/resync/pending", get(resync::get_pending_resyncs))
        .route("/resync/:lock_id", get(resync::get_resync_status))
        // Emergency Pause API (TASK-P5-032) - 4 endpoints (Sequence #8)
        .route("/emergency/pause", post(emergency::execute_pause))
        .route("/emergency/status", get(emergency::get_status))
        .route("/emergency/unpause", post(emergency::execute_unpause))
        .route("/emergency/extend", post(emergency::request_extension))
        // QS Hub API (TASK-P5-025) - 14 endpoints
        .route("/qs-hub/dashboard/stats", get(qs_hub::get_dashboard_stats))
        .route("/qs-hub/proposals/active", get(qs_hub::get_active_proposals))
        .route("/qs-hub/rewards", get(qs_hub::get_rewards))
        .route("/qs-hub/delegates", get(qs_hub::get_delegates))
        .route("/qs-hub/proposals", get(qs_hub::get_proposals))
        .route("/qs-hub/proposals/:id", get(qs_hub::get_proposal_detail))
        .route("/qs-hub/proposals/:id/vote", post(qs_hub::vote_on_proposal))
        .route("/qs-hub/council", get(qs_hub::get_council))
        .route("/qs-hub/stakes", get(qs_hub::get_stakes))
        .route("/qs-hub/stakes", post(qs_hub::create_stake))
        .route("/qs-hub/stakes/:id/extend", post(qs_hub::extend_stake))
        .route("/qs-hub/balance", get(qs_hub::get_balance))
        .route("/qs-hub/votes/history", get(qs_hub::get_vote_history))
        .route("/qs-hub/rewards/claim", post(qs_hub::claim_rewards))
}

/// Authentication routes (TASK-P5-012: SIWE→JWT)
/// POST /v1/auth/siwe - SIWE authentication (public)
/// POST /v1/auth/refresh - Refresh access token (public)
/// GET /v1/auth/me - Get current user (protected)
pub fn auth_routes(state: Arc<AppState>) -> Router {
    Router::new()
        // Public endpoints (no auth required)
        .route("/auth/siwe", post(auth::siwe_authenticate))
        .route("/auth/refresh", post(auth::refresh_token))
        // Protected endpoint (requires JWT)
        .route(
            "/auth/me",
            get(auth::get_current_user)
                .layer(middleware::from_fn_with_state(state.clone(), jwt_auth)),
        )
        .with_state(state)
}

/// Admin Dashboard API routes (/api/*)
/// Existing prover/provider management + TASK-P5-015 QS Admin API (11 EP)
///
/// Routes are split into public (auth) and protected (everything else).
/// Protected routes require JWT authentication via admin_jwt_auth middleware.
pub fn admin_routes(state: Arc<AppState>) -> Router {
    // Public admin routes (no auth required)
    let public_routes = Router::new()
        // === Phase 8-C: Admin Auth (5 EP) ===
        .route("/admin/auth/login", post(admin::admin_login))
        .route("/admin/auth/logout", post(admin::admin_logout))
        .route("/admin/auth/refresh", post(admin::admin_refresh_token))
        .route("/admin/auth/me", get(admin::admin_get_me))
        .route("/admin/auth/2fa/verify", post(admin::admin_verify_2fa));

    // Protected admin routes (JWT auth required)
    let protected_routes = Router::new()
        // === TASK-P5-015: QS Admin API (11 EP) ===
        // Dashboard & Overview
        .route("/admin/dashboard", get(admin::get_qs_dashboard))
        .route("/admin/dashboard/alerts", get(admin::get_dashboard_alerts))
        .route("/admin/transactions", get(admin::get_admin_transactions))
        .route("/admin/nodes", get(admin::get_admin_nodes))
        // Staff Management
        .route("/admin/staff", get(admin::get_staff))
        .route("/admin/staff", post(admin::create_staff))
        // Reports & Audit
        .route("/admin/reports", get(admin::get_reports))
        .route("/admin/audit-log", get(admin::get_audit_log))
        // Parameters
        .route("/admin/parameters", get(admin::get_parameters))
        .route("/admin/parameters/change-request", post(admin::create_parameter_change_request))
        // Enterprise Accounts (TASK-P5-015 + TASK-P5-018)
        .route("/admin/enterprise/accounts", get(admin::get_enterprise_accounts))
        .route("/admin/enterprise/accounts", post(admin::create_enterprise_account))
        // TASK-P5-018: 4BFT Contract Management (4 EP)
        .route("/admin/enterprise/accounts/:id", get(admin::get_enterprise_account_detail))
        .route("/admin/enterprise/accounts/:id", axum::routing::put(admin::update_enterprise_account))
        .route("/admin/enterprise/contracts", get(admin::get_enterprise_contracts))
        .route("/admin/enterprise/contracts", post(admin::create_enterprise_contract))
        // === Existing Admin Endpoints ===
        // Prover Management
        .route("/provers", get(admin::list_provers))
        .route("/provers/register", post(admin::register_prover))
        .route("/provers/:id", get(admin::get_admin_prover_detail))
        .route("/provers/:id/approve", post(admin::approve_prover))
        .route("/provers/:id/reject", post(admin::reject_prover))
        .route("/provers/:id/suspend", post(admin::suspend_prover))
        // Prover Requests/Applications (admin prefix)
        .route("/admin/provers/requests", get(admin::list_prover_requests))
        .route("/admin/provers/requests/stats", get(admin::get_prover_request_stats))
        .route("/admin/provers/requests/:id", get(admin::get_prover_request_detail))
        .route("/admin/provers/requests/:id/status", post(admin::update_prover_request_status))
        // Prover aliases (FE calls /api/admin/provers/* but handlers are registered at /provers/*)
        .route("/admin/provers", get(admin::list_provers))
        .route("/admin/provers/:id", get(admin::get_admin_prover_detail))
        // Provider Management
        .route("/providers", get(admin::list_providers))
        .route("/providers/register", post(admin::register_provider))
        // System Status
        .route("/system/status", get(admin::get_system_status))
        .route("/system/pause", post(admin::pause_system))
        .route("/system/unpause", post(admin::unpause_system))
        // Analytics
        .route("/analytics/overview", get(admin::get_analytics_overview))
        // Edition
        .route("/edition/current", get(admin::get_current_edition))
        .route("/edition/switch", post(admin::switch_edition))
        // === Phase 8-C: Admin Transactions (8 EP) ===
        .route("/admin/transactions/locks/stats", get(admin::get_admin_lock_stats))
        .route("/admin/transactions/locks", get(admin::get_admin_locks))
        .route("/admin/transactions/locks/:id", get(admin::get_admin_lock_detail))
        .route("/admin/transactions/unlocks", get(admin::get_admin_unlocks))
        .route("/admin/transactions/unlocks/:id", get(admin::get_admin_unlock_detail))
        .route("/admin/transactions/emergency", get(admin::get_admin_emergency_unlocks))
        .route("/admin/transactions/emergency/:id", get(admin::get_admin_emergency_unlock_detail))
        .route("/admin/challenges", get(admin::get_admin_challenges))
        .route("/admin/challenges/:id/intervene", post(admin::admin_challenge_intervene))
        // === Phase 8-C: Admin Users (6 EP) ===
        .route("/admin/users", get(admin::get_admin_users))
        .route("/admin/users/:wallet_address", get(admin::get_admin_user_detail).put(admin::update_admin_user))
        .route("/admin/users/:wallet_address/locks", get(admin::get_admin_user_locks))
        .route("/admin/users/:wallet_address/unlocks", get(admin::get_admin_user_unlocks))
        .route("/admin/users/:wallet_address/suspend", post(admin::suspend_admin_user))
        // === Phase 8-C: Admin Observers (6 EP) ===
        .route("/admin/observers", get(admin::get_admin_observers))
        .route("/admin/observers/:id", get(admin::get_admin_observer_detail))
        .route("/admin/observers/:id/approve", post(admin::approve_admin_observer))
        .route("/admin/observers/:id/reject", post(admin::reject_admin_observer))
        .route("/admin/observers/:id/suspend", post(admin::suspend_admin_observer))
        .route("/admin/observers/:id/challenges", get(admin::get_admin_observer_challenges))
        // === Phase 8-C: Admin Treasury (10 EP) ===
        .route("/admin/treasury/overview", get(admin::get_admin_treasury_overview))
        .route("/admin/treasury/wallets", get(admin::get_admin_treasury_wallets))
        .route("/admin/treasury/wallets/:id", get(admin::get_admin_treasury_wallet_detail))
        .route("/admin/treasury/wallets/:id/transfer", post(admin::create_admin_treasury_transfer))
        .route("/admin/treasury/transfers", get(admin::get_admin_treasury_transfers))
        .route("/admin/treasury/transfers/:id", get(admin::get_admin_treasury_transfer_detail))
        .route("/admin/treasury/transfers/:id/approve", post(admin::approve_admin_treasury_transfer))
        .route("/admin/treasury/transfers/:id/execute", post(admin::execute_admin_treasury_transfer))
        .route("/admin/treasury/budget", get(admin::get_admin_treasury_budget))
        .route("/admin/treasury/audit", get(admin::get_admin_treasury_audit))
        // === Phase 8-C: Admin Governance (5 EP) ===
        .route("/admin/governance/proposals", get(admin::get_admin_governance_proposals))
        .route("/admin/governance/proposals/:id", get(admin::get_admin_governance_proposal_detail))
        .route("/admin/governance/proposals/:id/execute", post(admin::execute_admin_governance_proposal))
        .route("/admin/governance/council", get(admin::get_admin_governance_council))
        .route("/admin/governance/votes", get(admin::get_admin_governance_votes))
        // === Phase 8-C: Admin Settings/Members (2 EP) ===
        .route("/admin/settings/users", get(admin::get_settings_users).post(admin::create_settings_user))
        // === Phase 8-C: Admin Support (4 EP) ===
        .route("/admin/support/tickets", get(admin::get_support_tickets))
        .route("/admin/support/tickets/:id", get(admin::get_support_ticket_detail).put(admin::update_support_ticket))
        .route("/admin/support/faq", get(admin::get_support_faq).post(admin::create_admin_faq))
        // === Phase 8-C: Admin Announcements (2 EP) ===
        .route("/admin/support/announcements", get(admin::get_announcements).post(admin::create_announcement))
        // === Phase 8-C: Admin Analytics (3 EP) ===
        .route("/admin/analytics/users", get(admin::get_analytics_users))
        .route("/admin/analytics/revenue", get(admin::get_analytics_revenue))
        .route("/admin/analytics/reports", get(admin::get_analytics_reports))
        // === Phase 8-C: Admin System (2 EP) ===
        .route("/admin/system/alerts", get(admin::get_system_alerts))
        .route("/admin/system/maintenance", get(admin::get_system_maintenance))
        // === FE-BE Alignment: Missing Admin Stats Endpoints ===
        .route("/admin/transactions/stats", get(admin::get_admin_transactions_stats))
        .route("/admin/transactions/unlocks/stats", get(admin::get_admin_unlock_stats))
        .route("/admin/transactions/emergency/stats", get(admin::get_admin_emergency_stats))
        .route("/admin/transactions/challenges/stats", get(admin::get_admin_challenge_stats))
        .route("/admin/provers/stats", get(admin::get_admin_provers_stats))
        .route("/admin/observers/stats", get(admin::get_admin_observers_stats))
        .route("/admin/governance/stats", get(admin::get_admin_governance_stats))
        .route("/admin/governance/voting/stats", get(admin::get_admin_governance_voting_stats))
        .route("/admin/governance/voting/active", get(admin::get_admin_governance_voting_active))
        .route("/admin/users/stats", get(admin::get_admin_users_stats))
        .route("/admin/users/wallets/stats", get(admin::get_admin_users_wallets_stats))
        .route("/admin/users/wallets", get(admin::get_admin_users_wallets))
        .route("/admin/users/bulk/suspend", post(admin::bulk_suspend_admin_users))
        .route("/admin/users/:wallet_address/activate", post(admin::activate_admin_user))
        .route("/admin/treasury/transfers/stats", get(admin::get_admin_treasury_transfers_stats))
        .route("/admin/treasury/audit/stats", get(admin::get_admin_treasury_audit_stats))
        // === FE-BE Alignment: Members Management ===
        .route("/admin/members/stats", get(admin::get_admin_members_stats))
        .route("/admin/members/invite", post(admin::invite_admin_member))
        .route("/admin/members/roles", get(admin::get_admin_roles).post(admin::create_admin_role))
        .route("/admin/members/roles/:roleId", get(admin::get_admin_role_detail))
        .route("/admin/members/roles/:roleId/permissions", post(admin::update_admin_role_permissions))
        .route("/admin/members/:memberId/role", post(admin::update_admin_member_role))
        .route("/admin/members/:memberId/deactivate", post(admin::deactivate_admin_member))
        .route("/admin/members/:memberId/reactivate", post(admin::reactivate_admin_member))
        .route("/admin/members/:memberId/resend-invite", post(admin::resend_admin_member_invite))
        .route("/admin/members", get(admin::get_admin_members))
        // === FE-BE Alignment: Support Management ===
        .route("/admin/support/stats", get(admin::get_admin_support_stats))
        .route("/admin/support/faq/categories", get(admin::get_admin_faq_categories).post(admin::create_admin_faq_category))
        .route("/admin/support/faq/:id", get(admin::get_admin_faq_detail).post(admin::update_admin_faq))
        .route("/admin/support/tickets/:id/status", post(admin::update_admin_ticket_status))
        .route("/admin/support/tickets/:id/reply", post(admin::reply_admin_ticket))
        .route("/admin/support/tickets/:id/assign", post(admin::assign_admin_ticket))
        // === L1 Indexer Endpoints ===
        .route("/admin/l1/sync", post(admin::sync_l1_events))
        .route("/admin/l1/stats", get(admin::get_l1_stats))
        // === Dashboard Analytics Endpoints ===
        .route("/admin/dashboard/tvl-history", get(admin::get_tvl_history))
        .route("/admin/dashboard/volume-history", get(admin::get_volume_history))
        .route("/admin/dashboard/user-growth", get(admin::get_user_growth))
        .route("/admin/dashboard/stats", get(admin::get_dashboard_stats))
        .route("/admin/dashboard/activity", get(admin::get_dashboard_activity))
        // === Metrics History Endpoints (for stats tab charts) ===
        .route("/admin/dashboard/metrics/locks-count", get(admin::get_locks_count_history))
        .route("/admin/dashboard/metrics/locks-amount", get(admin::get_locks_amount_history))
        .route("/admin/dashboard/metrics/unlocks-count", get(admin::get_unlocks_count_history))
        .route("/admin/dashboard/metrics/unlocks-amount", get(admin::get_unlocks_amount_history))
        .route("/admin/dashboard/metrics/provers", get(admin::get_provers_history))
        .route("/admin/dashboard/metrics/observers", get(admin::get_observers_history))
        .route("/admin/dashboard/metrics/proposals", get(admin::get_proposals_history))
        .route("/admin/dashboard/metrics/treasury", get(admin::get_treasury_history))
        .route("/admin/dashboard/metrics/revenue", get(admin::get_revenue_history))
        // Apply admin JWT authentication to all protected routes
        .layer(middleware::from_fn_with_state(state.clone(), crate::middleware::admin_jwt_auth));

    // Merge public and protected routes
    public_routes
        .merge(protected_routes)
        .with_state(state)
}
