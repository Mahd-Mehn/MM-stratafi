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
	const E_LENGTH_MISMATCH: u64 = 2;

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
	public entry fun create_vault(creator: &signer, id: u64) acquires Events {
		let owner = signer::address_of(creator);
		let assets = vector::empty<RWA>();
		let total_value = 0u64;
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
	public entry fun add_rwa(
		caller: &signer,
		vault_id: u64,
		rwa_id: u64,
		value: u64,
		asset_type_utf8: vector<u8>,
		originator: address
	) acquires Vault, Events {
		let owner = signer::address_of(caller);
		let vault_addr = owner; // vault stored under owner for simplicity
		let vault = borrow_global_mut<Vault>(vault_addr);
		assert!(vault.id == vault_id, E_NOT_OWNER);
		let asset_type = string::utf8(asset_type_utf8);
		let rwa = RWA { id: rwa_id, value, asset_type, originator };
		vector::push_back(&mut vault.assets, rwa);
		vault.total_value = sum_values(&vault.assets);
		let new_index = vector::length(&vault.assets) - 1;
		emit_rwa_added(owner, vault_id, new_index, value);
	}

	/// Add multiple RWAs in one tx (pops from the back of each vector)
	public entry fun add_rwas(
		caller: &signer,
		vault_id: u64,
		ids: vector<u64>,
		values: vector<u64>,
		asset_types_utf8: vector<vector<u8>>,
		originators: vector<address>
	) acquires Vault, Events {
		let owner = signer::address_of(caller);
		let vault = borrow_global_mut<Vault>(owner);
		assert!(vault.id == vault_id, E_NOT_OWNER);

		let l_ids = vector::length(&ids);
		let l_vals = vector::length(&values);
		let l_types = vector::length(&asset_types_utf8);
		let l_orig = vector::length(&originators);
		assert!(l_ids == l_vals && l_vals == l_types && l_types == l_orig, E_LENGTH_MISMATCH);

		let ids_mut = ids;
		let values_mut = values;
		let types_mut = asset_types_utf8;
		let origins_mut = originators;

		while (vector::length(&ids_mut) > 0) {
			let id = vector::pop_back(&mut ids_mut);
			let val = vector::pop_back(&mut values_mut);
			let at_bytes = vector::pop_back(&mut types_mut);
			let origin = vector::pop_back(&mut origins_mut);
			let asset_type = string::utf8(at_bytes);
			let rwa = RWA { id, value: val, asset_type, originator: origin };
			vector::push_back(&mut vault.assets, rwa);
			let idx = vector::length(&vault.assets) - 1;
			emit_rwa_added(owner, vault_id, idx, val);
		};

		vault.total_value = sum_values(&vault.assets);
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
