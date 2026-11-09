import { Pressable, ScrollView, Text, View } from 'react-native';

import { BusinessRow, BusinessTile, LinkText, SectionTitle, styles } from '../../components';
import { Icon } from '../../icons';
import { categories } from '@pidohora/core/data';
import { useStore } from '../../store';
import { NEARBY_KM } from '@pidohora/core/location';
import { colors, radius, softTints } from '../../theme';

export function HomeTab() {
  const { businesses, account, session, place, distanceTo, setClientTab, setSearchCategory, setSearchQuery, startBooking, go } = useStore();

  // Con ubicación: solo lugares cerca (si hay muy pocos, ampliamos a los más cercanos).
  const withKm = businesses.map((b) => ({ b, km: distanceTo(b) ?? Infinity }));
  const nearby = withKm.filter((x) => x.km <= NEARBY_KM);
  const pool = !place ? businesses : (nearby.length >= 3 ? nearby : [...withKm].sort((a, c) => a.km - c.km).slice(0, 6)).map((x) => x.b);
  const fewNearby = !!place && nearby.length < 3;
  const closest = [...withKm].sort((a, c) => a.km - c.km).slice(0, 4).map((x) => x.b);

  const mostVisited = [...pool].sort((a, b) => b.visits - a.visits).slice(0, 6);
  const topRated = [...pool].filter((b) => b.reviewsCount > 20).sort((a, b) => b.rating - a.rating).slice(0, 4);
  const fresh = pool.filter((b) => b.isNew);
  const firstName = account?.name.split(' ')[0];

  const openSearch = (category: (typeof categories)[number]['id'] | null = null) => {
    setSearchQuery('');
    setSearchCategory(category);
    setClientTab('search');
  };

  return (
    <>
      <View style={{ gap: 2 }}>
        <Pressable
          onPress={() => go({ name: 'location' })}
          accessibilityRole="button"
          accessibilityLabel="Cambiar ubicación"
          hitSlop={8}
          style={[styles.row, { gap: 4, alignSelf: 'flex-start' }]}
        >
          <Icon name={place?.source === 'gps' ? 'navigation' : 'pin'} size={14} color={colors.primary} />
          <Text style={[styles.cardText, { color: colors.text, fontWeight: '600' }]}>
            {place ? `${place.source === 'home' ? 'Donde vives' : place.source === 'gps' ? 'Estás en' : 'Cerca de'} · ${place.label}` : 'Elige tu ubicación'}
          </Text>
          <View style={{ transform: [{ rotate: '90deg' }] }}>
            <Icon name="chevron" size={14} color={colors.muted} />
          </View>
        </Pressable>
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

      {!place ? (
        <Pressable
          onPress={() => go({ name: 'location' })}
          accessibilityRole="button"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.mintSoft, borderRadius: radius.lg, padding: 16 }}
        >
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="navigation" size={22} color={colors.mint} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.cardTitle}>¿Dónde estás?</Text>
            <Text style={styles.cardText}>Activa tu ubicación o elige tu comuna para ver lugares cerca de ti.</Text>
          </View>
          <Icon name="chevron" size={20} color={colors.mint} />
        </Pressable>
      ) : null}

      {fewNearby ? (
        <Text style={styles.cardText}>
          Aún hay pocos lugares en {place!.label}. Te mostramos los más cercanos.
        </Text>
      ) : null}

      <SectionTitle action={<LinkText label="Ver todos" onPress={() => openSearch()} />}>
        {place ? 'Más visitados cerca de ti' : 'Más visitados'}
      </SectionTitle>
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

      {place ? (
        <>
          <SectionTitle>Lo más cerca</SectionTitle>
          {closest.map((b) => (
            <BusinessRow key={b.id} business={b} onPress={() => startBooking(b.id)} />
          ))}
        </>
      ) : null}

      <SectionTitle>{place ? 'Mejor evaluados de la zona' : 'Mejor evaluados'}</SectionTitle>
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
