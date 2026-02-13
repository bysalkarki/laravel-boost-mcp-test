import { useState, useRef, useCallback } from 'react';

type Status = 'idle' | 'streaming' | 'done' | 'error';

function getCsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

export default function Create() {
    const [prompt, setPrompt] = useState('');
    const [content, setContent] = useState('');
    const [status, setStatus] = useState<Status>('idle');
    const [error, setError] = useState('');
    const abortRef = useRef<AbortController | null>(null);

    const handleSubmit = useCallback(async () => {
        if (prompt.trim().length < 10) return;

        // Reset state
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
                // Keep the last potentially incomplete line in buffer
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
                        } else if (event.type === 'error') {
                            setError(event.message);
                            setStatus('error');
                        }
                    } catch {
                        // Skip malformed JSON lines
                    }
                }
            }

            // If we exited the loop without a done/error event
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
    const hasContent = content.length > 0;

    return (
        <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
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

                {/* Input Card */}
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

                {/* Error */}
                {status === 'error' && (
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
                {(hasContent || isStreaming) && (
                    <div className="mt-8 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
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
                            {status === 'done' && (
                                <button
                                    onClick={() => navigator.clipboard.writeText(content)}
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
                                {content}
                                {isStreaming && (
                                    <span className="inline-block w-0.5 h-5 bg-indigo-500 ml-0.5 align-text-bottom animate-pulse" />
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
