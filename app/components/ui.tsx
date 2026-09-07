import type { ComponentProps } from "react";

export function Heading({ className = "", ...props }: ComponentProps<"h2">) {
  return <h2 className={`text-xl leading-[1.2] font-bold ${className}`} {...props} />;
}

export function Text({ className = "", ...props }: ComponentProps<"p">) {
  return <p className={`text-lg leading-[1.65] ${className}`} {...props} />;
}

export function ExternalLink(props: ComponentProps<"a">) {
  return <a target="_blank" rel="noopener noreferrer" {...props} />;
}

export function PageWidth({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`mx-auto max-w-[min(100vw,72rem)] px-4 py-4 sm:px-6 lg:px-8 ${className}`} {...props} />;
}

export function StoryBadge({ kind, children }: {
  kind: "points" | "comments";
  children: React.ReactNode;
}) {
  return (
    <span className={`inline-flex min-h-8 min-w-8 items-center rounded-md px-3 text-base leading-[1.2] font-medium ${
      kind === "comments"
        ? "border-2 border-transparent bg-blue-100 text-blue-800 transition-[border-color] duration-170 ease-in group-hover:border-blue-500 group-visited:text-purple-500"
        : "bg-gray-100 text-gray-800"
    }`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
        className={kind === "points" ? "size-5" : "mr-1 size-4"}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={kind === "points"
          ? "M7 11l5-5m0 0l5 5m-5-5v12"
          : "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"} />
      </svg>
      <span className="flow-root">{children}</span>
    </span>
  );
}

export function NavigationProgress({ loading }: { loading: boolean }) {
  return (
    <div
      role="progressbar"
      aria-label="Loading page"
      aria-hidden={!loading}
      className={`sticky top-0 z-[1100] h-1 overflow-hidden bg-orange-100 ${loading ? "visible" : "invisible"}`}
    >
      <div className="absolute inset-y-0 animate-progress bg-orange-500" />
    </div>
  );
}
