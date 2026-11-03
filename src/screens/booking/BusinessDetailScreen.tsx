import { Text, View } from 'react-native';

import { Avatar, Button, Card, Rating, Screen, SectionTitle, styles } from '../../components';
import { categoryOf } from '../../data';
import { useStore } from '../../store';
import { colors, radius } from '../../theme';
import { formatCLP, formatDuration } from '../../utils';

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function BusinessDetailScreen({ businessId }: { businessId: string }) {
  const { business, draft, setDraft, go } = useStore();
  const b = business(businessId);
  if (!draft) return null;

  const selected = b.services.filter((s) => draft.serviceIds.includes(s.id));
  const total = selected.reduce((sum, s) => sum + s.price, 0);
  const duration = selected.reduce((sum, s) => sum + s.durationMin, 0);
  const today = new Date().getDay();
  const todayHours = b.hours[today];

  const toggle = (id: string) => {
    const ids = draft.serviceIds.includes(id) ? draft.serviceIds.filter((x) => x !== id) : [...draft.serviceIds, id];
    setDraft({ ...draft, serviceIds: ids, start: null, assignedProfessionalId: null });
  };

  const next = () => {
    if (b.professionals.length === 1) {
      setDraft({ ...draft, professionalId: b.professionals[0].id, start: null, assignedProfessionalId: null });
      go({ name: 'datetime' });
    } else {
      go({ name: 'professional' });
    }
  };

  return (
    <Screen
      footer={
        <>
          <View style={styles.rowBetween}>
            <Text style={styles.cardText}>
              {selected.length === 0
                ? 'Elige uno o varios servicios'
                : `${selected.length} servicio${selected.length > 1 ? 's' : ''} · ${formatDuration(duration)}`}
            </Text>
            <Text style={styles.price}>{formatCLP(total)}</Text>
          </View>
          <Button label="Elegir hora" onPress={next} disabled={selected.length === 0} />
        </>
      }
    >
      <View
        style={{
          height: 120,
          borderRadius: radius.lg,
          backgroundColor: colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 64 }}>{b.emoji}</Text>
      </View>
      <View style={{ gap: 4 }}>
        <Text style={styles.title}>{b.name}</Text>
        <View style={[styles.row, { gap: 8, flexWrap: 'wrap' }]}>
          <Rating business={b} />
          <Text style={styles.cardText}>
            {categoryOf(b.category).label} · {b.comuna}
          </Text>
        </View>
        {b.address ? <Text style={styles.cardText}>📍 {b.address}</Text> : null}
        <Text style={styles.cardText}>
          🕒 Hoy: {todayHours ? `${todayHours.open}:00 a ${todayHours.close}:00` : 'cerrado'}
        </Text>
        {b.description ? <Text style={[styles.cardText, { color: colors.text, marginTop: 4 }]}>{b.description}</Text> : null}
      </View>

      <SectionTitle>Servicios</SectionTitle>
      {b.services.map((s) => {
        const isOn = draft.serviceIds.includes(s.id);
        return (
          <Card key={s.id} onPress={() => toggle(s.id)} selected={isOn}>
            <View style={styles.rowBetween}>
              <View style={[styles.row, { flex: 1 }]}>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    borderWidth: 2,
                    borderColor: isOn ? colors.primary : colors.border,
                    backgroundColor: isOn ? colors.primary : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isOn ? <Text style={{ color: '#fff', fontWeight: '800' }}>✓</Text> : null}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.cardTitle}>{s.name}</Text>
                  <Text style={styles.cardText}>{formatDuration(s.durationMin)}</Text>
                </View>
              </View>
              <Text style={styles.price}>{formatCLP(s.price)}</Text>
            </View>
          </Card>
        );
      })}

      <SectionTitle>Equipo</SectionTitle>
      <View style={styles.wrap}>
        {b.professionals.map((p) => (
          <View key={p.id} style={{ alignItems: 'center', width: 84, gap: 4 }}>
            <Avatar label={p.name} color={p.color} size={52} />
            <Text style={[styles.cardTitle, { fontSize: 14 }]}>{p.name}</Text>
            <Text style={[styles.cardText, { fontSize: 12 }]}>{p.role}</Text>
          </View>
        ))}
      </View>

      <SectionTitle>Horario</SectionTitle>
      <Card style={{ gap: 4 }}>
        {[1, 2, 3, 4, 5, 6, 0].map((d) => {
          const h = b.hours[d];
          return (
            <View key={d} style={styles.rowBetween}>
              <Text style={[styles.cardText, d === today && { color: colors.text, fontWeight: '700' }]}>{DAY_NAMES[d]}</Text>
              <Text style={[styles.cardText, d === today && { color: colors.text, fontWeight: '700' }]}>
                {h ? `${h.open}:00 – ${h.close}:00` : 'Cerrado'}
              </Text>
            </View>
          );
        })}
      </Card>

      {b.reviews.length > 0 && (
        <>
          <SectionTitle>Reseñas</SectionTitle>
          {b.reviews.map((r, i) => (
            <Card key={i} style={{ gap: 4 }}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>{r.author}</Text>
                <Text style={{ color: colors.accent }}>{'★'.repeat(r.rating)}</Text>
              </View>
              <Text style={[styles.cardText, { color: colors.text }]}>{r.text}</Text>
              <Text style={[styles.cardText, { fontSize: 12 }]}>hace {r.daysAgo} {r.daysAgo === 1 ? 'día' : 'días'}</Text>
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}
