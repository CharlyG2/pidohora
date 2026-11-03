import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { categoryOf, type Business } from './data';
import { useStore } from './store';
import { colors, MAX_WIDTH, radius } from './theme';
import { formatCLP, formatRating } from './utils';

export function Logo({ size = 22 }: { size?: number }) {
  return (
    <Text style={{ fontSize: size, fontWeight: '800', color: colors.primary }}>
      Pido<Text style={{ color: colors.accent }}>Hora</Text>
    </Text>
  );
}

/**
 * Pantalla estándar: barra superior (volver o logo), contenido con scroll y pie opcional.
 * `wide` deja el contenido a todo el ancho (para la agenda en escritorio).
 */
export function Screen({
  title,
  subtitle,
  canGoBack = true,
  headerRight,
  footer,
  bottomBar,
  scroll = true,
  wide = false,
  children,
}: {
  title?: string;
  subtitle?: string;
  canGoBack?: boolean;
  headerRight?: ReactNode;
  footer?: ReactNode;
  bottomBar?: ReactNode;
  scroll?: boolean;
  wide?: boolean;
  children: ReactNode;
}) {
  const { back } = useStore();
  const maxWidth = wide ? 1280 : MAX_WIDTH;
  const body = (
    <View style={[styles.content, { maxWidth }, !scroll && { flex: 1 }]}>
      {title ? (
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
      ) : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={[styles.headerInner, { maxWidth }]}>
          {canGoBack ? (
            <Pressable onPress={back} hitSlop={12} accessibilityRole="button" accessibilityLabel="Volver">
              <Text style={styles.back}>‹ Volver</Text>
            </Pressable>
          ) : (
            <Logo />
          )}
          {headerRight}
        </View>
      </View>
      {scroll ? <ScrollView contentContainerStyle={styles.scroll}>{body}</ScrollView> : body}
      {footer ? (
        <View style={styles.footer}>
          <View style={[styles.footerInner, { maxWidth }]}>{footer}</View>
        </View>
      ) : null}
      {bottomBar}
    </SafeAreaView>
  );
}

export function TabBar<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string; icon: string }[];
  active: T;
  onChange: (t: T) => void;
}) {
  return (
    <View style={styles.tabBar} accessibilityRole="tablist">
      <View style={styles.tabBarInner}>
        {tabs.map((t) => {
          const on = t.id === active;
          return (
            <Pressable
              key={t.id}
              onPress={() => onChange(t.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              style={styles.tab}
            >
              <Text style={{ fontSize: 20, opacity: on ? 1 : 0.55 }}>{t.icon}</Text>
              <Text style={[styles.tabLabel, on && { color: colors.primary }]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
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
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'danger' && styles.buttonDanger,
        disabled && styles.buttonDisabled,
        pressed && !disabled && { opacity: 0.85 },
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          variant !== 'primary' && { color: colors.primary },
          variant === 'danger' && { color: colors.danger },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  small,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  small?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, small && { paddingVertical: 6, minWidth: 0 }, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, small && { fontSize: 13 }, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <Pressable
            key={o.id}
            onPress={() => onChange(o.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[styles.segment, on && styles.segmentOn]}
          >
            <Text style={[styles.segmentText, on && { color: colors.text }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Field({
  label,
  error,
  hint,
  ...props
}: TextInputProps & { label: string; error?: string | null; hint?: string }) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={[styles.input, error ? { borderColor: colors.danger } : null]} placeholderTextColor={colors.muted} {...props} />
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <View style={[styles.rowBetween, { marginTop: 12 }]}>
      <Text style={styles.section}>{children}</Text>
      {action}
    </View>
  );
}

export function LinkText({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="link" hitSlop={8}>
      <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

export function Badge({ label, tone }: { label: string; tone: 'success' | 'warning' | 'info' }) {
  const bg = tone === 'success' ? colors.successSoft : tone === 'warning' ? colors.dangerSoft : colors.primarySoft;
  const fg = tone === 'success' ? colors.success : tone === 'warning' ? colors.danger : colors.primary;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function Rating({ business }: { business: Business }) {
  if (!business.reviewsCount) return <Badge label="Nuevo" tone="info" />;
  return (
    <Text style={{ fontSize: 13, color: colors.text, fontWeight: '700' }}>
      <Text style={{ color: colors.accent }}>★</Text> {formatRating(business.rating)}{' '}
      <Text style={{ color: colors.muted, fontWeight: '400' }}>({business.reviewsCount})</Text>
    </Text>
  );
}

export function Avatar({ label, color = colors.primary, size = 40 }: { label: string; color?: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color + '22',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: size * 0.42, fontWeight: '800', color }}>{label.slice(0, 1).toUpperCase()}</Text>
    </View>
  );
}

/** Tarjeta horizontal de negocio para listas. */
export function BusinessRow({ business, onPress }: { business: Business; onPress: () => void }) {
  const from = Math.min(...business.services.map((s) => s.price));
  return (
    <Card onPress={onPress}>
      <View style={styles.row}>
        <View style={styles.thumb}>
          <Text style={{ fontSize: 30 }}>{business.emoji}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {business.name}
          </Text>
          <Text style={styles.cardText} numberOfLines={1}>
            {categoryOf(business.category).label} · {business.comuna}
          </Text>
          <View style={[styles.row, { gap: 8 }]}>
            <Rating business={business} />
            {isFinite(from) ? <Text style={styles.cardText}>desde {formatCLP(from)}</Text> : null}
          </View>
        </View>
        <Text style={{ fontSize: 22, color: colors.primary }}>›</Text>
      </View>
    </Card>
  );
}

/** Tarjeta vertical para carruseles ("más visitados"). */
export function BusinessTile({ business, onPress }: { business: Business; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.tile, pressed && { opacity: 0.85 }]}>
      <View style={styles.tileCover}>
        <Text style={{ fontSize: 40 }}>{business.emoji}</Text>
      </View>
      <View style={{ padding: 10, gap: 2 }}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {business.name}
        </Text>
        <Text style={styles.cardText} numberOfLines={1}>
          {business.comuna}
        </Text>
        <Rating business={business} />
      </View>
    </Pressable>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: string; title: string; text: string; action?: ReactNode }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 32, gap: 8 }}>
      <Text style={{ fontSize: 42 }}>{icon}</Text>
      <Text style={[styles.cardTitle, { textAlign: 'center' }]}>{title}</Text>
      <Text style={[styles.cardText, { textAlign: 'center', maxWidth: 360 }]}>{text}</Text>
      {action ? <View style={{ marginTop: 8, alignSelf: 'stretch' }}>{action}</View> : null}
    </View>
  );
}

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerInner: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: { fontSize: 17, color: colors.primary, fontWeight: '600' },
  scroll: { paddingBottom: 32 },
  content: { width: '100%', alignSelf: 'center', paddingHorizontal: 16, paddingTop: 20, gap: 12 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 15, color: colors.muted, marginTop: -4, marginBottom: 4 },
  section: { fontSize: 13, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
  footer: { backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
  footerInner: { width: '100%', alignSelf: 'center', padding: 16, gap: 8 },
  tabBar: { backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
  tabBarInner: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', flexDirection: 'row' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8, gap: 2 },
  tabLabel: { fontSize: 11, fontWeight: '700', color: colors.muted },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 14,
  },
  cardSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  button: { borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center' },
  buttonPrimary: { backgroundColor: colors.primary },
  buttonSecondary: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.primary },
  buttonDanger: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.dangerSoft },
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
  segmented: { flexDirection: 'row', backgroundColor: colors.border, borderRadius: radius.sm, padding: 3 },
  segment: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  segmentOn: { backgroundColor: colors.card },
  segmentText: { fontSize: 13, fontWeight: '700', color: colors.muted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  cardText: { fontSize: 14, color: colors.muted },
  price: { fontSize: 16, fontWeight: '700', color: colors.text },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
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
    // En web, quitamos el borde negro del navegador; el borde del campo ya marca el foco.
    outlineStyle: 'none',
  } as object,
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 },
  error: { fontSize: 13, color: colors.danger, marginTop: 4 },
  hint: { fontSize: 13, color: colors.muted, marginTop: 4 },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tile: {
    width: 170,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tileCover: { height: 86, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 10 },
});
