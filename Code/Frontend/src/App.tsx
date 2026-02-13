/** DagBot — Main application entry point. */
import { useState, useCallback } from 'react';
import './index.css';
import type { ChatSettings, ViewMode } from './types';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SettingsPanel } from './components/SettingsPanel';
import { PromptLibrary } from './components/PromptLibrary';
import { useChat } from './hooks/useChat';
import { useConversations } from './hooks/useConversations';
import { useProviders } from './hooks/useProviders';
import { usePrompts } from './hooks/usePrompts';

const DEFAULT_SETTINGS: ChatSettings = {
  provider: 'openrouter',
  model: 'google/gemini-2.0-flash-exp:free',
  temperature: 0.7,
  top_p: 1.0,
  max_tokens: 4096,
  presence_penalty: 0.0,
  frequency_penalty: 0.0,
};

export default function App() {
  const [view, setView] = useState<ViewMode>('chat');
  const [settings, setSettings] = useState<ChatSettings>(() => {
    const saved = localStorage.getItem('dagbot_settings');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });
  const [systemPrompt, setSystemPrompt] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [activeConvId, setActiveConvId] = useState<string | undefined>(undefined);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const chat = useChat();
  const convs = useConversations();
  const provs = useProviders();
  const prompts = usePrompts();

  const handleSettingsChange = useCallback((partial: Partial<ChatSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      localStorage.setItem('dagbot_settings', JSON.stringify(next));
      return next;
    });
  }, []);

  const handleNewChat = useCallback(() => {
    chat.clearMessages();
    setActiveConvId(undefined);
    setView('chat');
    return convs.setActiveConversation(null); // Return promise to satisfy void check if needed, though mostly fire-and-forget
  }, [chat, convs]);

  const handleSelectConversation = useCallback(async (id: string) => {
    await convs.selectConversation(id);
    setActiveConvId(id);
    setView('chat');
    setIsSidebarOpen(false); // Close sidebar on mobile when selecting
    const detail = await import('./lib/api').then(api => api.getConversation(id));
    chat.setMessages(detail.messages.map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
      provider: m.provider ?? undefined,
      model: m.model ?? undefined,
      created_at: m.created_at
    })));
    if (detail.system_prompt) setSystemPrompt(detail.system_prompt);
  }, [convs, chat]);

  const handleSendMessage = useCallback(async (content: string, attachments: File[]) => {
    const returnedId = await chat.sendMessage(content, settings, activeConvId, systemPrompt || undefined, attachments);
    if (returnedId && !activeConvId) {
      setActiveConvId(returnedId);
      convs.loadConversations();
    }
  }, [chat, settings, activeConvId, systemPrompt, convs]);

  const handleUsePrompt = useCallback((content: string) => {
    setChatInput(content);
    setView('chat');
    setIsSidebarOpen(false);
  }, []);

  return (
    <div className="h-screen flex relative bg-[var(--color-bg)]"> {/* Ensure bg color */}
      <div className="mesh-gradient" />
      <div className="relative z-10 flex w-full h-full">
        {/* Sidebar */}
        <Sidebar
          conversations={convs.conversations}
          activeId={activeConvId || convs.activeConversation?.id || null}
          onSelect={handleSelectConversation}
          onNew={handleNewChat}
          onDelete={convs.removeConversation}
          onRename={convs.renameConversation}
          onViewChange={(v) => { setView(v); setIsSidebarOpen(false); }}
          currentView={view}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full relative overflow-hidden">
          {/* Mobile Menu Button - Visible only on mobile */}
          <button
            className="lg:hidden absolute top-4 left-4 z-30 p-2 rounded-lg bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-md"
            onClick={() => setIsSidebarOpen(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>

          {view === 'chat' && (
            <ChatArea
              messages={chat.messages}
              isStreaming={chat.isStreaming}
              error={chat.error}
              settings={settings}
              providers={provs.providers}
              systemPrompt={systemPrompt}
              input={chatInput}
              onInputChange={setChatInput}
              onSend={handleSendMessage}
              onStop={chat.stopStreaming}
              onSettingsChange={handleSettingsChange}
              onSystemPromptChange={setSystemPrompt}
            />
          )}
          {view === 'settings' && (
            <SettingsPanel
              providers={provs.providers}
              settings={settings}
              onSettingsChange={handleSettingsChange}
              onAddProvider={provs.addProvider}
              onDeleteProvider={provs.removeProvider}
              onTestProvider={provs.testConnection}
              onClose={() => setView('chat')}
            />
          )}
          {view === 'prompts' && (
            <PromptLibrary
              prompts={prompts.prompts}
              onAdd={prompts.addPrompt}
              onEdit={prompts.editPrompt}
              onDelete={prompts.removePrompt}
              onToggleFavorite={prompts.toggleFavorite}
              onUsePrompt={handleUsePrompt}
              onClose={() => setView('chat')}
            />
          )}
        </div>
      </div>
    </div>
  );
}
