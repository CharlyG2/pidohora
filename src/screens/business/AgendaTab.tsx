import { useState } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';

import { Button, Card, Chip, Segmented, styles } from '../../components';
import { useStore } from '../../store';
import { colors, radius } from '../../theme';
import { addDays, formatCLP, formatDateLong, formatMonthYear, sameDay, startOfDay, startOfWeek } from '../../utils';
import { Calendar, type CalendarView } from './Calendar';

export function AgendaTab() {
  const { myBusiness, bookings, go, setBusinessTab } = useStore();
  const { width } = useWindowDimensions();
  const [view, setView] = useState<CalendarView>(width >= 900 ? 'week' : 'day');
  const [date, setDate] = useState(() => startOfDay(new Date()));
  const [proFilter, setProFilter] = useState<string | null>(null);
  if (!myBusiness) return null;

  const pros = myBusiness.professionals.filter((p) => !proFilter || p.id === proFilter);
  const mine = bookings.filter((b) => b.businessId === myBusiness.id);

  const range =
    view === 'day'
      ? [date, addDays(date, 1)]
      : view === 'week'
        ? [startOfWeek(date), addDays(startOfWeek(date), 7)]
        : [new Date(date.getFullYear(), date.getMonth(), 1), new Date(date.getFullYear(), date.getMonth() + 1, 1)];
  const inRange = mine.filter((b) => {
    const t = new Date(b.start).getTime();
    return t >= range[0].getTime() && t < range[1].getTime() && pros.some((p) => p.id === b.professionalId);
  });
  const collected = inRange.filter((b) => b.paid).reduce((s, b) => s + b.total, 0);
  const pending = inRange.filter((b) => !b.paid).reduce((s, b) => s + b.total, 0);

  const step = (dir: 1 | -1) => {
    if (view === 'day') setDate(addDays(date, dir));
    else if (view === 'week') setDate(addDays(date, 7 * dir));
    else setDate(new Date(date.getFullYear(), date.getMonth() + dir, 1));
  };

  const label =
    view === 'day'
      ? formatDateLong(date)
      : view === 'week'
        ? `${formatMonthYear(startOfWeek(date))}`
        : formatMonthYear(date);

  const isToday = sameDay(date, new Date());
  const rangeLabel = view === 'day' ? (isToday ? 'hoy' : 'este día') : view === 'week' ? 'esta semana' : 'este mes';

  return (
    <View style={{ flex: 1, gap: 10, paddingBottom: 12 }}>
      {/* Barra de herramientas, como en Google Calendar / Outlook */}
      <View style={[styles.rowBetween, { flexWrap: 'wrap' }]}>
        <View style={[styles.row, { gap: 6 }]}>
          <Pressable
            onPress={() => setDate(startOfDay(new Date()))}
            accessibilityRole="button"
            style={{ borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.card }}
          >
            <Text style={{ fontWeight: '700', color: colors.text }}>Hoy</Text>
          </Pressable>
          <NavArrow label="‹" onPress={() => step(-1)} a11y="Anterior" />
          <NavArrow label="›" onPress={() => step(1)} a11y="Siguiente" />
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>{label.charAt(0).toUpperCase() + label.slice(1)}</Text>
        </View>
        <View style={[styles.row, { gap: 8 }]}>
          <Segmented
            options={[
              { id: 'day', label: 'Día' },
              { id: 'week', label: 'Semana' },
              { id: 'month', label: 'Mes' },
            ]}
            value={view}
            onChange={setView}
          />
          <Pressable
            onPress={() => go({ name: 'newBooking' })}
            accessibilityRole="button"
            style={{ backgroundColor: colors.primary, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 7 }}
          >
            <Text style={{ color: '#fff', fontWeight: '800' }}>+ Nueva</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }} style={{ flexGrow: 0 }}>
        <Chip small label="Todo el equipo" selected={!proFilter} onPress={() => setProFilter(null)} />
        {myBusiness.professionals.map((p) => (
          <Chip key={p.id} small label={p.name} selected={proFilter === p.id} onPress={() => setProFilter(proFilter === p.id ? null : p.id)} />
        ))}
      </ScrollView>

      <View style={[styles.row, { gap: 8 }]}>
        <Stat label={`Reservas ${rangeLabel}`} value={String(inRange.length)} />
        <Stat label="Cobrado" value={formatCLP(collected)} tone={colors.success} />
        <Stat label="Por cobrar" value={formatCLP(pending)} tone={colors.danger} />
      </View>

      {myBusiness.professionals.length === 0 ? (
        <Card>
          <Text style={styles.cardText}>Agrega a tu equipo en la pestaña Servicios para empezar a recibir reservas.</Text>
          <Button label="Ir a Servicios" variant="secondary" onPress={() => setBusinessTab('services')} />
        </Card>
      ) : (
        <View style={{ flex: 1, minHeight: view === 'month' ? undefined : 360 }}>
          <Calendar
            business={myBusiness}
            bookings={mine}
            professionals={pros}
            view={view}
            date={date}
            onSelectBooking={(id) => go({ name: 'bookingDetail', bookingId: id })}
            onCreateAt={(start, professionalId) => go({ name: 'newBooking', start: start.toISOString(), professionalId })}
            onPickDay={(d) => {
              setDate(startOfDay(d));
              setView('day');
            }}
          />
        </View>
      )}
      <Text style={[styles.cardText, { fontSize: 12 }]}>
        Toca un espacio libre para agendar a mano, o una cita para ver el detalle.
      </Text>
    </View>
  );
}

function NavArrow({ label, onPress, a11y }: { label: string; onPress: () => void; a11y: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text, marginTop: -2 }}>{label}</Text>
    </Pressable>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <Card style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 10 }}>
      <Text style={[styles.cardText, { fontSize: 11 }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.price, { fontSize: 16, color: tone ?? colors.text }]} numberOfLines={1}>
        {value}
      </Text>
    </Card>
  );
}
