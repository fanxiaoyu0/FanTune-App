import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { getSongComments, Comment } from '../api/music';

interface Props {
  mixSongId: string;
}

export function Comments({ mixSongId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getSongComments(mixSongId).then(res => {
      setComments(res.comments);
      setTotal(res.total);
      setLoading(false);
    });
  }, [mixSongId]);

  if (loading) {
    return <ActivityIndicator color={colors.textSecondary} style={{ marginTop: 40 }} />;
  }

  return (
    <FlatList
      data={comments}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingBottom: 20 }}
      ListHeaderComponent={
        <Text style={styles.header}>评论 ({total > 10000 ? `${Math.floor(total / 10000)}万` : total})</Text>
      }
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View style={styles.content}>
            <Text style={styles.userName}>{item.userName}</Text>
            <Text style={styles.text}>{item.content}</Text>
          </View>
          {item.likeCount > 0 && (
            <Text style={styles.likes}>{item.likeCount > 999 ? `${Math.floor(item.likeCount / 1000)}k` : item.likeCount}</Text>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  content: { flex: 1 },
  userName: { fontSize: 12, color: colors.textTertiary, marginBottom: 4 },
  text: { fontSize: 14, color: colors.text, lineHeight: 20 },
  likes: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
});
