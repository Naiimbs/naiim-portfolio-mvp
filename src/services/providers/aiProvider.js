export class AIProvider {
  /**
   * Abstract base class for AI Providers.
   * Do not implement logic here; extend this class per provider.
   */
  async analyzeCode(fileContent) {
    throw new Error('Not implemented: analyzeCode');
  }

  async extractMetadata(markdownContent) {
    throw new Error('Not implemented: extractMetadata');
  }

  async findSecurityRisks(fileContent) {
    throw new Error('Not implemented: findSecurityRisks');
  }
}
