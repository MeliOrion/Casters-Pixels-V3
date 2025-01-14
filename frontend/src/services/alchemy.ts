import { Alchemy, Network } from 'alchemy-sdk';

export class AlchemyService {
  private readonly apiKey: string;
  private readonly tokenAddress: string;
  private readonly baseUrl: string;
  private readonly cache: Map<string, { data: any; timestamp: number }>;
  private readonly retryDelay: number = 1000; // Start with 1 second delay
  private readonly maxRetries: number = 5;

  constructor(apiKey: string, tokenAddress: string) {
    this.apiKey = apiKey;
    this.tokenAddress = tokenAddress;
    this.baseUrl = `https://base-mainnet.g.alchemy.com/v2/${apiKey}`;
    this.cache = new Map();
  }

  private async fetchWithRetry(url: string, options: RequestInit, retries = 0): Promise<Response> {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429 && retries < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, retries); // Exponential backoff
        console.log(`Rate limited, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, options, retries + 1);
      }
      
      return response;
    } catch (error) {
      if (retries < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, retries);
        console.log(`Request failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, options, retries + 1);
      }
      throw error;
    }
  }

  private getCacheKey(method: string, params: any[]): string {
    return `${method}:${JSON.stringify(params)}`;
  }

  private async makeRequest(method: string, params: any[], cacheTime = 30000): Promise<any> {
    const cacheKey = this.getCacheKey(method, params);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < cacheTime) {
      return cached.data;
    }

    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        params
      })
    };

    try {
      const response = await this.fetchWithRetry(this.baseUrl, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'RPC Error');
      }

      this.cache.set(cacheKey, {
        data: data.result,
        timestamp: Date.now()
      });

      return data.result;
    } catch (error) {
      console.error(`Error making request to ${method}:`, error);
      throw error;
    }
  }

  async getTokenBalance(address: string): Promise<bigint> {
    try {
      const data = await this.makeRequest('eth_call', [{
        to: this.tokenAddress,
        data: `0x70a08231000000000000000000000000${address.slice(2)}`
      }, 'latest']);
      
      return BigInt(data);
    } catch (error) {
      console.error('Error getting token balance:', error);
      throw error;
    }
  }

  async getTransferHistory(address: string) {
    try {
      const transfers = await this.makeRequest('alchemy_getAssetTransfers', [{
        fromBlock: "0x0",
        toBlock: "latest",
        category: ["erc20"],
        withMetadata: true,
        excludeZeroValue: true,
        contractAddresses: [this.tokenAddress],
        fromAddress: address
      }]);

      return transfers;
    } catch (error) {
      console.error('Error getting transfer history:', error);
      return [];
    }
  }

  async setupWebhooks(webhookUrl: string) {
    // Implementation for webhook setup
    // This would typically involve registering webhooks with Alchemy's API
    console.log('Setting up webhooks with URL:', webhookUrl);
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
      const metadata = await this.makeRequest('eth_call', [{
        to: this.tokenAddress,
        data: '0x06fdde03'
      }, 'latest']);
      
      return metadata;
    } catch (error) {
      console.error('Error getting token metadata:', error);
      throw error;
    }
  }
}
