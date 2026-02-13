import { useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { store } from '@/routes/content';

interface PageProps {
    generatedContent?: string;
    prompt?: string;
    aggregateId?: string;
    status?: string;
    failureReason?: string;
}

export default function Create() {
    const { props } = usePage();
    const { generatedContent, prompt: initialPrompt, status, failureReason } = props as PageProps;
    const { data, setData, post, processing, errors } = useForm({
        prompt: initialPrompt || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(store.url(), {
            preserveScroll: true,
        });
    };

    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
            <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
                        AI Content Studio
                    </h1>
                    <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500 dark:text-gray-400">
                        Unleash your creativity. Let our AI help you craft the perfect content.
                    </p>
                </div>

                <div className="mt-12 bg-white dark:bg-gray-800 shadow-xl rounded-lg">
                    <form onSubmit={submit} className="p-6">
                        <div>
                            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                What do you want to write about?
                            </label>
                            <div className="mt-1">
                                <textarea
                                    id="prompt"
                                    name="prompt"
                                    rows={4}
                                    className="block w-full p-3 border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-900 dark:text-gray-300 transition-colors duration-200"
                                    placeholder="e.g., a blog post about the future of renewable energy"
                                    value={data.prompt}
                                    onChange={(e) => setData('prompt', e.target.value)}
                                ></textarea>
                            </div>
                            {errors.prompt && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.prompt}</p>}
                        </div>
                        <div className="mt-6 text-right">
                            <button
                                type="submit"
                                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:opacity-50"
                                disabled={processing}
                            >
                                {processing ? 'Generating...' : 'Generate Content'}
                            </button>
                        </div>
                    </form>
                </div>

                {status === 'failed' && (
                    <div className="mt-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-red-800 dark:text-red-400">Generation Failed</h3>
                        <p className="mt-2 text-red-700 dark:text-red-300">
                            {failureReason || 'An unexpected error occurred. Please try again.'}
                        </p>
                    </div>
                )}

                {(generatedContent || processing) && (
                    <div className="mt-12">
                        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg">
                            <div className="p-6">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Your Generated Content</h3>
                                <div className="mt-6 prose prose-lg text-gray-500 dark:text-gray-400 max-w-none">
                                    {processing ? (
                                        <div className="animate-pulse space-y-4">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                                        </div>
                                    ) : (
                                        <p>{generatedContent}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
