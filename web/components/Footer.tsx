export default function Footer() {
  return (
    <footer className="border-t border-fg-dim/30 mt-12">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-12 py-12 md:py-16 grid md:grid-cols-3 gap-10">
        <div>
          <div className="text-[1.5rem] font-bold tracking-tight text-amber">OATH</div>
          <p className="mt-3 text-[0.875rem] text-fg-muted leading-relaxed">
            anti-feed morning ritual.
            <br />
            one alarm. one personalized push. one action. no scrolling.
          </p>
        </div>

        <div>
          <div className="caption mb-4 text-amber-dim">repo</div>
          <ul className="space-y-2 text-[0.875rem]">
            <li>
              <a
                className="text-fg-muted hover:text-amber transition-colors"
                href="https://github.com/Kartikkapoor8/oath"
                target="_blank"
                rel="noopener noreferrer"
              >
                github repo
              </a>
            </li>
            <li>
              <a
                className="text-fg-muted hover:text-amber transition-colors"
                href="https://github.com/Kartikkapoor8/oath/blob/main/docs/01-spec.md"
                target="_blank"
                rel="noopener noreferrer"
              >
                v1 spec
              </a>
            </li>
            <li>
              <a
                className="text-fg-muted hover:text-amber transition-colors"
                href="https://github.com/Kartikkapoor8/oath/blob/main/docs/03-engine.md"
                target="_blank"
                rel="noopener noreferrer"
              >
                engine deep dive
              </a>
            </li>
            <li>
              <a
                className="text-fg-muted hover:text-amber transition-colors"
                href="https://github.com/Kartikkapoor8/oath/blob/main/experiments/03-morning-test/results.md"
                target="_blank"
                rel="noopener noreferrer"
              >
                morning test results
              </a>
            </li>
            <li>
              <a
                className="text-fg-muted hover:text-amber transition-colors"
                href="https://github.com/Kartikkapoor8/oath/tree/main/pipeline"
                target="_blank"
                rel="noopener noreferrer"
              >
                pipeline code
              </a>
            </li>
          </ul>
        </div>

        <div>
          <div className="caption mb-4 text-amber-dim">about</div>
          <p className="text-[0.875rem] text-fg-muted leading-relaxed">
            for deep24 — wednesday spec review.
            <br />
            built by kartik kapoor.
          </p>
          <p className="mt-4 text-[0.75rem] text-fg-subtle leading-relaxed">
            this page is a live demo. the engine you tested runs the same code as the ios app will.
          </p>
        </div>
      </div>
    </footer>
  );
}
