module stratafi::waterfall {
    use std::signer;
    use std::vector;
    use aptos_framework::timestamp;
    use aptos_framework::event;
    use aptos_framework::account;

    struct Payment has drop, store { 
        amount: u64, 
        timestamp: u64 
    }

    /// Tracks accrued yield targets and paid amounts per vault
    struct YieldState has key {
        vault_id: u64,
        senior_target: u64,
        mezz_target: u64,
        junior_target: u64,
        senior_paid: u64,
        mezz_paid: u64,
        junior_paid: u64,
        total_payments: u64,
        payment_history: vector<Payment>
    }

    struct WaterfallEvents has key {
        payment_events: event::EventHandle<PaymentProcessedEvent>,
        state_init_events: event::EventHandle<StateInitializedEvent>,
    }

    struct PaymentProcessedEvent has drop, store {
        vault_id: u64,
        amount: u64,
        senior_allocation: u64,
        mezz_allocation: u64,
        junior_allocation: u64,
        timestamp: u64,
    }

    struct StateInitializedEvent has drop, store {
        vault_id: u64,
        senior_target: u64,
        mezz_target: u64,
        junior_target: u64,
    }

    const E_NO_STATE: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;
    const E_INVALID_AMOUNT: u64 = 3;

    /// Initialize event handling
    public entry fun initialize(account: &signer) {
        let addr = signer::address_of(account);
        if (!exists<WaterfallEvents>(addr)) {
            move_to(account, WaterfallEvents {
                payment_events: account::new_event_handle<PaymentProcessedEvent>(account),
                state_init_events: account::new_event_handle<StateInitializedEvent>(account),
            });
        }
    }

    /// Initialize yield state for a vault
    public entry fun init_state(
        creator: &signer,
        vault_id: u64,
        senior_target: u64,
        mezz_target: u64,
        junior_target: u64
    ) acquires WaterfallEvents {
        let addr = signer::address_of(creator);
        assert!(!exists<YieldState>(addr), E_ALREADY_INITIALIZED);
        
        move_to(creator, YieldState {
            vault_id,
            senior_target,
            mezz_target,
            junior_target,
            senior_paid: 0,
            mezz_paid: 0,
            junior_paid: 0,
            total_payments: 0,
            payment_history: vector::empty<Payment>()
        });

        // Emit event
        if (exists<WaterfallEvents>(addr)) {
            let events = borrow_global_mut<WaterfallEvents>(addr);
            event::emit_event(&mut events.state_init_events, StateInitializedEvent {
                vault_id,
                senior_target,
                mezz_target,
                junior_target,
            });
        }
    }

    /// Atomic distribution of a payment across tranches
    /// This demonstrates Aptos's power - all distributions happen atomically in one transaction
    /// preventing the "legging risk" common on EVM chains where multiple sequential transactions are needed
    public entry fun process_payment(
        payer: &signer,
        vault_id: u64,
        amount: u64
    ) acquires YieldState, WaterfallEvents {
        assert!(amount > 0, E_INVALID_AMOUNT);
        
        let payer_addr = signer::address_of(payer);
        let state = borrow_global_mut<YieldState>(payer_addr);
        assert!(state.vault_id == vault_id, E_NO_STATE);
        
        let remaining = amount;
        let senior_allocation = 0u64;
        let mezz_allocation = 0u64;
        let junior_allocation = 0u64;
        
        // WATERFALL LOGIC - Senior tranche gets paid first
        let senior_due = if (state.senior_target > state.senior_paid) {
            state.senior_target - state.senior_paid
        } else { 0 };
        
        if (remaining > 0 && senior_due > 0) {
            let pay = if (remaining >= senior_due) { senior_due } else { remaining };
            state.senior_paid = state.senior_paid + pay;
            senior_allocation = pay;
            remaining = remaining - pay;
        };
        
        // Mezzanine tranche gets paid second
        let mezz_due = if (state.mezz_target > state.mezz_paid) {
            state.mezz_target - state.mezz_paid
        } else { 0 };
        
        if (remaining > 0 && mezz_due > 0) {
            let pay = if (remaining >= mezz_due) { mezz_due } else { remaining };
            state.mezz_paid = state.mezz_paid + pay;
            mezz_allocation = pay;
            remaining = remaining - pay;
        };
        
        // Junior tranche absorbs all residual (profits or losses)
        if (remaining > 0) {
            state.junior_paid = state.junior_paid + remaining;
            junior_allocation = remaining;
        };
        
        // Record payment
        let payment = Payment {
            amount,
            timestamp: timestamp::now_seconds()
        };
        vector::push_back(&mut state.payment_history, payment);
        state.total_payments = state.total_payments + amount;
        
        // Emit event
        if (exists<WaterfallEvents>(payer_addr)) {
            let events = borrow_global_mut<WaterfallEvents>(payer_addr);
            event::emit_event(&mut events.payment_events, PaymentProcessedEvent {
                vault_id,
                amount,
                senior_allocation,
                mezz_allocation,
                junior_allocation,
                timestamp: timestamp::now_seconds(),
            });
        }
    }

    /// Get current payment state
    public fun get_payment_state(owner: address): (u64, u64, u64, u64, u64, u64) acquires YieldState {
        if (!exists<YieldState>(owner)) {
            return (0, 0, 0, 0, 0, 0)
        };
        let state = borrow_global<YieldState>(owner);
        (
            state.senior_paid,
            state.senior_target,
            state.mezz_paid,
            state.mezz_target,
            state.junior_paid,
            state.total_payments
        )
    }
}
