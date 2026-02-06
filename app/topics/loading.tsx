import { PageHeaderSkeleton } from "@/components";

export default function TopicsLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-emerald-50">
      <PageHeaderSkeleton showTitle />

      {/* Content skeleton */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {[1, 2, 3].map((level) => (
          <section key={level} className="mb-12 last:mb-0">
            {/* Level header skeleton */}
            <div className="mb-6 flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />
              <div className="space-y-2">
                <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
              </div>
            </div>

            {/* Cards skeleton */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {[1, 2, 3, 4].map((card) => (
                <div
                  key={card}
                  className="rounded-2xl border-b-4 border-slate-200 bg-white p-4 shadow-md sm:p-6"
                >
                  <div className="mb-3 h-12 w-12 animate-pulse rounded-lg bg-slate-200 sm:h-14 sm:w-14" />
                  <div className="mb-1 h-5 w-24 animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
