import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { GenerationConfig, GroundingChunk, ChatMessage } from '../types';
import { SendIcon, PowerIcon } from './icons';
import { ChatHistory } from './ChatHistory';

interface LiveTerminalProps {
    initialConfig: GenerationConfig;
    onShutdown: () => void;
}

export const LiveTerminal: React.FC<LiveTerminalProps> = ({ initialConfig, onShutdown }) => {
    const [prompt, setPrompt] = useState('');
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [chat, setChat] = useState<Chat | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [history, isLoading]);
    
    useEffect(() => {
        let isMounted = true;
        const startChat = () => {
            setError(null);
            setHistory([]);
            try {
                if (!process.env.API_KEY) {
                    throw new Error("API_KEY ortam değişkeni ayarlanmadı.");
                }
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const newChat = ai.chats.create({
                    model: initialConfig.model,
                    config: {
                        systemInstruction: initialConfig.systemInstruction,
                        temperature: initialConfig.temperature,
                        topK: initialConfig.topK,
                        topP: initialConfig.topP,
                        maxOutputTokens: initialConfig.maxOutputTokens,
                        tools: [{ googleSearch: {} }]
                    },
                });
                if (isMounted) {
                    setChat(newChat);
                }
            } catch(e) {
                if (isMounted) {
                    if (e instanceof Error) {
                        setError(e.message);
                    } else {
                        setError('Sohbet başlatılırken bilinmeyen bir hata oluştu.');
                    }
                }
            }
        };

        startChat();

        return () => { isMounted = false; }
    }, [initialConfig]);


    const handleSendMessage = useCallback(async () => {
        if (!prompt || isLoading || !chat) return;

        const userMessage: ChatMessage = { role: 'user', content: prompt };
        setHistory(prev => [...prev, userMessage]);
        const currentPrompt = prompt;
        setPrompt('');
        setIsLoading(true);
        setError(null);

        try {
            const stream = await chat.sendMessageStream({ message: currentPrompt });
            let modelResponse = '';
            let sources: GroundingChunk[] = [];
            
            setHistory(prev => [...prev, { role: 'model', content: '' }]);

            for await (const chunk of stream) {
                const c = chunk as GenerateContentResponse;
                const text = c.text;
                 if (text) {
                    modelResponse += text;
                    setHistory(prev => {
                        const newHistory = [...prev];
                        if (newHistory.length > 0) {
                           newHistory[newHistory.length - 1].content = modelResponse;
                        }
                        return newHistory;
                    });
                }
                const metadata = c.candidates?.[0]?.groundingMetadata;
                if (metadata?.groundingChunks) {
                    sources = metadata.groundingChunks as GroundingChunk[];
                }
            }
            setHistory(prev => {
                const newHistory = [...prev];
                 if (newHistory.length > 0) {
                    newHistory[newHistory.length - 1].sources = sources;
                }
                return newHistory;
            });
        } catch (e) {
             if (e instanceof Error) {
                setError(e.message);
            } else {
                setError('Mesaj gönderilirken bilinmeyen bir hata oluştu.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [prompt, isLoading, chat]);


    return (
        <div className="flex flex-col h-screen relative bg-black/30 font-sans">
            <header className="flex-shrink-0 bg-gray-800/90 backdrop-blur-sm border-b border-gray-700/50 p-3 flex justify-between items-center">
                <div className="font-mono text-sm">
                    <span className="text-gray-400">INSTANCE STATUS: </span>
                    <span className="text-green-400 font-bold">ONLINE</span>
                    <span className="text-gray-500 mx-2">|</span>
                    <span className="text-gray-400">MODEL: </span>
                    <span className="text-cyan-400 font-bold">{initialConfig.model}</span>
                </div>
                <button onClick={onShutdown} className="flex items-center justify-center px-3 py-2 bg-red-800/50 hover:bg-red-700/70 rounded-md transition-colors font-semibold border border-red-700/80 text-sm">
                    <PowerIcon className="w-4 h-4 mr-2"/>
                    KAPAT & YENİDEN DAĞIT
                </button>
            </header>
            <main className="flex-1 overflow-y-auto pb-24">
               <ChatHistory history={history} isLoading={isLoading} />
               <div ref={chatEndRef} />
            </main>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent p-4">
                 {error && (
                    <div className="bg-red-900/50 text-red-300 p-3 rounded-md mb-2 text-sm border border-red-700 max-w-4xl mx-auto">
                       <strong>Hata:</strong> {error}
                    </div>
                 )}
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-2">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="Yönerge gönder..."
                            rows={1}
                            className="w-full bg-transparent p-2 resize-none focus:outline-none text-gray-200 placeholder-gray-500"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={isLoading || !prompt}
                            className="p-3 rounded-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                        >
                            <SendIcon className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
