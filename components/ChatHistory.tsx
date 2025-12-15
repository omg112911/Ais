import React from 'react';
import { ChatMessage } from '../types';

// Simple markdown to HTML renderer
const renderMarkdown = (text: string): string => {
    let html = text;
    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, (match, p1) => {
        const code = p1.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return `<pre class="bg-gray-800 p-3 rounded-md my-2 overflow-x-auto"><code>${code}</code></pre>`;
    });
    // Inline code
    html = html.replace(/`(.*?)`/g, '<code class="bg-gray-700/50 text-cyan-400 px-1 rounded-sm">$1</code>');
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Newlines to <br> but not inside <pre>
    html = html.replace(/\n/g, '<br />');
    html = html.replace(/<pre(.*?)>([\s\S]*?)<\/pre>/g, (match, p1, p2) => {
        return `<pre${p1}>${p2.replace(/<br \/>/g, '\n')}</pre>`;
    });

    return html;
};

interface ChatHistoryProps {
    history: ChatMessage[];
    isLoading: boolean;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({ history, isLoading }) => {
    if (history.length === 0 && !isLoading) {
        return (
             <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500 font-mono">
                    <div className="text-5xl mb-4">[ 👾 ]</div>
                    <h2 className="text-2xl font-bold">> MODIE Terminali Aktif</h2>
                    <p className="mt-2">> Yönerge bekleniyor...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 font-mono text-sm text-gray-300 space-y-4">
            <div className="text-green-400">[</div>
            {history.map((msg, index) => (
                <div key={index} className="pl-4">
                    <div>{"{"}</div>
                    <div className="pl-4">
                        <div>
                            <span className="text-red-400">"role"</span>: <span className="text-yellow-400">"{msg.role}"</span>,
                        </div>
                        <div>
                            <span className="text-red-400">"content"</span>: <span className="text-yellow-400">"</span>
                                <div className="inline-block prose prose-invert max-w-none prose-p:inline" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                            <span className="text-yellow-400">"</span>,
                        </div>
                        {msg.sources && msg.sources.length > 0 && (
                             <div>
                                <span className="text-red-400">"sources"</span>: [
                                <div className="pl-4">
                                    {msg.sources.map((chunk, i) => (
                                        chunk.web && (
                                            <div key={i}>
                                                <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                                    {`"${chunk.web.uri}"`}
                                                </a>
                                                {i < (msg.sources?.length ?? 0) -1 ? ',' : ''}
                                            </div>
                                        )
                                    ))}
                                </div>
                                ]
                            </div>
                        )}
                    </div>
                    <div>{"}"}{index < history.length - 1 ? ',' : ''}</div>
                </div>
            ))}
            {isLoading && (
                 <div className="pl-4">
                    <div>{"{"}</div>
                    <div className="pl-4">
                        <div><span className="text-red-400">"role"</span>: <span className="text-yellow-400">"model"</span>,</div>
                        <div><span className="text-red-400">"content"</span>: <span className="text-yellow-400">"</span><span className="inline-flex items-center">
                           <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                           <div className="w-2 h-2 ml-1 bg-cyan-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                           <div className="w-2 h-2 ml-1 bg-cyan-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                        </span><span className="text-yellow-400">"</span></div>
                    </div>
                    <div>{"}"}</div>
                </div>
            )}
            <div className="text-green-400">]</div>
        </div>
    );
};
