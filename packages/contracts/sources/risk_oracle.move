module stratafi::risk_oracle {
    use std::signer;
    use std::vector;
    use aptos_framework::timestamp;
    use aptos_framework::event;
    use aptos_framework::account;

    struct ScoreEntry has copy, drop, store {
        score: u64,
        timestamp: u64,
        risk_factors: RiskFactors
    }

    struct RiskFactors has copy, drop, store {
        asset_diversity: u64,  // 0-100
        ltv_ratio: u64,        // 0-100  
        originator_reputation: u64,  // 0-100
        market_conditions: u64,  // 0-100
    }

    struct HealthScore has key {
        vault_id: u64,
        current: u64,
        last_updated: u64,
        history: vector<ScoreEntry>,
        authorized_updater: address,
        risk_factors: RiskFactors,
    }

    struct OracleEvents has key {
        score_update_events: event::EventHandle<ScoreUpdateEvent>,
        oracle_init_events: event::EventHandle<OracleInitEvent>,
    }

    struct ScoreUpdateEvent has drop, store {
        vault_id: u64,
        old_score: u64,
        new_score: u64,
        updater: address,
        timestamp: u64,
    }

    struct OracleInitEvent has drop, store {
        vault_id: u64,
        initial_score: u64,
        authorized_updater: address,
    }

    const E_UNAUTHORIZED: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;
    const E_INVALID_SCORE: u64 = 3;
    const MAX_SCORE: u64 = 100;

    /// Initialize event handling
    public entry fun initialize_events(account: &signer) {
        let addr = signer::address_of(account);
        if (!exists<OracleEvents>(addr)) {
            move_to(account, OracleEvents {
                score_update_events: account::new_event_handle<ScoreUpdateEvent>(account),
                oracle_init_events: account::new_event_handle<OracleInitEvent>(account),
            });
        }
    }

    /// Initialize health score for a vault
    public entry fun init(
        vault_owner: &signer,
        vault_id: u64,
        initial_score: u64,
        updater: address
    ) acquires OracleEvents {
        assert!(initial_score <= MAX_SCORE, E_INVALID_SCORE);
        
        let owner_addr = signer::address_of(vault_owner);
        assert!(!exists<HealthScore>(owner_addr), E_ALREADY_INITIALIZED);
        
        let initial_factors = RiskFactors {
            asset_diversity: 50,
            ltv_ratio: 50,
            originator_reputation: 50,
            market_conditions: 50,
        };
        
        move_to(vault_owner, HealthScore {
            vault_id,
            current: initial_score,
            last_updated: timestamp::now_seconds(),
            history: vector::empty<ScoreEntry>(),
            authorized_updater: updater,
            risk_factors: initial_factors,
        });
        
        // Emit event
        if (exists<OracleEvents>(owner_addr)) {
            let events = borrow_global_mut<OracleEvents>(owner_addr);
            event::emit_event(&mut events.oracle_init_events, OracleInitEvent {
                vault_id,
                initial_score,
                authorized_updater: updater,
            });
        }
    }

    /// Update health score with detailed risk factors
    public entry fun update_health_score_with_factors(
        updater_signer: &signer,
        vault_owner: address,
        new_score: u64,
        asset_diversity: u64,
        ltv_ratio: u64,
        originator_reputation: u64,
        market_conditions: u64
    ) acquires HealthScore, OracleEvents {
        assert!(new_score <= MAX_SCORE, E_INVALID_SCORE);
        assert!(asset_diversity <= MAX_SCORE, E_INVALID_SCORE);
        assert!(ltv_ratio <= MAX_SCORE, E_INVALID_SCORE);
        assert!(originator_reputation <= MAX_SCORE, E_INVALID_SCORE);
        assert!(market_conditions <= MAX_SCORE, E_INVALID_SCORE);
        
        let updater_addr = signer::address_of(updater_signer);
        let hs = borrow_global_mut<HealthScore>(vault_owner);
        assert!(hs.authorized_updater == updater_addr, E_UNAUTHORIZED);
        
        let old_score = hs.current;
        let current_time = timestamp::now_seconds();
        
        let new_factors = RiskFactors {
            asset_diversity,
            ltv_ratio,
            originator_reputation,
            market_conditions,
        };
        
        let entry = ScoreEntry {
            score: new_score,
            timestamp: current_time,
            risk_factors: new_factors,
        };
        
        // Keep history limited to last 100 entries
        if (vector::length(&hs.history) >= 100) {
            vector::remove(&mut hs.history, 0);
        };
        vector::push_back(&mut hs.history, entry);
        
        hs.current = new_score;
        hs.last_updated = current_time;
        hs.risk_factors = new_factors;
        
        // Emit event
        if (exists<OracleEvents>(vault_owner)) {
            let events = borrow_global_mut<OracleEvents>(vault_owner);
            event::emit_event(&mut events.score_update_events, ScoreUpdateEvent {
                vault_id: hs.vault_id,
                old_score,
                new_score,
                updater: updater_addr,
                timestamp: current_time,
            });
        }
    }

    /// Simple update without risk factors (backward compatible)
    public entry fun update_health_score(
        updater_signer: &signer,
        vault_owner: address,
        new_score: u64
    ) acquires HealthScore, OracleEvents {
        update_health_score_with_factors(
            updater_signer,
            vault_owner,
            new_score,
            50, // default values
            50,
            50,
            50
        );
    }

    /// Get current score
    public fun get_score(vault_owner: address): u64 acquires HealthScore {
        if (!exists<HealthScore>(vault_owner)) {
            return 0
        };
        borrow_global<HealthScore>(vault_owner).current
    }

    /// Get risk factors
    public fun get_risk_factors(vault_owner: address): (u64, u64, u64, u64) acquires HealthScore {
        if (!exists<HealthScore>(vault_owner)) {
            return (0, 0, 0, 0)
        };
        let hs = borrow_global<HealthScore>(vault_owner);
        (
            hs.risk_factors.asset_diversity,
            hs.risk_factors.ltv_ratio,
            hs.risk_factors.originator_reputation,
            hs.risk_factors.market_conditions
        )
    }
}
