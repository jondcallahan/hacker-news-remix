import { forwardRef, type ComponentProps } from "react";
import type { Item } from "~/utils/api.server";
import { haptic } from "ios-haptics";

type CommentProps = ComponentProps<"details"> & {
  comment: Item;
  originalPoster?: string;
  topLevel?: boolean;
  selected?: boolean;
};

export const Comment = forwardRef<HTMLDetailsElement, CommentProps>(
  function Comment({ comment, children, originalPoster, topLevel = false, selected = false, className = "", ...rest }, ref) {
    const handleClick = (e: React.MouseEvent<HTMLDetailsElement>) => {
      const target = e.target as HTMLElement;
      // Links and the entire summary keep their native behavior, even when a
      // nested span or emphasis element receives the click.
      if (!target.closest("a, summary")) {
        haptic.confirm();
        e.currentTarget.open = false;
        e.stopPropagation();
      }
    };

    return (
      <details
        ref={ref}
        open
        onClick={handleClick}
        className={`cursor-pointer ${topLevel ? `w-full scroll-my-20 rounded-lg bg-orange-50 ${selected ? "shadow-raised outline-3 outline-offset-2 outline-blue-500" : "shadow-card outline-none"}` : "mt-2"} ${className}`}
        {...rest}
      >
        <summary
          className="rounded-lg bg-gray-100 p-4 text-left font-semibold [[open]>&]:rounded-b-none"
          onClick={(e) => {
            const details = e.currentTarget.parentElement as HTMLDetailsElement;
            details.open ? haptic.confirm() : haptic();
          }}
        >
          <span className={originalPoster === comment.by ? "text-orange-600" : undefined}>{comment.by}</span>{" "}
          | {comment.kids?.length || "0"} {comment.kids?.length === 1 ? "comment" : "comments"}
          {" | "}{comment.relativeTime}
        </summary>
        <div className={`border-l border-transparent transition-[border-color] duration-170 ease-in hover:border-orange-300 ${topLevel ? "py-2" : ""}`}>
          <div className="mx-4 font-serif text-lg leading-[1.65]" dangerouslySetInnerHTML={{ __html: comment.text || "" }} />
          {children && <div className="px-2">{children}</div>}
        </div>
      </details>
    );
  },
);
