import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Button, Chip, Screen, SectionTitle, styles } from '../../components';
import { useStore } from '../../store';
import { colors, radius } from '../../theme';
import {
  availableSlots,
  dayShort,
  formatDateLong,
  formatDuration,
  formatTime,
  nextDays,
  sameDay,
} from '../../utils';

export function DateTimeScreen() {
  const { business, draft, setDraft, go, bookings } = useStore();
  const days = useMemo(() => nextDays(14), []);
  const [day, setDay] = useState<Date>(() => (draft?.start ? new Date(draft.start) : days[0]));

  if (!draft) return null;
  const b = business(draft.businessId);
  const duration = b.services
    .filter((s) => draft.serviceIds.includes(s.id))
    .reduce((sum, s) => sum + s.durationMin, 0);

  // Para "cualquiera disponible", juntamos las horas libres de todos y recordamos quién la tiene libre.
  const pros = draft.professionalId ? [draft.professionalId] : b.professionals.map((p) => p.id);
  const slotOwner = new Map<number, string>();
  for (const pid of pros) {
    for (const s of availableSlots(b, pid, day, duration, bookings)) {
      if (!slotOwner.has(s.getTime())) slotOwner.set(s.getTime(), pid);
    }
  }
  const slots = [...slotOwner.keys()].sort((a, c) => a - c).map((t) => new Date(t));
  const morning = slots.filter((s) => s.getHours() < 13);
  const afternoon = slots.filter((s) => s.getHours() >= 13);

  const selectSlot = (s: Date) =>
    setDraft({ ...draft, start: s.toISOString(), assignedProfessionalId: slotOwner.get(s.getTime()) ?? null });

  const proName = draft.professionalId
    ? b.professionals.find((p) => p.id === draft.professionalId)?.name
    : 'Cualquiera disponible';

  const renderSlots = (list: Date[]) => (
    <View style={styles.wrap}>
      {list.map((s) => (
        <Chip
          key={s.getTime()}
          label={formatTime(s)}
          selected={draft.start === s.toISOString()}
          onPress={() => selectSlot(s)}
        />
      ))}
    </View>
  );

  return (
    <Screen
      title="Elige día y hora"
      subtitle={`${proName} · ${formatDuration(duration)}`}
      footer={
        <Button
          label={draft.start ? `Reservar ${formatTime(new Date(draft.start))}` : 'Elige una hora'}
          onPress={() => go({ name: 'details' })}
          disabled={!draft.start}
        />
      }
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {days.map((d) => {
          const on = sameDay(d, day);
          const closed = !b.hours[d.getDay()];
          return (
            <Pressable
              key={d.toISOString()}
              onPress={() => {
                setDay(d);
                setDraft({ ...draft, start: null, assignedProfessionalId: null });
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={{
                width: 58,
                paddingVertical: 10,
                alignItems: 'center',
                borderRadius: radius.md,
                borderWidth: 1.5,
                borderColor: on ? colors.primary : colors.border,
                backgroundColor: on ? colors.primary : colors.card,
                opacity: closed ? 0.45 : 1,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: on ? colors.onPrimary : colors.muted }}>{dayShort(d)}</Text>
              <Text style={{ fontSize: 20, fontWeight: '800', color: on ? colors.onPrimary : colors.text }}>{d.getDate()}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={[styles.cardTitle, { marginTop: 8 }]}>{formatDateLong(day)}</Text>

      {!b.hours[day.getDay()] ? (
        <Text style={styles.cardText}>Este día el local está cerrado. Elige otro día.</Text>
      ) : slots.length === 0 ? (
        <Text style={styles.cardText}>No quedan horas libres este día. Prueba con otro.</Text>
      ) : (
        <>
          {morning.length > 0 && (
            <>
              <SectionTitle>Mañana</SectionTitle>
              {renderSlots(morning)}
            </>
          )}
          {afternoon.length > 0 && (
            <>
              <SectionTitle>Tarde</SectionTitle>
              {renderSlots(afternoon)}
            </>
          )}
        </>
      )}
    </Screen>
  );
}
