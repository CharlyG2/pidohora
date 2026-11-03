import { Pressable, ScrollView, Text, View } from 'react-native';

import { Avatar } from '../../components';
import type { Booking, Business, Professional } from '../../data';
import { colors } from '../../theme';
import { addDays, dayShort, formatTime, monthGrid, sameDay, startOfWeek } from '../../utils';

export type CalendarView = 'day' | 'week' | 'month';

const HOUR_H = 56;
const GUTTER = 46;

type Props = {
  business: Business;
  bookings: Booking[];
  professionals: Professional[];
  view: CalendarView;
  date: Date;
  onSelectBooking: (id: string) => void;
  onCreateAt: (start: Date, professionalId?: string) => void;
  onPickDay: (d: Date) => void;
};

/** Agenda tipo Google Calendar / Outlook: vista día (columnas por profesional), semana y mes. */
export function Calendar(props: Props) {
  if (props.view === 'month') return <MonthGrid {...props} />;
  return <TimeGrid {...props} />;
}

function hourRange(business: Business) {
  const all = Object.values(business.hours).filter(Boolean) as { open: number; close: number }[];
  const open = Math.min(8, ...all.map((h) => h.open));
  const close = Math.max(20, ...all.map((h) => h.close));
  return { open, close };
}

type Column = { key: string; day: Date; professionalId?: string; header: React.ReactNode };

function TimeGrid({ business, bookings, professionals, view, date, onSelectBooking, onCreateAt, onPickDay }: Props) {
  const { open, close } = hourRange(business);
  const hours = Array.from({ length: close - open }, (_, i) => open + i);
  const today = new Date();

  const columns: Column[] =
    view === 'week'
      ? Array.from({ length: 7 }, (_, i) => {
          const d = addDays(startOfWeek(date), i);
          const isToday = sameDay(d, today);
          return {
            key: d.toISOString(),
            day: d,
            header: (
              <Pressable onPress={() => onPickDay(d)} accessibilityRole="button" style={{ alignItems: 'center', paddingVertical: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: isToday ? colors.primary : colors.muted }}>
                  {dayShort(d).toUpperCase()}
                </Text>
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isToday ? colors.primary : 'transparent',
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '800', color: isToday ? colors.onPrimary : colors.text }}>{d.getDate()}</Text>
                </View>
              </Pressable>
            ),
          };
        })
      : professionals.map((p) => ({
          key: p.id,
          day: date,
          professionalId: p.id,
          header: (
            <View style={{ alignItems: 'center', paddingVertical: 6, gap: 2 }}>
              <Avatar label={p.name} color={p.color} size={28} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }} numberOfLines={1}>
                {p.name}
              </Text>
            </View>
          ),
        }));

  const proIds = new Set(professionals.map((p) => p.id));
  const proColor = (id: string) => business.professionals.find((p) => p.id === id)?.color ?? colors.primary;
  const proName = (id: string) => business.professionals.find((p) => p.id === id)?.name ?? '';

  return (
    <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
      {/* Encabezado de columnas */}
      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ width: GUTTER }} />
        {columns.map((c) => (
          <View key={c.key} style={{ flex: 1, minWidth: 0, borderLeftWidth: 1, borderLeftColor: colors.border }}>
            {c.header}
          </View>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexDirection: 'row' }}>
        {/* Horas */}
        <View style={{ width: GUTTER }}>
          {hours.map((h) => (
            <View key={h} style={{ height: HOUR_H }}>
              <Text style={{ fontSize: 11, color: colors.muted, textAlign: 'right', paddingRight: 6, marginTop: -7 }}>
                {h === open ? '' : `${String(h).padStart(2, '0')}:00`}
              </Text>
            </View>
          ))}
        </View>

        {columns.map((c) => {
          const dayHours = business.hours[c.day.getDay()];
          const colBookings = bookings
            .filter((b) => sameDay(new Date(b.start), c.day))
            .filter((b) => (c.professionalId ? b.professionalId === c.professionalId : proIds.has(b.professionalId)));
          const laid = layoutLanes(colBookings);
          const isToday = sameDay(c.day, today);
          const nowTop = ((today.getHours() + today.getMinutes() / 60) - open) * HOUR_H;

          return (
            <View
              key={c.key}
              style={{ flex: 1, minWidth: 0, height: hours.length * HOUR_H, borderLeftWidth: 1, borderLeftColor: colors.border, position: 'relative' }}
            >
              {/* Celdas de media hora: tocar una crea una reserva a esa hora */}
              {hours.flatMap((h) =>
                [0, 30].map((m) => {
                  const isClosed = !dayHours || h < dayHours.open || h >= dayHours.close;
                  return (
                    <Pressable
                      key={`${h}-${m}`}
                      accessibilityLabel={`Nueva reserva ${h}:${m === 0 ? '00' : '30'}`}
                      onPress={() => {
                        const s = new Date(c.day);
                        s.setHours(h, m, 0, 0);
                        onCreateAt(s, c.professionalId);
                      }}
                      style={(state) => { const hovered = (state as { hovered?: boolean }).hovered; return ({
                        height: HOUR_H / 2,
                        borderTopWidth: m === 0 ? 1 : 0,
                        borderTopColor: colors.border,
                        backgroundColor: hovered ? colors.primarySoft : isClosed ? colors.sunken : 'transparent',
                      }); }}
                    />
                  );
                }),
              )}

              {laid.map(({ booking: b, lane, lanes }) => {
                const s = new Date(b.start);
                const top = ((s.getHours() + s.getMinutes() / 60) - open) * HOUR_H;
                const height = Math.max((b.durationMin / 60) * HOUR_H - 2, 18);
                const color = proColor(b.professionalId);
                const services = business.services.filter((x) => b.serviceIds.includes(x.id));
                return (
                  <Pressable
                    key={b.id}
                    onPress={() => onSelectBooking(b.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`${formatTime(s)} ${b.clientName}`}
                    style={{
                      position: 'absolute',
                      top: top + 1,
                      height,
                      left: `${(lane / lanes) * 100}%`,
                      width: `${100 / lanes}%`,
                      paddingHorizontal: 2,
                    }}
                  >
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: color + '26',
                        borderLeftWidth: 3,
                        borderLeftColor: color,
                        borderRadius: 4,
                        paddingHorizontal: 4,
                        paddingVertical: 2,
                        overflow: 'hidden',
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }} numberOfLines={1}>
                        {formatTime(s)} {b.clientName}
                      </Text>
                      {height > 36 ? (
                        <Text style={{ fontSize: 10, color: colors.muted }} numberOfLines={1}>
                          {services.map((x) => x.name).join(' + ')}
                          {view === 'week' ? ` · ${proName(b.professionalId)}` : ''}
                        </Text>
                      ) : null}
                      {height > 52 ? (
                        <Text style={{ fontSize: 10, fontWeight: '700', color: b.paid ? colors.success : colors.danger }} numberOfLines={1}>
                          {b.paid ? 'Pagado' : 'Por cobrar'}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}

              {isToday && nowTop > 0 && nowTop < hours.length * HOUR_H ? (
                <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: nowTop, height: 2, backgroundColor: colors.coral }}>
                  <View style={{ position: 'absolute', left: -4, top: -3, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.coral }} />
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

/** Reparte las citas que se cruzan en carriles lado a lado, como en Google Calendar. */
function layoutLanes(list: Booking[]) {
  const sorted = [...list].sort((a, b) => a.start.localeCompare(b.start));
  const out: { booking: Booking; lane: number; lanes: number }[] = [];
  let cluster: { booking: Booking; lane: number; end: number }[] = [];
  let clusterEnd = 0;

  const flush = () => {
    const lanes = Math.max(1, ...cluster.map((c) => c.lane + 1));
    cluster.forEach((c) => out.push({ booking: c.booking, lane: c.lane, lanes }));
    cluster = [];
  };

  for (const b of sorted) {
    const s = new Date(b.start).getTime();
    const e = s + b.durationMin * 60_000;
    if (cluster.length && s >= clusterEnd) flush();
    const usedLanes = new Set(cluster.filter((c) => c.end > s).map((c) => c.lane));
    let lane = 0;
    while (usedLanes.has(lane)) lane++;
    cluster.push({ booking: b, lane, end: e });
    clusterEnd = Math.max(clusterEnd, e);
  }
  if (cluster.length) flush();
  return out;
}

function MonthGrid({ business, bookings, professionals, date, onPickDay, onSelectBooking }: Props) {
  const days = monthGrid(date);
  const today = new Date();
  const proIds = new Set(professionals.map((p) => p.id));
  const proColor = (id: string) => business.professionals.find((p) => p.id === id)?.color ?? colors.primary;

  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row' }}>
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
          <Text key={d} style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: colors.muted, paddingVertical: 8 }}>
            {d.toUpperCase()}
          </Text>
        ))}
      </View>
      {Array.from({ length: 6 }, (_, w) => (
        <View key={w} style={{ flexDirection: 'row' }}>
          {days.slice(w * 7, w * 7 + 7).map((d) => {
            const inMonth = d.getMonth() === date.getMonth();
            const isToday = sameDay(d, today);
            const list = bookings
              .filter((b) => proIds.has(b.professionalId) && sameDay(new Date(b.start), d))
              .sort((a, b) => a.start.localeCompare(b.start));
            return (
              <Pressable
                key={d.toISOString()}
                onPress={() => onPickDay(d)}
                accessibilityRole="button"
                accessibilityLabel={`${d.getDate()}: ${list.length} reservas`}
                style={(state) => { const hovered = (state as { hovered?: boolean }).hovered; return ({
                  flex: 1,
                  minWidth: 0,
                  minHeight: 78,
                  borderTopWidth: 1,
                  borderLeftWidth: 1,
                  borderColor: colors.border,
                  padding: 3,
                  gap: 2,
                  backgroundColor: hovered ? colors.primarySoft : inMonth ? colors.card : colors.bg,
                }); }}
              >
                <View
                  style={{
                    alignSelf: 'center',
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isToday ? colors.primary : 'transparent',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: isToday ? colors.onPrimary : inMonth ? colors.text : colors.muted }}>
                    {d.getDate()}
                  </Text>
                </View>
                {list.slice(0, 2).map((b) => (
                  <Pressable key={b.id} onPress={() => onSelectBooking(b.id)} accessibilityRole="button">
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 10,
                        color: colors.text,
                        backgroundColor: proColor(b.professionalId) + '26',
                        borderRadius: 3,
                        paddingHorizontal: 3,
                        overflow: 'hidden',
                      }}
                    >
                      {formatTime(new Date(b.start))} {b.clientName.split(' ')[0]}
                    </Text>
                  </Pressable>
                ))}
                {list.length > 2 ? (
                  <Text style={{ fontSize: 10, fontWeight: '700', color: colors.primary }}>+{list.length - 2} más</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
