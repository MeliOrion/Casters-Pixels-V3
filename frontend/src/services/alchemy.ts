import { Alchemy, Network, TokenBalanceType } from 'alchemy-sdk';

export class AlchemyService {
  private alchemy: Alchemy;
  private tokenAddress: string;

  constructor(apiKey: string, tokenAddress: string) {
    this.alchemy = new Alchemy({
      apiKey,
      network: Network.ETH_SEPOLIA,
    });
    this.tokenAddress = tokenAddress;
  }

  async getTokenBalance(address: string): Promise<bigint> {
    try {
      const balance = await this.alchemy.core.getTokenBalance(
        address,
        this.tokenAddress,
        TokenBalanceType.ERC20
      );
      return BigInt(balance.toString());
    } catch (error) {
      console.error('Error getting token balance:', error);
      throw error;
    }
  }

  async setupWebhooks(webhookUrl: string) {
    try {
      // Setup webhook for address activity (token transfers)
      await this.alchemy.notify.createWebhook(
        webhookUrl,
        {
          type: 'ADDRESS_ACTIVITY',
          addresses: [this.tokenAddress],
          network: Network.ETH_SEPOLIA,
        }
      );

      // Setup webhook for mined transactions
      await this.alchemy.notify.createWebhook(
        webhookUrl,
        {
          type: 'MINED_TRANSACTION',
          network: Network.ETH_SEPOLIA,
        }
      );

      // Setup webhook for dropped transactions
      await this.alchemy.notify.createWebhook(
        webhookUrl,
        {
          type: 'DROPPED_TRANSACTION',
          network: Network.ETH_SEPOLIA,
        }
      );

      console.log('Webhooks setup successfully');
    } catch (error) {
      console.error('Error setting up webhooks:', error);
      throw error;
    }
  }

  async handleWebhook(data: any) {
    try {
      switch (data.type) {
        case 'ADDRESS_ACTIVITY':
          // Handle token transfers
          const transfer = data.event;
          if (transfer.toAddress === this.tokenAddress) {
            // Token burn event
            console.log('Token burn detected:', transfer);
          } else if (transfer.value && BigInt(transfer.value) >= BigInt(1000)) {
            // Possible generation request
            console.log('Possible generation request:', transfer);
          }
          break;

        case 'MINED_TRANSACTION':
          // Handle successful transactions
          console.log('Transaction mined:', data.transaction.hash);
          // You can emit an event or update UI here
          break;

        case 'DROPPED_TRANSACTION':
          // Handle dropped transactions
          console.log('Transaction dropped:', data.transaction.hash);
          // You can trigger a retry or show error message
          break;

        default:
          console.log('Unknown webhook type:', data.type);
      }
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  }

  async getTokenMetadata() {
    try {
      const metadata = await this.alchemy.core.getTokenMetadata(this.tokenAddress);
      return metadata;
    } catch (error) {
      console.error('Error getting token metadata:', error);
      throw error;
    }
  }

  async getTransferHistory(address: string) {
    try {
      const transfers = await this.alchemy.core.getAssetTransfers({
        fromBlock: '0x0',
        toAddress: address,
        contractAddresses: [this.tokenAddress],
        category: ['erc20'],
      });
      return transfers;
    } catch (error) {
      console.error('Error getting transfer history:', error);
      throw error;
    }
  }
}
