/** DagBot — API client for all backend endpoints. */

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${url}`, {
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        ...options,
    });
    if (!res.ok) {
        const error = await res.text();
        throw new Error(`API Error ${res.status}: ${error}`);
    }
    return res.json();
}

// ── Conversations ──

export async function listConversations() {
    return fetchJson<import('../types').Conversation[]>('/conversations');
}

export async function getConversation(id: string) {
    return fetchJson<import('../types').ConversationDetail>(`/conversations/${id}`);
}

export async function createConversation(title?: string, systemPrompt?: string) {
    return fetchJson<import('../types').Conversation>('/conversations', {
        method: 'POST',
        body: JSON.stringify({ title, system_prompt: systemPrompt }),
    });
}

export async function updateConversation(id: string, data: { title?: string; system_prompt?: string }) {
    return fetchJson<{ status: string }>(`/conversations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}

export async function deleteConversation(id: string) {
    return fetchJson<{ status: string }>(`/conversations/${id}`, { method: 'DELETE' });
}

// ── Providers ──

export async function listProviders() {
    return fetchJson<import('../types').Provider[]>('/providers');
}

export async function addProvider(data: import('../types').ProviderCreate) {
    return fetchJson<import('../types').Provider>('/providers', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updateProvider(name: string, data: Partial<import('../types').Provider>) {
    return fetchJson<{ status: string }>(`/providers/${name}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function deleteProvider(name: string) {
    return fetchJson<{ status: string }>(`/providers/${name}`, { method: 'DELETE' });
}

export async function testProvider(name: string) {
    return fetchJson<import('../types').ProviderTestResult>(`/providers/${name}/test`, {
        method: 'POST',
    });
}

// ── Prompts ──

export async function listPrompts() {
    return fetchJson<import('../types').SavedPrompt[]>('/prompts');
}

export async function createPrompt(data: import('../types').PromptCreate) {
    return fetchJson<import('../types').SavedPrompt>('/prompts', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updatePrompt(id: string, data: Partial<import('../types').PromptCreate>) {
    return fetchJson<{ status: string }>(`/prompts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function deletePrompt(id: string) {
    return fetchJson<{ status: string }>(`/prompts/${id}`, { method: 'DELETE' });
}

// ── Chat SSE Streaming ──

export interface ChatStreamOptions {
    provider: string;
    model: string;
    messages: { role: string; content: string | Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }> }[];
    system_prompt?: string;
    conversation_id?: string;
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
    onToken: (token: string) => void;
    onConversationId: (id: string) => void;
    onDone: (conversationId: string) => void;
    onError: (error: string) => void;
}

export async function streamChat(options: ChatStreamOptions): Promise<void> {
    const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            provider: options.provider,
            model: options.model,
            messages: options.messages,
            system_prompt: options.system_prompt,
            conversation_id: options.conversation_id,
            temperature: options.temperature,
            top_p: options.top_p,
            max_tokens: options.max_tokens,
            presence_penalty: options.presence_penalty,
            frequency_penalty: options.frequency_penalty,
        }),
    });

    if (!res.ok) {
        throw new Error(`Chat API error: ${res.status}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'token') options.onToken(data.content);
                else if (data.type === 'conversation_id') options.onConversationId(data.id);
                else if (data.type === 'done') options.onDone(data.conversation_id);
                else if (data.type === 'error') options.onError(data.message);
                else if (data.error) options.onError(data.error);
            } catch {
                // skip invalid JSON lines
            }
        }
    }
}
