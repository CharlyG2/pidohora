import { Pressable, ScrollView, Text, View } from 'react-native';

import { BusinessRow, BusinessTile, LinkText, SectionTitle, styles } from '../../components';
import { Icon } from '../../icons';
import { categories } from '../../data';
import { useStore } from '../../store';
import { colors, radius, softTints } from '../../theme';

export function HomeTab() {
  const { businesses, account, session, setClientTab, setSearchCategory, setSearchQuery, startBooking, go } = useStore();
  const mostVisited = [...businesses].sort((a, b) => b.visits - a.visits).slice(0, 6);
  const topRated = [...businesses].filter((b) => b.reviewsCount > 20).sort((a, b) => b.rating - a.rating).slice(0, 4);
  const fresh = businesses.filter((b) => b.isNew);
  const firstName = account?.name.split(' ')[0];

  const openSearch = (category: (typeof categories)[number]['id'] | null = null) => {
    setSearchQuery('');
    setSearchCategory(category);
    setClientTab('search');
  };

  return (
    <>
      <View style={{ gap: 2 }}>
        <View style={[styles.row, { gap: 4 }]}>
          <Icon name="pin" size={14} color={colors.primary} />
          <Text style={styles.cardText}>Santiago, Chile</Text>
        </View>
        <Text style={styles.title}>{firstName ? `Hola, ${firstName} 👋` : '¿Qué te hace falta hoy?'}</Text>
      </View>

      <Pressable
        onPress={() => openSearch()}
        accessibilityRole="search"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: colors.card,
          borderWidth: 1.5,
          borderColor: colors.border,
          borderRadius: radius.md,
          paddingHorizontal: 16,
          paddingVertical: 14,
        }}
      >
        <Icon name="search" size={20} color={colors.muted} />
        <Text style={{ color: colors.muted, fontSize: 16 }} numberOfLines={1}>
          ¿Qué servicio buscas?
        </Text>
      </Pressable>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {categories.map((c, i) => (
          <Pressable
            key={c.id}
            onPress={() => openSearch(c.id)}
            accessibilityRole="button"
            accessibilityLabel={c.label}
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
          >
            <View
              style={{ width: 112, height: 84, borderRadius: radius.md, padding: 10, justifyContent: 'space-between', backgroundColor: softTints[i % softTints.length] }}
            >
              <Text style={{ fontSize: 22 }}>{c.emoji}</Text>
              <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>{c.label}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <SectionTitle action={<LinkText label="Ver todos" onPress={() => openSearch()} />}>Más visitados</SectionTitle>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 4, paddingHorizontal: 2 }}>
        {mostVisited.map((b) => (
          <BusinessTile key={b.id} business={b} onPress={() => startBooking(b.id)} />
        ))}
      </ScrollView>

      {session?.role === 'guest' ? (
        <Pressable
          onPress={() => go({ name: 'register', role: 'client' })}
          accessibilityRole="button"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.primarySoft, borderRadius: radius.lg, padding: 16 }}
        >
          <Icon name="sparkle" size={22} color={colors.primary} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.cardTitle, { color: colors.primaryDark }]}>Estás como invitado</Text>
            <Text style={[styles.cardText, { color: colors.text }]}>Puedes reservar igual. Crea tu cuenta gratis para guardar tus horas y favoritos.</Text>
          </View>
          <Icon name="chevron" size={20} color={colors.primary} />
        </Pressable>
      ) : null}

      <SectionTitle>Mejor evaluados</SectionTitle>
      {topRated.map((b) => (
        <BusinessRow key={b.id} business={b} onPress={() => startBooking(b.id)} />
      ))}

      {fresh.length > 0 && (
        <>
          <SectionTitle>Nuevos en PidoHora</SectionTitle>
          {fresh.map((b) => (
            <BusinessRow key={b.id} business={b} onPress={() => startBooking(b.id)} />
          ))}
        </>
      )}
    </>
  );
}
