// Type definitions for judilibre service

export interface EnrichDecisionResponse {
  success: boolean;
  data?: {
    decisionNumber: string;
    jurisdiction: string;
    date?: string;
    chamber?: string;
    solution?: string;
    summary?: string;
    fullText?: string;
    ecli?: string;
    judilibreId?: string;
    publication?: string;
    themes?: string[];
  };
  error?: string;
  message?: string;
}

export interface JudilibreAPI {
  enrichDecision(decisionNumber: string, jurisdiction: string): Promise<EnrichDecisionResponse>;
  getSuggestions(query: string, jurisdiction?: string): Promise<string[]>;
  downloadDecision(fileName: string): Promise<void>;
}

export declare const judilibreAPI: JudilibreAPI;