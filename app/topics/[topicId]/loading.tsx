import { PageHeaderSkeleton } from "@/components";

export default function TopicDetailLoading() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-gradient-to-br from-sky-100 via-blue-50 to-emerald-50 pb-12">
      {/* Background decoration */}
      <div className="fixed -top-20 -left-20 h-64 w-64 animate-pulse rounded-full bg-sky-300 opacity-20 blur-3xl" />
      <div
        className="fixed top-40 -right-20 h-80 w-80 animate-pulse rounded-full bg-emerald-300 opacity-20 blur-3xl"
        style={{ animationDelay: "0.7s" }}
      />

      <PageHeaderSkeleton showBackground={false} />

      {/* Content skeleton */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 py-4 sm:px-6 sm:py-8">
        {/* Topic header skeleton */}
        <div className="mb-8 flex flex-col items-center text-center sm:mb-12">
          <div className="mb-6 h-32 w-32 animate-pulse rounded-[2rem] bg-white shadow-xl sm:h-40 sm:w-40" />
          <div className="mb-3 h-10 w-64 animate-pulse rounded-lg bg-slate-200/50 sm:h-14 sm:w-80" />
          <div className="h-6 w-full max-w-md animate-pulse rounded bg-slate-200/50" />
          <div className="mt-2 h-6 w-3/4 max-w-sm animate-pulse rounded bg-slate-200/50" />
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Learning goals skeleton */}
          <div className="rounded-3xl bg-white/80 p-6 shadow-xl backdrop-blur-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-xl bg-sky-100" />
              <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((goal) => (
                <div key={goal} className="flex items-center gap-3">
                  <div className="h-5 w-5 animate-pulse rounded-full bg-emerald-200" />
                  <div className="h-5 flex-1 animate-pulse rounded bg-slate-200" />
                </div>
              ))}
            </div>
          </div>

          {/* Word preview skeleton */}
          <div className="rounded-3xl bg-white/80 p-6 shadow-xl backdrop-blur-sm sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />
              <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
            </div>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((word) => (
                <div
                  key={word}
                  className="h-10 w-24 animate-pulse rounded-xl border border-sky-100 bg-sky-50"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Button skeleton */}
        <div className="mt-12 flex justify-center">
          <div className="h-20 w-64 animate-pulse rounded-full bg-sky-200/50 shadow-xl" />
        </div>
      </div>
    </main>
  );
}
