import { NvidiaProvider } from './providers/nvidiaProvider';

class AIProviderService {
  constructor() {
    this.providers = {
      'nvidia': new NvidiaProvider(),
    };
    
    // Default provider as specified in requirements
    this.activeProviderKey = 'nvidia';
  }

  getProvider() {
    const provider = this.providers[this.activeProviderKey];
    if (!provider) {
      throw new Error(`AI Provider ${this.activeProviderKey} not found.`);
    }
    return provider;
  }

  setActiveProvider(providerKey) {
    if (!this.providers[providerKey]) {
      throw new Error(`Invalid provider key: ${providerKey}`);
    }
    this.activeProviderKey = providerKey;
  }

  // --- Abstracted API ---

  async extractMetadata(markdownContent) {
    return this.getProvider().extractMetadata(markdownContent);
  }

  async analyzeCode(fileContent) {
    return this.getProvider().analyzeCode(fileContent);
  }

  async findSecurityRisks(fileContent) {
    return this.getProvider().findSecurityRisks(fileContent);
  }

  async enrichResource(payload) {
    return this.getProvider().enrichResource(payload);
  }
}

export const aiProviderService = new AIProviderService();
