import { AIProvider } from './aiProvider';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { FunctionsFetchError, FunctionsRelayError, FunctionsHttpError } from '@supabase/supabase-js';

export class NvidiaProvider extends AIProvider {
  /**
   * NVIDIA Gemma provider implementation.
   * Routes all calls securely through Supabase Edge Functions to protect API keys.
   */
  
  async _invokeEdgeFunction(action, payload) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Cannot invoke Edge Function.');
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-enrichment', {
        body: { action, provider: 'nvidia', ...payload },
      });

      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      if (error instanceof FunctionsFetchError) {
        throw new Error('Edge Function invocation failed: Function could not be reached. Check if the function is deployed and CORS is configured.');
      }
      if (error instanceof FunctionsRelayError) {
        throw new Error('Edge Function relay error: Check function name and Supabase URL.');
      }
      if (error instanceof FunctionsHttpError) {
        throw new Error(`Edge Function HTTP error (Status: ${error.context?.status || 'Unknown'}): The function returned an error.`);
      }
      throw new Error(`Edge function error: ${error.message}`);
    }
  }

  async analyzeCode(fileContent) {
    return this._invokeEdgeFunction('analyzeCode', { content: fileContent });
  }

  async extractMetadata(markdownContent) {
    return this._invokeEdgeFunction('extractMetadata', { content: markdownContent });
  }

  async findSecurityRisks(fileContent) {
    return this._invokeEdgeFunction('findSecurityRisks', { content: fileContent });
  }

  async enrichResource(payload) {
    return this._invokeEdgeFunction('RESOURCE_ENRICHMENT', payload);
  }
}
