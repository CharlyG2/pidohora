import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Badge, Card, Chip, Screen, SectionTitle, styles } from '../components';
import { useStore } from '../store';
import { colors, radius } from '../theme';
import { dayShort, formatCLP, formatDateLong, formatTime, nextDays, sameDay } from '../utils';

export function AgendaScreen({ businessId }: { businessId: string }) {
  const { business, bookings, togglePaid, cancelBooking } = useStore();
  const b = business(businessId);
  const days = useMemo(() => nextDays(14), []);
  const [day, setDay] = useState(days[0]);
  const [proFilter, setProFilter] = useState<string | null>(null);

  const dayBookings = bookings
    .filter((x) => x.businessId === b.id && sameDay(new Date(x.start), day))
    .filter((x) => !proFilter || x.professionalId === proFilter)
    .sort((a, c) => a.start.localeCompare(c.start));

  const collected = dayBookings.filter((x) => x.paid).reduce((s, x) => s + x.total, 0);
  const pending = dayBookings.filter((x) => !x.paid).reduce((s, x) => s + x.total, 0);

  return (
    <Screen title={`Agenda · ${b.name}`} subtitle="Vista del negocio">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {days.map((d) => {
          const on = sameDay(d, day);
          const count = bookings.filter((x) => x.businessId === b.id && sameDay(new Date(x.start), d)).length;
          return (
            <Pressable
              key={d.toISOString()}
              onPress={() => setDay(d)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={{
                width: 58,
                paddingVertical: 8,
                alignItems: 'center',
                borderRadius: radius.md,
                borderWidth: 1.5,
                borderColor: on ? colors.primary : colors.border,
                backgroundColor: on ? colors.primary : colors.card,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: on ? '#fff' : colors.muted }}>{dayShort(d)}</Text>
              <Text style={{ fontSize: 20, fontWeight: '800', color: on ? '#fff' : colors.text }}>{d.getDate()}</Text>
              <Text style={{ fontSize: 11, color: on ? '#fff' : colors.muted }}>{count ? `${count} res.` : '—'}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {b.professionals.length > 1 && (
        <View style={styles.wrap}>
          <Chip label="Todos" selected={proFilter === null} onPress={() => setProFilter(null)} />
          {b.professionals.map((p) => (
            <Chip key={p.id} label={p.name} selected={proFilter === p.id} onPress={() => setProFilter(p.id)} />
          ))}
        </View>
      )}

      <View style={[styles.row, { alignItems: 'stretch' }]}>
        <Stat label="Reservas" value={String(dayBookings.length)} />
        <Stat label="Cobrado" value={formatCLP(collected)} tone={colors.success} />
        <Stat label="Por cobrar" value={formatCLP(pending)} tone={colors.danger} />
      </View>

      <SectionTitle>{formatDateLong(day)}</SectionTitle>
      {dayBookings.length === 0 ? (
        <Text style={styles.cardText}>No hay reservas este día.</Text>
      ) : (
        dayBookings.map((x) => {
          const start = new Date(x.start);
          const end = new Date(start.getTime() + x.durationMin * 60_000);
          const pro = b.professionals.find((p) => p.id === x.professionalId);
          const services = b.services.filter((s) => x.serviceIds.includes(s.id));
          return (
            <Card key={x.id}>
              <View style={styles.rowBetween}>
                <Text style={[styles.cardTitle, { color: colors.primary }]}>
                  {formatTime(start)} – {formatTime(end)}
                </Text>
                <Badge label={x.paid ? 'Pagado' : 'Por cobrar'} tone={x.paid ? 'success' : 'warning'} />
              </View>
              <Text style={[styles.cardTitle, { marginTop: 4 }]}>{x.clientName}</Text>
              <Text style={styles.cardText}>{services.map((s) => s.name).join(' + ')}</Text>
              <Text style={styles.cardText}>
                Con {pro?.name} · {formatCLP(x.total)} · {x.paymentMethod === 'online' ? 'Pago en línea' : 'Paga en local'}
              </Text>
              <Text style={styles.cardText}>💬 {x.clientPhone}</Text>
              <View style={[styles.row, { marginTop: 10 }]}>
                <SmallAction
                  label={x.paid ? 'Marcar como no pagado' : 'Marcar como pagado'}
                  onPress={() => togglePaid(x.id)}
                />
                <SmallAction label="Cancelar" danger onPress={() => cancelBooking(x.id)} />
              </View>
            </Card>
          );
        })
      )}
    </Screen>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <Card style={{ flex: 1, paddingVertical: 10 }}>
      <Text style={[styles.cardText, { fontSize: 12 }]}>{label}</Text>
      <Text style={[styles.price, { fontSize: 18, color: tone ?? colors.text }]}>{value}</Text>
    </Card>
  );
}

function SmallAction({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: radius.sm,
        borderWidth: 1.5,
        borderColor: danger ? colors.dangerSoft : colors.border,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: '700', color: danger ? colors.danger : colors.primary }}>{label}</Text>
    </Pressable>
  );
}
