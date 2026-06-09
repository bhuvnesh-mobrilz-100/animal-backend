"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, PlusCircle, Pencil, Trash2, RefreshCw, ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";

type CommunityPost = {
  post_id: number;
  title?: string | null;
  body: string;
  created_at: string;
  user_id: number;
  updated_at?: string;
  likes_count?: number;
  dislikes_count?: number;
  comments_count?: number;
  comments?: Array<{
    comment_id: number;
    comment: string;
    created_at: string;
    updated_at?: string;
    user_id: number;
    users?: {
      user_id: number;
      user_name?: string | null;
    };
    author?: string;
  }>;
  post_likes?: unknown[];
  community_comments?: unknown[];
};

const emptyForm = {
  title: "",
  body: "",
};

export default function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<CommunityPost | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [userReactions, setUserReactions] = useState<Record<number, 'like' | 'dislike'>>({});

  const isEditing = useMemo(() => Boolean(selected), [selected]);

  useEffect(() => {
    loadPosts();
    getCurrentUser();
  }, []);

  async function getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("auth_user_id", user.id)
          .single();

        if (profile) {
          setCurrentUserId(profile.user_id);
          await loadUserReactions(profile.user_id);
        }
      }
    } catch (error) {
      console.error("Error getting current user:", error);
    }
  }

  async function loadPosts() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("community_posts")
        .select(
          "*, post_likes(reaction), community_comments(comment_id, comment, created_at, user_id, users(user_id, user_name))"
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      const normalizedPosts = (data || []).map((post: any) => {
        const likes = Array.isArray(post.post_likes)
          ? (post.post_likes as Array<{ reaction?: string }> )
          : [];
        const comments = Array.isArray(post.community_comments)
          ? (post.community_comments as Array<any>)
          : [];

        return {
          ...post,
          likes_count: likes.filter((item) => item.reaction === 'like').length,
          dislikes_count: likes.filter((item) => item.reaction === 'dislike').length,
          comments_count: comments.length,
          comments: comments.map((comment) => ({
            ...comment,
            author: comment.users?.user_name || 'Unknown User',
          })),
        };
      });
      setPosts(normalizedPosts);
    } catch (error) {
      console.error("Error loading posts:", error);
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setSelected(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(post: CommunityPost) {
    setSelected(post);
    setForm({ title: post.title || "", body: post.body || "" });
    setFormOpen(true);
  }

  async function loadUserReactions(userId: number) {
    try {
      const { data, error } = await supabase
        .from("post_likes")
        .select("post_id, reaction")
        .eq("user_id", userId);

      if (error) {
        console.error("Error loading user reactions:", error);
        return;
      }

      const reactions = (data || []).reduce((acc: Record<number, 'like' | 'dislike'>, item: any) => {
        if (item.post_id && (item.reaction === 'like' || item.reaction === 'dislike')) {
          acc[item.post_id] = item.reaction;
        }
        return acc;
      }, {});

      setUserReactions(reactions);
    } catch (error) {
      console.error("Error loading user reactions:", error);
    }
  }

  async function submitReaction(postId: number, reaction: 'like' | 'dislike') {
    if (!currentUserId) {
      toast.error('Please log in to react to posts');
      return;
    }

    try {
      const response = await fetch('/api/v1/community/reactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ post_id: postId, reaction }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'Failed to submit reaction');
      }

      setPosts((prev) =>
        prev.map((post) =>
          post.post_id === postId
            ? {
                ...post,
                likes_count: result.likes_count,
                dislikes_count: result.dislikes_count,
              }
            : post,
        ),
      );

      setUserReactions((prev) => {
        const next = { ...prev };
        if (result.reaction) {
          next[postId] = result.reaction;
        } else {
          delete next[postId];
        }
        return next;
      });
    } catch (error: any) {
      console.error('Error submitting reaction:', error);
      toast.error(error?.message || 'Failed to react to post');
    }
  }

  async function submitForm(event: React.FormEvent) {
    event.preventDefault();
    
    if (!form.body.trim()) {
      toast.error("Post body is required");
      return;
    }

    setSaving(true);
    try {
      if (isEditing && selected) {
        // Update existing post
        const { error } = await supabase
          .from("community_posts")
          .update({
            title: form.title || null,
            body: form.body,
            updated_at: new Date().toISOString(),
          })
          .eq("post_id", selected.post_id);

        if (error) throw error;
        toast.success("Post updated");
      } else {
        // Create new post
        if (!currentUserId) {
          toast.error("You must be logged in to create a post");
          return;
        }

        const { error } = await supabase
          .from("community_posts")
          .insert([{
            title: form.title || null,
            body: form.body,
            user_id: currentUserId,
          }]);

        if (error) throw error;
        toast.success("Post created");
      }

      setFormOpen(false);
      setSelected(null);
      setForm(emptyForm);
      loadPosts();
    } catch (error: any) {
      console.error("Error saving post:", error);
      toast.error(error.message || "Failed to save post");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!selected) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("community_posts")
        .delete()
        .eq("post_id", selected.post_id);

      if (error) throw error;
      
      toast.success("Post deleted");
      setDeleteOpen(false);
      setSelected(null);
      loadPosts();
    } catch (error: any) {
      console.error("Error deleting post:", error);
      toast.error(error.message || "Failed to delete post");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Community Posts</h1>
          <p className="text-muted-foreground">Create and manage community posts.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadPosts} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={openCreate}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Post
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No posts yet</CardTitle>
            <CardDescription>Create the first post using the button above.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <Card key={post.post_id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>{post.title || "Untitled"}</CardTitle>
                    <CardDescription>
                      Posted on {new Date(post.created_at).toLocaleDateString()} at {new Date(post.created_at).toLocaleTimeString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(post)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSelected(post);
                        setDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{post.body}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={userReactions[post.post_id] === 'like' ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => submitReaction(post.post_id, 'like')}
                    >
                      <ThumbsUp className="mr-2 h-4 w-4" />
                      {post.likes_count ?? 0}
                    </Button>
                    <Button
                      variant={userReactions[post.post_id] === 'dislike' ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => submitReaction(post.post_id, 'dislike')}
                    >
                      <ThumbsDown className="mr-2 h-4 w-4" />
                      {post.dislikes_count ?? 0}
                    </Button>
                  </div>
                  <span>{post.comments_count ?? 0} comment{(post.comments_count ?? 0) === 1 ? "" : "s"}</span>
                </div>
                {post.comments && post.comments.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {post.comments.slice(0, 3).map((comment) => (
                      <div
                        key={comment.comment_id}
                        className="rounded-xl border border-slate-200/80 bg-slate-50 p-3"
                      >
                        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                          <span className="font-semibold text-slate-700">{comment.users?.user_name || comment.author || 'Unknown User'}</span>
                          <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="mt-2 text-sm text-slate-800">{comment.comment}</p>
                      </div>
                    ))}
                    {post.comments.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        Showing {Math.min(3, post.comments.length)} of {post.comments.length} comments
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Post" : "Add Post"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Update your existing post." : "Create a new community post."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitForm} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title (Optional)</Label>
              <Input 
                id="title" 
                value={form.title} 
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} 
                placeholder="Enter a title for your post"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Body *</Label>
              <Textarea 
                id="body" 
                value={form.body} 
                onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))} 
                placeholder="Write your post content here..."
                rows={6}
                required 
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Save Changes" : "Create Post"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete post?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected community post. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={saving} className="bg-destructive text-destructive-foreground">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}