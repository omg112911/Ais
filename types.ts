export interface GenerationConfig {
    model: string;
    systemInstruction: string;
    temperature: number;
    topK: number;
    topP: number;
    maxOutputTokens: number;
}

export interface GroundingChunk {
    web?: {
        uri: string;
        title: string;
    };
}

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
    sources?: GroundingChunk[];
}
