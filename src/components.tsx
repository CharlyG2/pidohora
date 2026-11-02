import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useStore } from './store';
import { colors, MAX_WIDTH, radius } from './theme';

export function Screen({
  title,
  subtitle,
  canGoBack = true,
  footer,
  children,
}: {
  title: string;
  subtitle?: string;
  canGoBack?: boolean;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const { back } = useStore();
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerInner}>
          {canGoBack ? (
            <Pressable onPress={back} hitSlop={12} accessibilityRole="button" accessibilityLabel="Volver">
              <Text style={styles.back}>‹ Volver</Text>
            </Pressable>
          ) : (
            <Text style={styles.logo}>
              Pido<Text style={{ color: colors.accent }}>Hora</Text>
            </Text>
          )}
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.content}>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          {children}
        </View>
      </ScrollView>
      {footer ? (
        <View style={styles.footer}>
          <View style={styles.footerInner}>{footer}</View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

export function Card({
  children,
  onPress,
  selected,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  selected?: boolean;
  style?: ViewStyle;
}) {
  const content = <View style={[styles.card, selected && styles.cardSelected, style]}>{children}</View>;
  if (!onPress) return content;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
    >
      {content}
    </Pressable>
  );
}

export function Button({
  label,
  onPress,
  disabled,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}) {
  const primary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        primary ? styles.buttonPrimary : styles.buttonSecondary,
        disabled && styles.buttonDisabled,
        pressed && !disabled && { opacity: 0.85 },
      ]}
    >
      <Text style={[styles.buttonText, !primary && { color: colors.primary }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.section}>{children}</Text>;
}

export function Badge({ label, tone }: { label: string; tone: 'success' | 'warning' }) {
  const bg = tone === 'success' ? colors.successSoft : colors.dangerSoft;
  const fg = tone === 'success' ? colors.success : colors.danger;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerInner: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: 16,
    height: 52,
    justifyContent: 'center',
  },
  logo: { fontSize: 22, fontWeight: '800', color: colors.primary },
  back: { fontSize: 17, color: colors.primary, fontWeight: '600' },
  scroll: { paddingBottom: 32 },
  content: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 20, gap: 12 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 15, color: colors.muted, marginTop: -4, marginBottom: 4 },
  section: { fontSize: 13, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 12 },
  footer: { backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
  footerInner: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', padding: 16, gap: 8 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 14,
  },
  cardSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  button: { borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  buttonPrimary: { backgroundColor: colors.primary },
  buttonSecondary: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.primary },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    minWidth: 72,
    alignItems: 'center',
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 15, color: colors.text, fontWeight: '600' },
  chipTextSelected: { color: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  cardText: { fontSize: 14, color: colors.muted },
  price: { fontSize: 16, fontWeight: '700', color: colors.text },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 },
  error: { fontSize: 13, color: colors.danger, marginTop: 4 },
});
