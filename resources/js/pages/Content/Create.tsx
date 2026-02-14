import { useState, useRef, useCallback } from 'react';
import { router } from '@inertiajs/react';

type Status = 'idle' | 'streaming' | 'done' | 'error';

interface HistoryItem {
    aggregate_id: string;
    prompt: string;
    generated_content: string | null;
    status: string;
    failure_reason: string | null;
    created_at: string;
}

interface Props {
    aggregateId?: string;
    prompt?: string;
    generatedContent?: string;
    status?: string;
    failureReason?: string;
    history?: HistoryItem[];
}

function getCsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

function timeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    };

    return (
        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${styles[status] || styles.pending}`}>
            {status}
        </span>
    );
}

export default function Create({ aggregateId, prompt: viewingPrompt, generatedContent, status: viewingStatus, failureReason, history = [] }: Props) {
    const [prompt, setPrompt] = useState('');
    const [content, setContent] = useState('');
    const [status, setStatus] = useState<Status>('idle');
    const [error, setError] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    // When viewing a past generation
    const isViewing = !!aggregateId;
    const displayContent = isViewing ? (generatedContent || '') : content;
    const displayPrompt = isViewing ? (viewingPrompt || '') : '';

    const handleSubmit = useCallback(async () => {
        if (prompt.trim().length < 10) return;

        setContent('');
        setError('');
        setStatus('streaming');

        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const response = await fetch('/content/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream',
                    'X-XSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({ prompt }),
                signal: controller.signal,
            });

            if (!response.ok) {
                if (response.status === 422) {
                    const json = await response.json();
                    setError(json.errors?.prompt?.[0] || 'Validation failed.');
                } else {
                    setError('Request failed. Please try again.');
                }
                setStatus('error');
                return;
            }

            const reader = response.body!.getReader();
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
                    const json = line.slice(6);

                    try {
                        const event = JSON.parse(json);
                        if (event.type === 'chunk') {
                            setContent((prev) => prev + event.content);
                        } else if (event.type === 'done') {
                            setStatus('done');
                            router.reload({ only: ['history'] });
                        } else if (event.type === 'error') {
                            setError(event.message);
                            setStatus('error');
                        }
                    } catch {
                        // Skip malformed JSON lines
                    }
                }
            }

            setStatus((prev) => (prev === 'streaming' ? 'done' : prev));
        } catch (err: unknown) {
            if (err instanceof DOMException && err.name === 'AbortError') {
                setStatus('done');
                return;
            }
            setError('Connection failed. Is the server running?');
            setStatus('error');
        } finally {
            abortRef.current = null;
        }
    }, [prompt]);

    const handleStop = useCallback(() => {
        abortRef.current?.abort();
    }, []);

    const isStreaming = status === 'streaming';
    const hasContent = displayContent.length > 0;

    return (
        <div className="bg-gray-50 dark:bg-gray-950 min-h-screen flex">
            {/* Mobile sidebar toggle */}
            <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="fixed top-4 left-4 z-50 lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors cursor-pointer"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    {sidebarOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    )}
                </svg>
            </button>

            {/* Sidebar overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* History Sidebar */}
            <aside className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="px-5 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">History</h2>
                    <a
                        href="/content/create"
                        onClick={(e) => {
                            e.preventDefault();
                            router.visit('/content/create');
                        }}
                        className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        New
                    </a>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {history.length === 0 ? (
                        <div className="px-5 py-8 text-center">
                            <p className="text-sm text-gray-400 dark:text-gray-500">No generations yet</p>
                        </div>
                    ) : (
                        <ul className="py-2">
                            {history.map((item) => (
                                <li key={item.aggregate_id} className="group relative">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSidebarOpen(false);
                                            router.visit(`/content/${item.aggregate_id}`);
                                        }}
                                        className={`w-full text-left px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${
                                            aggregateId === item.aggregate_id ? 'bg-indigo-50 dark:bg-indigo-950/30 border-r-2 border-indigo-500' : ''
                                        }`}
                                    >
                                        <p className="text-sm text-gray-900 dark:text-gray-100 truncate pr-6">{item.prompt}</p>
                                        <div className="mt-1 flex items-center gap-2">
                                            <StatusBadge status={item.status} />
                                            <span className="text-[10px] text-gray-400 dark:text-gray-500">{timeAgo(item.created_at)}</span>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('Are you sure you want to delete this generation?')) {
                                                router.delete(`/content/${item.aggregate_id}`);
                                            }
                                        }}
                                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 rounded-lg text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer"
                                        title="Delete"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
                <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-5xl font-extrabold tracking-tight">
                            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                                AI Content Studio
                            </span>
                        </h1>
                        <p className="mt-4 max-w-xl mx-auto text-lg text-gray-500 dark:text-gray-400">
                            Unleash your creativity. Let AI craft the perfect content.
                        </p>
                    </div>

                    {/* Viewing past generation */}
                    {isViewing && viewingStatus === 'failed' && failureReason && (
                        <div className="mb-6 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-2xl p-5 flex items-start gap-3">
                            <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm font-medium text-red-800 dark:text-red-300">{failureReason}</p>
                        </div>
                    )}

                    {isViewing && displayPrompt && (
                        <div className="mb-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Prompt</p>
                                    <p className="text-gray-700 dark:text-gray-300">{displayPrompt}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (confirm('Are you sure you want to delete this generation?')) {
                                            router.delete(`/content/${aggregateId}`);
                                        }
                                    }}
                                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-200 dark:border-red-800 transition-colors cursor-pointer"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Input Card - only show when not viewing */}
                    {!isViewing && (
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                            <div className="p-6">
                                <label htmlFor="prompt" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    What do you want to write about?
                                </label>
                                <textarea
                                    id="prompt"
                                    rows={4}
                                    className="block w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none sm:text-sm"
                                    placeholder="e.g., a blog post about the future of renewable energy..."
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    disabled={isStreaming}
                                />
                                {prompt.length > 0 && prompt.trim().length < 10 && (
                                    <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">Prompt must be at least 10 characters</p>
                                )}
                            </div>
                            <div className="px-6 pb-6 flex items-center justify-between">
                                <span className="text-xs text-gray-400">{prompt.length} characters</span>
                                <div className="flex gap-3">
                                    {isStreaming && (
                                        <button
                                            type="button"
                                            onClick={handleStop}
                                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 transition-all cursor-pointer"
                                        >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                                                <rect x="3" y="3" width="10" height="10" rx="1" />
                                            </svg>
                                            Stop
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={isStreaming || prompt.trim().length < 10}
                                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                                    >
                                        {isStreaming ? (
                                            <>
                                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                                Generate
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {!isViewing && status === 'error' && (
                        <div className="mt-6 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-2xl p-5 flex items-start gap-3">
                            <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
                                <button
                                    onClick={handleSubmit}
                                    className="mt-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                                >
                                    Try again
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Output */}
                    {hasContent && (
                        <div className={`${isViewing ? '' : 'mt-8'} bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden`}>
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Generated Content</h3>
                                {isStreaming && (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                                        <span className="relative flex h-2 w-2">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
                                            <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
                                        </span>
                                        Streaming
                                    </span>
                                )}
                                {(status === 'done' || isViewing) && (
                                    <button
                                        onClick={() => navigator.clipboard.writeText(displayContent)}
                                        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors cursor-pointer"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        Copy
                                    </button>
                                )}
                            </div>
                            <div className="p-6">
                                <div className="prose prose-gray dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {displayContent}
                                    {isStreaming && (
                                        <span className="inline-block w-0.5 h-5 bg-indigo-500 ml-0.5 align-text-bottom animate-pulse" />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
