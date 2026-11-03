import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Card, Chip, EmptyState, Rating, SectionTitle, styles } from '../../components';
import { categories, categoryOf } from '../../data';
import { useStore } from '../../store';
import { colors, radius } from '../../theme';
import { formatCLP, formatDuration, norm } from '../../utils';

const SUGGESTIONS = ['Corte de pelo', 'Manicure', 'Masaje', 'Limpieza facial', 'Kinesiología', 'Baño mascota', 'Psicólogo'];

export function SearchTab() {
  const { businesses, searchQuery, setSearchQuery, searchCategory, setSearchCategory, startBooking } = useStore();
  const q = norm(searchQuery.trim());
  const words = q.split(/\s+/).filter(Boolean);

  const results = businesses
    .filter((b) => !searchCategory || b.category === searchCategory)
    .map((b) => {
      const haystack = norm(`${b.name} ${categoryOf(b.category).label} ${b.comuna}`);
      // Un servicio coincide si todas las palabras están en su nombre o en los datos del negocio,
      // y al menos una está en el nombre del servicio.
      const matchingServices = b.services.filter((s) => {
        const name = norm(s.name);
        return (
          words.length > 0 &&
          words.every((w) => name.includes(w) || haystack.includes(w)) &&
          words.some((w) => name.includes(w))
        );
      });
      const businessMatch = words.every((w) => haystack.includes(w));
      return { b, matchingServices, show: businessMatch || matchingServices.length > 0 };
    })
    .filter((r) => r.show)
    .sort((a, c) => c.matchingServices.length - a.matchingServices.length || c.b.visits - a.b.visits);

  const showSuggestions = !q && !searchCategory;

  return (
    <>
      <Text style={styles.title}>Buscar</Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: colors.card,
          borderWidth: 1.5,
          borderColor: colors.primary,
          borderRadius: radius.md,
          paddingHorizontal: 14,
        }}
      >
        <Text style={{ fontSize: 16 }}>🔍</Text>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="¿Qué servicio buscas?"
          placeholderTextColor={colors.muted}
          autoFocus
          nativeID="search-input"
          style={[{ flex: 1, paddingVertical: 13, fontSize: 16, color: colors.text }, { outlineStyle: 'none' } as object]}
        />
        {searchQuery ? (
          <Pressable onPress={() => setSearchQuery('')} accessibilityLabel="Borrar búsqueda" hitSlop={8}>
            <Text style={{ fontSize: 16, color: colors.muted }}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        <Chip small label="Todos" selected={!searchCategory} onPress={() => setSearchCategory(null)} />
        {categories.map((c) => (
          <Chip
            key={c.id}
            small
            label={`${c.emoji} ${c.label}`}
            selected={searchCategory === c.id}
            onPress={() => setSearchCategory(searchCategory === c.id ? null : c.id)}
          />
        ))}
      </ScrollView>

      {showSuggestions ? (
        <>
          <SectionTitle>Búsquedas populares</SectionTitle>
          <View style={styles.wrap}>
            {SUGGESTIONS.map((s) => (
              <Chip key={s} small label={s} onPress={() => setSearchQuery(s.split(' ')[0])} />
            ))}
          </View>
        </>
      ) : null}

      <SectionTitle>
        {results.length} {results.length === 1 ? 'lugar' : 'lugares'}
      </SectionTitle>

      {results.length === 0 ? (
        <EmptyState icon="🤔" title="No encontramos resultados" text="Prueba con otra palabra, por ejemplo “corte”, “uñas” o “masaje”, o quita el filtro de categoría." />
      ) : (
        results.map(({ b, matchingServices }) => (
          <Card key={b.id} onPress={() => startBooking(b.id)}>
            <View style={styles.row}>
              <View style={styles.thumb}>
                <Text style={{ fontSize: 28 }}>{b.emoji}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {b.name}
                </Text>
                <Text style={styles.cardText} numberOfLines={1}>
                  {categoryOf(b.category).label} · {b.comuna}
                </Text>
                <Rating business={b} />
              </View>
            </View>
            {matchingServices.length > 0 && (
              <View style={{ marginTop: 10, gap: 6 }}>
                {matchingServices.slice(0, 3).map((s) => (
                  <Pressable
                    key={s.id}
                    onPress={() => startBooking(b.id, [s.id])}
                    accessibilityRole="button"
                    style={[styles.rowBetween, { backgroundColor: colors.bg, borderRadius: radius.sm, padding: 10 }]}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.cardTitle, { fontSize: 14 }]}>{s.name}</Text>
                      <Text style={[styles.cardText, { fontSize: 12 }]}>{formatDuration(s.durationMin)}</Text>
                    </View>
                    <Text style={[styles.price, { fontSize: 14 }]}>{formatCLP(s.price)}</Text>
                    <Text style={{ color: colors.primary, fontWeight: '700' }}>Reservar ›</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </Card>
        ))
      )}
    </>
  );
}
