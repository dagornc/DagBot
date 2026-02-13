/** DagBot — TypeScript type definitions. */

export interface ChatMessage {
    id?: string;
    role: 'system' | 'user' | 'assistant';
    content: string | Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }>;
    provider?: string;
    model?: string;
    created_at?: string;
}

export interface Conversation {
    id: string;
    title: string;
    system_prompt?: string;
    created_at: string;
    updated_at: string;
    preview?: string;
    message_count: number;
}

export interface ConversationDetail extends Conversation {
    messages: ChatMessage[];
}

export interface Provider {
    name: string;
    display_name: string;
    base_url: string;
    api_key: string;
    default_model: string;
    access_method: string;
    icon: string;
    is_custom: boolean;
    description?: string;
    recommended?: boolean;
    models?: string[];
}

export interface ProviderCreate {
    name: string;
    display_name: string;
    base_url: string;
    api_key?: string;
    default_model?: string;
    access_method?: string;
    icon?: string;
}

export interface SavedPrompt {
    id: string;
    title: string;
    content: string;
    category: string;
    tags: string[];
    is_favorite: boolean;
    created_at: string;
    updated_at: string;
}

export interface PromptCreate {
    title: string;
    content: string;
    category?: string;
    tags?: string[];
    is_favorite?: boolean;
}

export interface ChatSettings {
    provider: string;
    model: string;
    temperature: number;
    top_p: number;
    max_tokens: number;
    presence_penalty: number;
    frequency_penalty: number;
    provider_options?: Record<string, {
        free_only?: boolean;
        auto_choose?: boolean;
    }>;
}

export interface ProviderTestResult {
    success: boolean;
    message: string;
    response_time_ms?: number;
}

export type ViewMode = 'chat' | 'settings' | 'prompts';
export type SettingsTab = 'providers' | 'prompts' | 'general';
