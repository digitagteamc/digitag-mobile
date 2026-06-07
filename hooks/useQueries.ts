import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getFeed,
    getCategories,
    listConversations,
    listMessages,
    sendMessage,
} from '../services/userService';

// ─── Query Keys ────────────────────────────────────────────────────────────────
export const QUERY_KEYS = {
    feed: (token: string, filters?: object) => ['feed', token, filters] as const,
    categories: (role?: string) => ['categories', role] as const,
    conversations: (token: string) => ['conversations', token] as const,
    messages: (token: string, conversationId: string, cursor?: string) =>
        ['messages', token, conversationId, cursor] as const,
};

// ─── Feed (1-minute cache — avoids hammering /feed on scroll) ──────────────────
export function useFeed(token: string | null, filters?: Record<string, string>) {
    return useQuery({
        queryKey: QUERY_KEYS.feed(token ?? '', filters),
        queryFn: () => getFeed(token!, filters ?? {}),
        enabled: !!token,
        staleTime: 60 * 1000,           // 1 minute fresh
        gcTime: 3 * 60 * 1000,
        placeholderData: (prev: any) => prev, // keeps previous page visible while loading
    });
}

// ─── Categories (10-minute cache — almost never changes) ───────────────────────
export function useCategories(token: string | null, role?: string) {
    return useQuery({
        queryKey: QUERY_KEYS.categories(role),
        queryFn: () => getCategories({ role }),
        enabled: !!token,
        staleTime: 10 * 60 * 1000,      // 10 minutes
        gcTime: 30 * 60 * 1000,
    });
}

// ─── Conversations (30-second cache — needs to be fairly fresh) ────────────────
export function useConversations(token: string | null) {
    return useQuery({
        queryKey: QUERY_KEYS.conversations(token ?? ''),
        queryFn: () => listConversations(token!),
        enabled: !!token,
        staleTime: 30 * 1000,
        gcTime: 2 * 60 * 1000,
        refetchInterval: 30 * 1000,     // Poll every 30s while screen is open
    });
}

// ─── Messages (no cache — always fresh, cursor-based) ─────────────────────────
export function useMessages(token: string | null, conversationId: string, cursor?: string) {
    return useQuery({
        queryKey: QUERY_KEYS.messages(token ?? '', conversationId, cursor),
        queryFn: () => listMessages(token!, conversationId, cursor),
        enabled: !!token && !!conversationId,
        staleTime: 0,                    // Always re-fetch messages
    });
}

// ─── Send Message (mutation — invalidates conversations on success) ────────────
export function useSendMessage(token: string | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ conversationId, content, imageUrl }: {
            conversationId: string;
            content: string;
            imageUrl?: string;
        }) => sendMessage(token!, conversationId, content, imageUrl),
        onSuccess: (_data, { conversationId }) => {
            // Invalidate messages for this conversation so they refetch
            queryClient.invalidateQueries({ queryKey: ['messages', token, conversationId] });
            // Invalidate conversation list so unread count updates
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations(token ?? '') });
        },
    });
}
