import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Role } from '../../theme/colors';
import Button from './Button';

/**
 * Canonical collab states used across the app. This maps 1:1 to the backend
 * CollaborationStatus, plus the two "perspective-aware" pending states.
 *
 *   none           — no collab exists between me and the other user
 *   sent_pending   — I sent a request, waiting on them
 *   received_pending — they sent a request to me, I need to respond
 *   accepted       — connected; chat + call are unlocked
 *   sent_declined  — they declined my request (I can re-request)
 *   sent_cancelled — I cancelled my own request (can re-send)
 */
export type CollabState =
    | 'none'
    | 'sent_pending'
    | 'received_pending'
    | 'accepted'
    | 'sent_declined'
    | 'sent_cancelled';

export interface CollabActionProps {
    state: CollabState;
    /** Role of the *profile being viewed* so the UI picks the right theme. */
    role?: Role | string | null;
    onCollab?: () => void;
    onAccept?: () => void;
    onReject?: () => void;
    onChat?: () => void;
    onCall?: () => void;
    busy?: boolean;
}

/**
 * Centralizes the collab button state-machine. Every post/profile surface that
 * shows a collab CTA should render this component — do not hand-roll the logic
 * per screen.
 */
export default function CollabAction({
    state,
    role,
    onCollab,
    onAccept,
    onReject,
    onChat,
    onCall,
    busy,
}: CollabActionProps) {
    const layoutRow: React.ReactNode = (() => {
        switch (state) {
            case 'accepted':
                return (
                    <>
                        <Button
                            title="Quick Chat"
                            role={role}
                            variant="solid"
                            size="md"
                            leftIcon={<Ionicons name="chatbubble-ellipses" size={16} color="#fff" />}
                            onPress={onChat}
                            loading={busy}
                            style={styles.flex}
                        />
                        <Button
                            title="Call"
                            role={role}
                            variant="subtle"
                            size="md"
                            leftIcon={<Ionicons name="call" size={16} color={undefined} />}
                            onPress={onCall}
                            style={styles.flex}
                        />
                    </>
                );

            case 'received_pending':
                return (
                    <>
                        <Button
                            title="Accept"
                            role={role}
                            variant="solid"
                            size="md"
                            leftIcon={<Ionicons name="checkmark" size={16} color="#fff" />}
                            onPress={onAccept}
                            loading={busy}
                            style={styles.flex}
                        />
                        <Button
                            title="Reject"
                            role={role}
                            variant="outline"
                            size="md"
                            leftIcon={<Ionicons name="close" size={16} color={undefined} />}
                            onPress={onReject}
                            style={styles.flex}
                        />
                    </>
                );

            case 'sent_pending':
                return (
                    <Button
                        title="Request Sent"
                        role={role}
                        variant="subtle"
                        size="md"
                        leftIcon={<Ionicons name="time-outline" size={16} color={undefined} />}
                        disabled
                        style={styles.flex}
                    />
                );

            case 'sent_declined':
                return (
                    <Button
                        title="Send Again"
                        role={role}
                        variant="outline"
                        size="md"
                        leftIcon={<Ionicons name="refresh" size={16} color={undefined} />}
                        onPress={onCollab}
                        loading={busy}
                        style={styles.flex}
                    />
                );

            case 'sent_cancelled':
            case 'none':
            default:
                return (
                    <Button
                        title="Collab"
                        role={role}
                        variant="solid"
                        size="md"
                        leftIcon={<Ionicons name="paper-plane" size={16} color="#fff" />}
                        onPress={onCollab}
                        loading={busy}
                        style={styles.flex}
                    />
                );
        }
    })();

    return <View style={styles.row}>{layoutRow}</View>;
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', gap: 10 },
    flex: { flex: 1 },
});

/** Helper: derive a CollabState from a backend collab record + my user id. */
export function deriveCollabState(
    collab: { status?: string; senderId?: string; receiverId?: string } | null | undefined,
    myUserId: string | null | undefined,
): CollabState {
    if (!collab || !collab.status || !myUserId) return 'none';
    const iAmSender = collab.senderId === myUserId;
    switch (collab.status) {
        case 'PENDING':
            return iAmSender ? 'sent_pending' : 'received_pending';
        case 'ACCEPTED':
            return 'accepted';
        case 'DECLINED':
            // From the sender's perspective: they declined me. From the receiver's:
            // I already declined, no re-request. Map both to 'sent_declined' for the
            // viewer side since only the sender would see a "try again" button.
            return iAmSender ? 'sent_declined' : 'none';
        case 'CANCELLED':
            return iAmSender ? 'sent_cancelled' : 'none';
        default:
            return 'none';
    }
}
