import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getRoleTheme } from '../theme/useRoleTheme';
import ExpandableText from './ui/ExpandableText';
import VerifiedBadge from './ui/VerifiedBadge';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

export interface PostCardProps {
  item: {
    id: string;
    ownerId?: string;
    ownerRole?: string;
    bannerUri: string | null;
    isInitials: boolean;
    initials: string;
    avatarUri?: string | null;
    name: string;
    role: string;
    desc: string;
    price: string;
    budget?: string | null;
    time: string;
    portfolioLink?: string | null;
    owner?: any;
    isPremium?: boolean;
  };
  onPostTap?: (postId: string, ownerId?: string) => void;
  onSeePortfolio?: (ownerId?: string, ownerRole?: string) => void;
  onShare?: (postId: string) => void;
  onMessage?: (ownerId?: string) => void;
  onCall?: (owner?: any) => void;
  onBookmark?: (postId: string) => void;
  // Owner-only actions (My Posts) — rendered in the header when provided.
  onEdit?: (postId: string) => void;
  onDelete?: (postId: string) => void;
}

export default function PostCard({
  item,
  onPostTap,
  onSeePortfolio,
  onShare,
  onMessage,
  onCall,
  onBookmark,
  onEdit,
  onDelete,
}: PostCardProps) {
  const postTheme = getRoleTheme(item.ownerRole);
  const postColor = postTheme.primary;

  return (
    <View style={styles.card}>
      {/* ── Header: Avatar, Name, See Portfolio, Share */}
      <View style={styles.cardHeader}>
        <TouchableOpacity
          style={styles.cardHeaderLeft}
          activeOpacity={0.7}
          onPress={() => onPostTap && onPostTap(item.id, item.ownerId)}
        >
          <View style={styles.avatarCircle}>
            {item.isInitials ? (
              <Image source={require('../assets/images/icon.png')} style={styles.cardAvatarImg} resizeMode="cover" />
            ) : (
              <Image source={{ uri: item.avatarUri! }} style={styles.cardAvatarImg} resizeMode="cover" />
            )}
          </View>
          <View style={styles.headerNameBlock}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
              <Text style={[styles.cardName, { flexShrink: 1 }]} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
              <VerifiedBadge isPremium={item.isPremium ?? item.owner?.isPremium} size={13} />
            </View>
            <Text style={styles.cardCategory}>{item.role}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.cardHeaderRight}>
          {onSeePortfolio && (
            <TouchableOpacity
              style={[styles.portfolioBtn, { backgroundColor: postColor }]}
              onPress={() => onSeePortfolio(item.ownerId, item.ownerRole)}
            >
              <Text style={styles.portfolioBtnText}>See Portfolio</Text>
            </TouchableOpacity>
          )}
          {onShare && (
            <TouchableOpacity style={styles.shareBtn} onPress={() => onShare(item.id)}>
              <Ionicons name="share-social-outline" size={18} color="#fff" />
            </TouchableOpacity>
          )}
          {onEdit && (
            <TouchableOpacity style={styles.ownerActionBtn} onPress={() => onEdit(item.id)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
              <Ionicons name="pencil-outline" size={17} color="#fff" />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity style={styles.ownerActionBtn} onPress={() => onDelete(item.id)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
              <Ionicons name="trash-outline" size={17} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Description */}
      <ExpandableText text={item.desc} style={styles.cardDesc} numberOfLines={2} />

      {/* ── Meta: Price + Time */}
      <View style={styles.cardMetaRow}>
        <Text style={[styles.cardPrice, { color: 'rgba(0, 164, 1, 1)' }]}>
          {item.price === 'Paid Collab'
            ? (item.budget ? `₹${String(item.budget).replace(/^₹\s*/, '')}` : 'Paid Collab')
            : 'Free Collab'}
        </Text>
        <View style={styles.cardTimeRow}>
          <Ionicons name="time-outline" size={14} color="#8A8A99" />
          <Text style={styles.cardTime}>{item.time || '4h ago'}</Text>
        </View>
      </View>

      {/* ── Banner Image with Floating Actions */}
      <View style={styles.cardBannerContainer}>
        <Image source={item.bannerUri ? { uri: item.bannerUri } : require('../assets/images/icon.png')} style={styles.cardBanner} resizeMode={item.bannerUri ? 'cover' : 'contain'} />
        <View style={styles.bannerOverlay} />

        {/* Floating Actions */}
        <View style={styles.bannerActionsLeft}>
          {onMessage && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: postColor }]}
              onPress={() => onMessage(item.ownerId)}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={16} color="#fff" />
            </TouchableOpacity>
          )}
          {onCall && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: postColor }]}
              onPress={() => onCall(item.owner)}
            >
              <Ionicons name="call-outline" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.bannerActionsRight}>
          {onBookmark && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: postColor }]} onPress={() => onBookmark(item.id)}>
              <Ionicons name="bookmark-outline" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    minHeight: 392,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(156, 156, 156, 0.50)',
    backgroundColor: 'rgba(30, 30, 36, 1)',
    padding: 16,
    marginBottom: 20,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    flexShrink: 1,
    marginRight: 8,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardAvatarImg: {
    width: '100%',
    height: '100%',
  },
  initialsText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  headerNameBlock: {
    gap: 2,
    flexShrink: 1,
  },
  cardName: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'manrope-600semibold',
    lineHeight: 14,
    letterSpacing: -0.5
  },
  cardCategory: {
    color: '#A0A0A0',
    fontSize: 12,
    fontFamily: 'poppins-400Regular',
    lineHeight: 14,
    letterSpacing: -0.5
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 0,
  },
  portfolioBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  portfolioBtnText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    lineHeight: 16,
  },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardDesc: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'poppins_400Regular',
    lineHeight: 20,
    marginBottom: 12,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardPrice: {
    fontSize: 12,
    fontFamily: 'poppins-500Medium',
    lineHeight: 14,
  },
  cardTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTime: {
    color: '#8A8A99',
    fontSize: 10,
    fontFamily: 'inter-500Medium',
  },
  cardBannerContainer: {
    height: 220,
    width: '100%',
    borderRadius: 30,
    overflow: 'hidden',
    position: 'relative',
  },
  cardBanner: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  bannerActionsLeft: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    gap: 12,
  },
  bannerActionsRight: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
});
