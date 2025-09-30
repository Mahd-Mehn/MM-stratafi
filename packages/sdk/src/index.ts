import { AptosClient } from 'aptos';

export interface StrataFiConfig { nodeUrl: string; moduleAddress: string; }

export class StrataFiSDK {
  private client: AptosClient;
  private moduleAddress: string;
  constructor(cfg: StrataFiConfig){ this.client = new AptosClient(cfg.nodeUrl); this.moduleAddress = cfg.moduleAddress; }

  async getHealthScore(vaultOwner: string): Promise<number> {
    try {
      const res: any = await this.client.view({
        function: `${this.moduleAddress}::risk_oracle::get_score`,
        type_arguments: [],
        arguments: [vaultOwner]
      });
      return Number(res[0] || 0);
    } catch { return 0; }
  }

  async getTrancheSupplies(owner: string): Promise<{ senior: number; mezz: number; junior: number }> {
    try {
      const res: any = await this.client.view({
        function: `${this.moduleAddress}::tranche::get_tranche_supplies`,
        type_arguments: [],
        arguments: [owner]
      });
      return { senior: Number(res[0]||0), mezz: Number(res[1]||0), junior: Number(res[2]||0) };
    } catch {
      return { senior:0, mezz:0, junior:0 };
    }
  }

  buildInvestPayload(vaultId: number, tranche: number, amount: number){
    return {
      function: `${this.moduleAddress}::tranche::invest`,
      type_arguments: [],
      arguments: [vaultId.toString(), tranche, amount.toString()]
    };
  }
}

