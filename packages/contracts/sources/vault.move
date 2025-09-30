module stratafi::vault {
	use std::signer;
	use std::vector;
	use std::string;
	use aptos_framework::account;
	use aptos_framework::event;
	use aptos_framework::timestamp;

	/// Represents a single real-world asset (simplified for hackathon)
	struct RWA has copy, drop, store {
		id: u64,
		value: u64, // denominated in minor units of a stablecoin proxy
		asset_type: string::String,
		originator: address,
	}

	/// Vault resource holding a collection of RWAs
	struct Vault has key {
		id: u64,
		owner: address,
		created_ts: u64,
		assets: vector<RWA>,
		total_value: u64,
	}

	struct VaultCreatedEvent has drop, store { id: u64, owner: address }
	struct RWAAddedEvent has drop, store { vault_id: u64, rwa_id: u64, value: u64 }

	struct Events has key { vault_created_events: event::EventHandle<VaultCreatedEvent>, rwa_added_events: event::EventHandle<RWAAddedEvent> }

	const E_NOT_OWNER: u64 = 1;

	public entry fun initialize(account: &signer) {
		let addr = signer::address_of(account);
		if (!exists<Events>(addr)) {
			move_to(account, Events { 
				vault_created_events: account::new_event_handle<VaultCreatedEvent>(account), 
				rwa_added_events: account::new_event_handle<RWAAddedEvent>(account) 
			});
		}
	}

	/// Create a new vault with an initial set of RWAs
	public entry fun create_vault(creator: &signer, id: u64, assets: vector<RWA>) acquires Events {
		let owner = signer::address_of(creator);
		let total_value = sum_values(&assets);
		let vault = Vault { 
			id, 
			owner, 
			created_ts: timestamp::now_seconds(), 
			assets, 
			total_value 
		};
		move_to(creator, vault);
		emit_created(owner, id);
	}

	/// Add a new RWA to caller's vault
	public entry fun add_rwa(caller: &signer, vault_id: u64, rwa: RWA) acquires Vault, Events {
		let owner = signer::address_of(caller);
		let vault_addr = owner; // vault stored under owner for simplicity
		let vault = borrow_global_mut<Vault>(vault_addr);
		assert!(vault.id == vault_id, E_NOT_OWNER);
		vector::push_back(&mut vault.assets, rwa);
		vault.total_value = sum_values(&vault.assets);
		let rwa_id = vector::length(&vault.assets) - 1;
		emit_rwa_added(owner, vault_id, rwa_id, rwa.value);
	}

	/// View function (pure) to get total value
	public fun get_total_value(owner: address): u64 acquires Vault { borrow_global<Vault>(owner).total_value }

	public fun new_rwa(id: u64, value: u64, asset_type: string::String, originator: address): RWA { RWA { id, value, asset_type, originator } }

	fun sum_values(assets: &vector<RWA>): u64 { let total = 0u64; let i = 0; let len = vector::length(assets); while (i < len) { let a = *vector::borrow(assets, i); total = total + a.value; i = i + 1; }; total }

	fun emit_created(owner: address, id: u64) acquires Events {
		let events = borrow_global_mut<Events>(owner);
		event::emit_event(&mut events.vault_created_events, VaultCreatedEvent { id, owner });
	}

	fun emit_rwa_added(owner: address, vault_id: u64, rwa_id: u64, value: u64) acquires Events {
		let events = borrow_global_mut<Events>(owner);
		event::emit_event(&mut events.rwa_added_events, RWAAddedEvent { vault_id, rwa_id, value });
	}
}
