import { useState } from 'react';
import { Text, View } from 'react-native';

import { Avatar, Badge, Button, Card, Screen, SectionTitle, styles } from '../../components';
import { useStore } from '../../store';
import { colors } from '../../theme';
import { formatCLP, formatDateLong, formatDuration, formatTime } from '../../utils';

export function BookingDetailScreen({ bookingId }: { bookingId: string }) {
  const { bookings, business, updateBooking, cancelBooking, back } = useStore();
  const [reminderSent, setReminderSent] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const x = bookings.find((b) => b.id === bookingId);
  if (!x) {
    return (
      <Screen title="Reserva no encontrada">
        <Text style={styles.cardText}>Puede que se haya cancelado.</Text>
      </Screen>
    );
  }
  const b = business(x.businessId);
  const pro = b.professionals.find((p) => p.id === x.professionalId);
  const start = new Date(x.start);
  const end = new Date(start.getTime() + x.durationMin * 60_000);
  const services = b.services.filter((s) => x.serviceIds.includes(s.id));

  return (
    <Screen title={x.clientName} subtitle={`${formatDateLong(start)} · ${formatTime(start)} – ${formatTime(end)}`}>
      <View style={[styles.row, { gap: 8 }]}>
        <Badge label={x.paid ? 'Pagado' : 'Por cobrar'} tone={x.paid ? 'success' : 'warning'} />
        <Badge label={x.source === 'app' ? 'Reservó por la app' : 'Agendada a mano'} tone="info" />
      </View>

      <Card style={{ gap: 6 }}>
        {services.map((s) => (
          <View key={s.id} style={styles.rowBetween}>
            <Text style={styles.cardText}>
              {s.name} · {formatDuration(s.durationMin)}
            </Text>
            <Text style={styles.cardText}>{formatCLP(s.price)}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>Total</Text>
          <Text style={styles.price}>{formatCLP(x.total)}</Text>
        </View>
        <Text style={styles.cardText}>{x.paymentMethod === 'online' ? 'Pago en línea' : 'Paga en el local'}</Text>
      </Card>

      <Card>
        <View style={styles.row}>
          <Avatar label={pro?.name ?? '?'} color={pro?.color} />
          <View>
            <Text style={styles.cardTitle}>{pro?.name}</Text>
            <Text style={styles.cardText}>{pro?.role}</Text>
          </View>
        </View>
      </Card>

      <SectionTitle>Cliente</SectionTitle>
      <Card style={{ gap: 4 }}>
        <Text style={styles.cardTitle}>{x.clientName}</Text>
        <Text selectable style={styles.cardText}>
          💬 {x.clientPhone}
        </Text>
        {x.note ? <Text style={styles.cardText}>📝 {x.note}</Text> : null}
      </Card>

      <SectionTitle>Acciones</SectionTitle>
      <Button
        label={x.paid ? 'Marcar como no pagado' : `Marcar como pagado (${formatCLP(x.total)})`}
        onPress={() => updateBooking(x.id, { paid: !x.paid })}
      />
      <Button
        label={reminderSent ? '✓ Recordatorio enviado' : 'Enviar recordatorio por WhatsApp'}
        variant="secondary"
        disabled={reminderSent}
        onPress={() => setReminderSent(true)}
      />
      {reminderSent ? (
        <Text style={[styles.cardText, { fontSize: 12 }]}>En esta versión de prueba el mensaje es simulado.</Text>
      ) : null}
      {confirmCancel ? (
        <Card style={{ gap: 8, borderColor: colors.dangerSoft }}>
          <Text style={styles.cardText}>¿Cancelar la hora de {x.clientName}? Le avisaremos por WhatsApp.</Text>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Button
                label="Sí, cancelar"
                variant="danger"
                onPress={() => {
                  cancelBooking(x.id);
                  back();
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="No" variant="secondary" onPress={() => setConfirmCancel(false)} />
            </View>
          </View>
        </Card>
      ) : (
        <Button label="Cancelar reserva" variant="danger" onPress={() => setConfirmCancel(true)} />
      )}
    </Screen>
  );
}
