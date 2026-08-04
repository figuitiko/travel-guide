'use client';
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) { return <div className="mx-auto max-w-3xl px-5 py-12"><div className="card p-8"><h1 className="text-2xl font-black">Something drifted off course.</h1><button className="btn mt-5" onClick={reset}>Try again</button></div></div>; }
