import Link from 'next/link';
import { ImageIcon } from 'lucide-react';
import { LandingAnalytics } from '@/components/landing-analytics';

const steps = [
  ['1', 'Tell us your budget', "Departure city, dates, and what you're into - takes two minutes."],
  ['2', 'Get three trip ideas', 'Matched to your budget, with a plain reason each one fits.'],
  ['3', 'See the full plan', 'Costs and a day-by-day itinerary, so you know what it takes.'],
];

const foundTrips = [
  ['Oaxaca, Mexico', '7 days of food and culture.', '$1,240'],
  ['Porto, Portugal', '6 relaxed days by the coast.', '$1,580'],
  ['Banff, Canada', '5 days of mountains and hiking.', '$980'],
];

function PhotoFrame({ label = 'Destination photo' }: { label?: string }) {
  return (
    <div className="flex min-h-44 items-center justify-center rounded-t-[1.35rem] border-b border-dashed border-stone-300 bg-stone-50/80 text-center text-sm text-stone-500">
      <div>
        <ImageIcon className="mx-auto mb-2 size-7 text-stone-400" aria-hidden="true" />
        <p>{label}</p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="bg-[#f7f0df] text-[#151922]">
      <LandingAnalytics />
      <section className="mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-8 md:grid-cols-[0.9fr_1fr] md:items-center md:pb-20 md:pt-12">
        <div className="max-w-xl">
          <h1 className="text-5xl font-black leading-[0.98] tracking-[-0.045em] sm:text-6xl md:text-7xl">
            Tell us your budget. We&apos;ll find your trip.
          </h1>
          <p className="mt-7 max-w-lg text-lg font-medium leading-8 text-slate-700">
            Three destinations picked for you, with realistic estimated costs and a day-by-day plan - so you know exactly what a trip takes before you book anything.
          </p>
          <Link className="btn mt-9 bg-[#ef4828] px-9 hover:bg-[#d93f22]" href="/plan">
            Plan My Trip
          </Link>
        </div>

        <div className="relative min-h-[420px] bg-[#d4b6a3] p-8 md:p-10">
          <div className="absolute -left-6 top-10 hidden rounded-full bg-[#bdf3f4] px-4 py-2 text-sm font-black text-slate-800 shadow-sm md:block">Under 2 minutes</div>
          <div className="flex h-full min-h-[340px] items-center justify-center rounded-[1.75rem] border border-dashed border-stone-400/80 bg-[#f2ecdc] p-8 text-center text-stone-600">
            <div>
              <ImageIcon className="mx-auto mb-3 size-8 text-stone-500" aria-hidden="true" />
              <p className="font-semibold text-stone-700">Your possible trip preview</p>
              <p className="mt-1 text-sm">Budget, dates, and interests become three comparable routes.</p>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="How it works" className="mx-auto grid max-w-6xl gap-8 px-5 pb-20 md:grid-cols-3">
        {steps.map(([number, title, copy]) => (
          <article key={number} className="max-w-sm">
            <div className="mb-5 flex size-12 items-center justify-center rounded-full bg-[#bdf3f4] text-lg font-black text-slate-900">{number}</div>
            <h3 className="text-xl font-black">{title}</h3>
            <p className="mt-3 leading-7 text-slate-700">{copy}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24">
        <h2 className="text-3xl font-black tracking-[-0.03em] md:text-4xl">A few trips people have found</h2>
        <div className="mt-8 grid gap-7 md:grid-cols-3">
          {foundTrips.map(([destination, description, total]) => (
            <article key={destination} className="overflow-hidden rounded-[1.4rem] border border-[#dfd2be] bg-[#fffdf8] shadow-[0_18px_45px_rgba(70,49,24,0.06)]">
              <PhotoFrame />
              <div className="p-6">
                <h3 className="text-xl font-black">{destination}</h3>
                <p className="mt-2 text-slate-700">{description}</p>
                <div className="mt-6 flex items-end justify-between border-t border-[#eadfce] pt-4">
                  <span className="text-sm text-slate-600">Est. total</span>
                  <strong className="text-xl">{total}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="bg-[#c8f2f3] px-5 py-8 text-center text-sm font-semibold text-slate-800">
        Prices shown are estimates for inspiration only - not live quotes, and booking isn&apos;t available yet.
      </div>

      <section className="mx-auto max-w-4xl px-5 py-24 text-center">
        <h2 className="text-4xl font-black tracking-[-0.04em] md:text-5xl">Ready when you are.</h2>
        <p className="mt-5 text-lg text-slate-700">Three trip ideas, matched to your budget, in under two minutes.</p>
        <Link className="btn mt-9 bg-[#ef4828] px-10 hover:bg-[#d93f22]" href="/plan">
          Plan My Trip
        </Link>
      </section>
    </div>
  );
}
