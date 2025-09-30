module stratafi::tranche {
    use std::signer;
    use std::string;
    use aptos_framework::event;
    use aptos_framework::coin;
    use aptos_framework::account;

    /// Phantom marker types for tranche coins
    struct SeniorCoin has store {}
    struct MezzCoin has store {}
    struct JuniorCoin has store {}

    /// Capability storage under the deployer (creator) account
    struct SeniorCoinCapabilities has key {
        burn_cap: coin::BurnCapability<SeniorCoin>,
        mint_cap: coin::MintCapability<SeniorCoin>,
    }
    struct MezzCoinCapabilities has key {
        burn_cap: coin::BurnCapability<MezzCoin>,
        mint_cap: coin::MintCapability<MezzCoin>,
    }
    struct JuniorCoinCapabilities has key {
        burn_cap: coin::BurnCapability<JuniorCoin>,
        mint_cap: coin::MintCapability<JuniorCoin>,
    }

    /// Events for minting and investing
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
    struct TrancheEvents has key {
        mint_events: event::EventHandle<MintEvent>,
        invest_events: event::EventHandle<InvestEvent>,
    }

    /// Simple vault tracking supplies by tranche
    struct TrancheVault has key {
        vault_id: u64,
        senior_supply: u64,
        mezz_supply: u64,
        junior_supply: u64,
    }

    const SENIOR: u8 = 0;
    const MEZZ: u8 = 1;
    const JUNIOR: u8 = 2;

    const E_ALREADY_INITIALIZED: u64 = 10;
    const E_INVALID_TRANCHE: u64 = 11;
    const E_VAULT_NOT_EXISTS: u64 = 12;

    /// Initialize tranche system and coins; creator keeps mint/burn caps
    public entry fun initialize(creator: &signer) {
        let addr = signer::address_of(creator);
        if (!exists<TrancheEvents>(addr)) {
            move_to(creator, TrancheEvents {
                mint_events: account::new_event_handle<MintEvent>(creator),
                invest_events: account::new_event_handle<InvestEvent>(creator),
            });
        };

        // Senior coin
        if (!coin::is_coin_initialized<SeniorCoin>()) {
            let (burn_cap, freeze_cap, mint_cap) = coin::initialize<SeniorCoin>(
                creator,
                string::utf8(b"StrataFi Senior"),
                string::utf8(b"sSFI"),
                6,
                true,
            );
            coin::destroy_freeze_cap(freeze_cap);
            move_to(creator, SeniorCoinCapabilities { burn_cap, mint_cap });
            if (!coin::is_account_registered<SeniorCoin>(addr)) { coin::register<SeniorCoin>(creator); }
        };

        // Mezz coin
        if (!coin::is_coin_initialized<MezzCoin>()) {
            let (burn_cap, freeze_cap, mint_cap) = coin::initialize<MezzCoin>(
                creator,
                string::utf8(b"StrataFi Mezzanine"),
                string::utf8(b"mSFI"),
                6,
                true,
            );
            coin::destroy_freeze_cap(freeze_cap);
            move_to(creator, MezzCoinCapabilities { burn_cap, mint_cap });
            if (!coin::is_account_registered<MezzCoin>(addr)) { coin::register<MezzCoin>(creator); }
        };

        // Junior coin
        if (!coin::is_coin_initialized<JuniorCoin>()) {
            let (burn_cap, freeze_cap, mint_cap) = coin::initialize<JuniorCoin>(
                creator,
                string::utf8(b"StrataFi Junior"),
                string::utf8(b"jSFI"),
                6,
                true,
            );
            coin::destroy_freeze_cap(freeze_cap);
            move_to(creator, JuniorCoinCapabilities { burn_cap, mint_cap });
            if (!coin::is_account_registered<JuniorCoin>(addr)) { coin::register<JuniorCoin>(creator); }
        };
    }

    /// Create a vault and emit mint event with target supplies
    public entry fun mint_tranches(
        creator: &signer,
        vault_id: u64,
        senior_amount: u64,
        mezz_amount: u64,
        junior_amount: u64
    ) acquires TrancheEvents {
        let addr = signer::address_of(creator);
        // Only one vault per owner for this demo
        assert!(!exists<TrancheVault>(addr), E_ALREADY_INITIALIZED);

        move_to(creator, TrancheVault {
            vault_id,
            senior_supply: senior_amount,
            mezz_supply: mezz_amount,
            junior_supply: junior_amount,
        });

        if (exists<TrancheEvents>(addr)) {
            let events = borrow_global_mut<TrancheEvents>(addr);
            event::emit_event(&mut events.mint_events, MintEvent { vault_id, senior_amount, mezz_amount, junior_amount });
        };
    }

    /// Invest increases supply (demo) and emits event
    public entry fun invest(
        investor: &signer,
        vault_owner: address,
        vault_id: u64,
        tranche: u8,
        amount: u64
    ) acquires TrancheVault, TrancheEvents {
        assert!(exists<TrancheVault>(vault_owner), E_VAULT_NOT_EXISTS);
        let inv_addr = signer::address_of(investor);
        let vault = borrow_global_mut<TrancheVault>(vault_owner);
        assert!(vault.vault_id == vault_id, E_VAULT_NOT_EXISTS);

        if (tranche == SENIOR) {
            vault.senior_supply = vault.senior_supply + amount;
        } else if (tranche == MEZZ) {
            vault.mezz_supply = vault.mezz_supply + amount;
        } else if (tranche == JUNIOR) {
            vault.junior_supply = vault.junior_supply + amount;
        } else { abort E_INVALID_TRANCHE };

        if (exists<TrancheEvents>(vault_owner)) {
            let events = borrow_global_mut<TrancheEvents>(vault_owner);
            event::emit_event(&mut events.invest_events, InvestEvent { vault_id, tranche, amount, investor: inv_addr });
        };
    }

    /// Admin minters (recipient must be registered for the respective coin)
    public entry fun mint_senior_to(admin: &signer, recipient: &signer, amount: u64) acquires SeniorCoinCapabilities {
        let admin_addr = signer::address_of(admin);
        let to_addr = signer::address_of(recipient);

        if (!coin::is_account_registered<SeniorCoin>(to_addr)) {
            coin::register<SeniorCoin>(recipient);
        };

        let caps = borrow_global<SeniorCoinCapabilities>(admin_addr);
        let coins = coin::mint(amount, &caps.mint_cap);
        coin::deposit(to_addr, coins);
    }

    public entry fun mint_mezz_to(admin: &signer, recipient: &signer, amount: u64) acquires MezzCoinCapabilities {
        let admin_addr = signer::address_of(admin);
        let to_addr = signer::address_of(recipient);

        if (!coin::is_account_registered<MezzCoin>(to_addr)) {
            coin::register<MezzCoin>(recipient);
        };

        let caps = borrow_global<MezzCoinCapabilities>(admin_addr);
        let coins = coin::mint(amount, &caps.mint_cap);
        coin::deposit(to_addr, coins);
    }

    public entry fun mint_junior_to(admin: &signer, recipient: &signer, amount: u64) acquires JuniorCoinCapabilities {
        let admin_addr = signer::address_of(admin);
        let to_addr = signer::address_of(recipient);

        if (!coin::is_account_registered<JuniorCoin>(to_addr)) {
            coin::register<JuniorCoin>(recipient);
        };

        let caps = borrow_global<JuniorCoinCapabilities>(admin_addr);
        let coins = coin::mint(amount, &caps.mint_cap);
        coin::deposit(to_addr, coins);
    }

    public fun get_tranche_supplies(owner: address): (u64, u64, u64) acquires TrancheVault {
        if (!exists<TrancheVault>(owner)) { return (0, 0, 0) };
        let v = borrow_global<TrancheVault>(owner);
        (v.senior_supply, v.mezz_supply, v.junior_supply)
    }
}
