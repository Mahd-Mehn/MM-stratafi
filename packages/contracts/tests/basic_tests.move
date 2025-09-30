module stratafi::basic_tests {
    use stratafi::vault;
    use stratafi::waterfall;
    use stratafi::risk_oracle;
    use stratafi::tranche;
    use std::string;
    use std::vector;

    #[test]
    public fun test_vault_and_waterfall(sender: &signer) {
        vault::init(sender);
        let assets = vector::empty<vault::RWA>();
        let a1 = vault::new_rwa(1, 100, string::utf8(b"invoice"), signer::address_of(sender));
        vector::push_back(&mut assets, a1);
        vault::create_vault(sender, 1, assets);
        tranche::mint_tranches(sender, 1, 1000, 500, 250);
        waterfall::init_state(sender, 1, 50, 30, 0);
        waterfall::process_payment(sender, 1, 70);
    }

    #[test]
    public fun test_partial_payment(sender: &signer) {
        waterfall::init_state(sender, 2, 100, 50, 0);
        // Pay only part of senior
        waterfall::process_payment(sender, 2, 40);
    }

    #[test]
    public fun test_overpayment(sender: &signer) {
        waterfall::init_state(sender, 3, 50, 30, 0);
        // Excess flows to junior
        waterfall::process_payment(sender, 3, 120);
    }
}
