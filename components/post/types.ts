/**
 * Shared props for connecting a post-detail view to its interactive backend.
 * Views that receive `PostInteraction` wire the like / save / comment
 * affordances; views that don't degrade to the original read-only layout.
 */
export interface PostInteraction {
  liked: boolean;
  saved: boolean;
  likes: number;
  comments: number;
  isAuthor: boolean;
  /** avatar of the signed-in viewer, used by the discussion composer */
  viewerAvatar?: string;
  canPost: boolean;
  onToggleLike: () => void;
  onToggleSave: () => void;
  onShare?: () => void;
  /** Tapping the top-bar overflow icon. Omit to hide the button entirely. */
  onMore?: () => void;
  /** Navigate to the author's profile (`/user/:handle`). */
  onPressAuthor?: () => void;
  /** Navigate to the subject object's detail screen (`/object/:id`). */
  onPressObject?: () => void;
  onSubmitComment: (body: string, parentId?: string) => Promise<void>;
  submittingComment: boolean;
  /** UserId of the signed-in viewer. Surfaces Delete affordances. */
  viewerId?: string;
  /** Delete a comment the viewer authored (or any comment when viewer is
   * the post's author). Omit to hide the action. */
  onDeleteComment?: (commentId: string) => void;
  /** Navigate to a commenter's profile (`/user/:handle`). */
  onPressCommentAuthor?: (handle: string) => void;

  /** Comments are paginated — the first page is in-flight. */
  loadingComments?: boolean;
  /** There is another comment page on the server waiting to be fetched. */
  hasMoreComments?: boolean;
  /** A background page request is currently in flight. */
  loadingMoreComments?: boolean;
  /** Trigger fetching the next page; omit to hide the Load more affordance. */
  onLoadMoreComments?: () => void;
}
