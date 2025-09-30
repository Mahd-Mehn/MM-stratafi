module stratafi::tranche {
    use std::signer;
    use std::vector;
    use std::string;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::account;
    use aptos_framework::event;

    /// Simplified token representation for tranches
    struct TrancheToken<phantom T> has store {
        amount: u64,
    }

    struct TrancheVault has key {
        vault_id: u64,
        senior_tokens: Coin<SeniorCoin>,
        mezz_tokens: Coin<MezzCoin>,
        junior_tokens: Coin<JuniorCoin>,
        senior_supply: u64,
        mezz_supply: u64,
        junior_supply: u64,
    }

    struct SeniorCoin {}
    struct MezzCoin {}
    struct JuniorCoin {}

    struct TrancheEvents has key {
        mint_events: event::EventHandle<MintEvent>,
        invest_events: event::EventHandle<InvestEvent>,
    }

    struct MintEvent has drop, store {
        vault_id: u64,
        senior_amount: u64,
        mezz_amount: u64,
        junior_amount: u64,
    }

    struct InvestEvent has drop, store {
        vault_id: u64,
        tranche: u8,
        amount: u64,
        investor: address,
    }

    const SENIOR: u8 = 0;
    const MEZZ: u8 = 1;
    const JUNIOR: u8 = 2;
    
    const E_ALREADY_INITIALIZED: u64 = 10;
    const E_INVALID_TRANCHE: u64 = 11;
    const E_VAULT_NOT_EXISTS: u64 = 12;

    /// Initialize the tranche system
    public entry fun initialize(creator: &signer) {
        let addr = signer::address_of(creator);
        if (!exists<TrancheEvents>(addr)) {
            move_to(creator, TrancheEvents {
                mint_events: account::new_event_handle<MintEvent>(creator),
                invest_events: account::new_event_handle<InvestEvent>(creator),
            });
        }
        
        // Initialize coin types if needed
        if (!coin::is_coin_initialized<SeniorCoin>()) {
            let (burn_cap, freeze_cap, mint_cap) = coin::initialize<SeniorCoin>(
                creator,
                string::utf8(b"StrataFi Senior"),
                string::utf8(b"sSFI"),
                6,
                true,
            );
            coin::destroy_freeze_cap(freeze_cap);
            coin::register_for_burn_and_mint(creator, burn_cap, mint_cap);
        }
        
        if (!coin::is_coin_initialized<MezzCoin>()) {
            let (burn_cap, freeze_cap, mint_cap) = coin::initialize<MezzCoin>(
                creator,
                string::utf8(b"StrataFi Mezzanine"),
                string::utf8(b"mSFI"),
                6,
                true,
            );
            coin::destroy_freeze_cap(freeze_cap);
            coin::register_for_burn_and_mint(creator, burn_cap, mint_cap);
        }
        
        if (!coin::is_coin_initialized<JuniorCoin>()) {
            let (burn_cap, freeze_cap, mint_cap) = coin::initialize<JuniorCoin>(
                creator,
                string::utf8(b"StrataFi Junior"),
                string::utf8(b"jSFI"),
                6,
                true,
            );
            coin::destroy_freeze_cap(freeze_cap);
            coin::register_for_burn_and_mint(creator, burn_cap, mint_cap);
        }
    }

    /// Create tranches for a vault
    public entry fun mint_tranches(
        creator: &signer,
        vault_id: u64,
        senior_amount: u64,
        mezz_amount: u64,
        junior_amount: u64
    ) acquires TrancheEvents {
        let addr = signer::address_of(creator);
        assert!(!exists<TrancheVault>(addr), E_ALREADY_INITIALIZED);
        
        // Create the vault with initial supplies
        let vault = TrancheVault {
            vault_id,
            senior_tokens: coin::zero<SeniorCoin>(),
            mezz_tokens: coin::zero<MezzCoin>(),
            junior_tokens: coin::zero<JuniorCoin>(),
            senior_supply: senior_amount,
            mezz_supply: mezz_amount,
            junior_supply: junior_amount,
        };
        
        move_to(creator, vault);
        
        // Emit event
        if (exists<TrancheEvents>(addr)) {
            let events = borrow_global_mut<TrancheEvents>(addr);
            event::emit_event(&mut events.mint_events, MintEvent {
                vault_id,
                senior_amount,
                mezz_amount,
                junior_amount,
            });
        }
    }

    /// Invest in a specific tranche
    public entry fun invest(
        investor: &signer,
        vault_owner: address,
        vault_id: u64,
        tranche: u8,
        amount: u64
    ) acquires TrancheVault, TrancheEvents {
        let investor_addr = signer::address_of(investor);
        assert!(exists<TrancheVault>(vault_owner), E_VAULT_NOT_EXISTS);
        
        let vault = borrow_global_mut<TrancheVault>(vault_owner);
        assert!(vault.vault_id == vault_id, E_VAULT_NOT_EXISTS);
        
        // Update supply based on tranche
        if (tranche == SENIOR) {
            vault.senior_supply = vault.senior_supply + amount;
        } else if (tranche == MEZZ) {
            vault.mezz_supply = vault.mezz_supply + amount;
        } else if (tranche == JUNIOR) {
            vault.junior_supply = vault.junior_supply + amount;
        } else {
            abort E_INVALID_TRANCHE
        };
        
        // Emit event
        if (exists<TrancheEvents>(vault_owner)) {
            let events = borrow_global_mut<TrancheEvents>(vault_owner);
            event::emit_event(&mut events.invest_events, InvestEvent {
                vault_id,
                tranche,
                amount,
                investor: investor_addr,
            });
        }
    }

    /// Get tranche supplies
    public fun get_tranche_supplies(owner: address): (u64, u64, u64) acquires TrancheVault {
        if (!exists<TrancheVault>(owner)) {
            return (0, 0, 0)
        };
        let vault = borrow_global<TrancheVault>(owner);
        (vault.senior_supply, vault.mezz_supply, vault.junior_supply)
    }
}
