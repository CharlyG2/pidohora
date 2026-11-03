import { Pressable, ScrollView, Text, View } from 'react-native';

import { BusinessRow, BusinessTile, Card, LinkText, SectionTitle, styles } from '../../components';
import { categories } from '../../data';
import { useStore } from '../../store';
import { colors, radius } from '../../theme';

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
      <Text style={styles.title}>{firstName ? `Hola, ${firstName} 👋` : '¿Qué hora necesitas hoy?'}</Text>

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
          paddingHorizontal: 14,
          paddingVertical: 13,
        }}
      >
        <Text style={{ fontSize: 16 }}>🔍</Text>
        <Text style={{ color: colors.muted, fontSize: 16 }}>Busca un servicio: corte, manicure, masaje…</Text>
      </Pressable>

      {session?.role === 'guest' ? (
        <Card style={{ backgroundColor: colors.primarySoft, borderColor: colors.primarySoft, gap: 6 }}>
          <Text style={styles.cardTitle}>Estás como invitado</Text>
          <Text style={styles.cardText}>Puedes reservar igual. Crea tu cuenta para guardar tus horas y reservar más rápido.</Text>
          <LinkText label="Crear cuenta gratis ›" onPress={() => go({ name: 'register', role: 'client' })} />
        </Card>
      ) : null}

      <SectionTitle>Categorías</SectionTitle>
      <View style={styles.wrap}>
        {categories.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => openSearch(c.id)}
            accessibilityRole="button"
            style={{
              width: 80,
              alignItems: 'center',
              gap: 4,
              paddingVertical: 10,
              backgroundColor: colors.card,
              borderRadius: radius.md,
              borderWidth: 1.5,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 26 }}>{c.emoji}</Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>{c.label}</Text>
          </Pressable>
        ))}
      </View>

      <SectionTitle action={<LinkText label="Ver todos" onPress={() => openSearch()} />}>Más visitados</SectionTitle>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {mostVisited.map((b) => (
          <BusinessTile key={b.id} business={b} onPress={() => startBooking(b.id)} />
        ))}
      </ScrollView>

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
