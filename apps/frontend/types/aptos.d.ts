interface AptosAccount { address: string }
interface AptosWallet {
  connect(): Promise<AptosAccount>
  disconnect(): Promise<void>
  account(): Promise<AptosAccount>
  isConnected?: boolean
}
declare global { interface Window { aptos?: AptosWallet } }
export {};