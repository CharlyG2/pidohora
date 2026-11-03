import { Text, View } from 'react-native';

import { Badge, Button, Card, EmptyState, SectionTitle, styles } from '../../components';
import type { Booking } from '../../data';
import { useStore } from '../../store';
import { colors } from '../../theme';
import { formatCLP, formatDateLong, formatTime } from '../../utils';

export function MyBookingsTab() {
  const { myBookings, business, cancelBooking, startBooking, setClientTab, session, go } = useStore();
  const now = Date.now();
  const upcoming = myBookings.filter((b) => new Date(b.start).getTime() >= now).sort((a, c) => a.start.localeCompare(c.start));
  const past = myBookings.filter((b) => new Date(b.start).getTime() < now).sort((a, c) => c.start.localeCompare(a.start));

  const renderBooking = (x: Booking, isPast: boolean) => {
    const b = business(x.businessId);
    const pro = b.professionals.find((p) => p.id === x.professionalId);
    const start = new Date(x.start);
    const services = b.services.filter((s) => x.serviceIds.includes(s.id));
    return (
      <Card key={x.id} style={{ gap: 4 }}>
        <View style={styles.rowBetween}>
          <Text style={[styles.cardTitle, { color: colors.primary }]}>
            {formatDateLong(start)} · {formatTime(start)}
          </Text>
          {!isPast ? <Badge label={x.paid ? 'Pagado' : 'Paga en el local'} tone={x.paid ? 'success' : 'warning'} /> : null}
        </View>
        <Text style={styles.cardTitle}>
          {b.emoji} {b.name}
        </Text>
        <Text style={styles.cardText}>
          {services.map((s) => s.name).join(' + ')} · con {pro?.name}
        </Text>
        <Text style={styles.cardText}>
          {b.address} · {formatCLP(x.total)}
        </Text>
        <View style={[styles.row, { marginTop: 8 }]}>
          {isPast ? (
            <View style={{ flex: 1 }}>
              <Button label="Volver a reservar" variant="secondary" onPress={() => startBooking(b.id, x.serviceIds)} />
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <Button label="Cancelar hora" variant="danger" onPress={() => cancelBooking(x.id)} />
            </View>
          )}
        </View>
      </Card>
    );
  };

  return (
    <>
      <Text style={styles.title}>Mis horas</Text>
      {myBookings.length === 0 ? (
        <EmptyState
          icon="🗓️"
          title="Aún no tienes horas"
          text="Cuando reserves, tus horas aparecerán aquí con su recordatorio."
          action={<Button label="Buscar un lugar" onPress={() => setClientTab('search')} />}
        />
      ) : (
        <>
          <SectionTitle>Próximas</SectionTitle>
          {upcoming.length ? upcoming.map((x) => renderBooking(x, false)) : <Text style={styles.cardText}>No tienes horas próximas.</Text>}
          {past.length > 0 && (
            <>
              <SectionTitle>Anteriores</SectionTitle>
              {past.map((x) => renderBooking(x, true))}
            </>
          )}
        </>
      )}
      {session?.role === 'guest' && myBookings.length > 0 ? (
        <Card style={{ backgroundColor: colors.primarySoft, borderColor: colors.primarySoft, gap: 6 }}>
          <Text style={styles.cardText}>Como invitado, tus horas solo se guardan en este dispositivo.</Text>
          <Button label="Crear cuenta para no perderlas" variant="secondary" onPress={() => go({ name: 'register', role: 'client' })} />
        </Card>
      ) : null}
    </>
  );
}
