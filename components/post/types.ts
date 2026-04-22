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
  onSubmitComment: (body: string) => Promise<void>;
  submittingComment: boolean;
}
