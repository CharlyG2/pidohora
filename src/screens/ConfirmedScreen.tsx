import { Text, View } from 'react-native';

import { Badge, Button, Card, Screen, styles } from '../components';
import { useStore } from '../store';
import { colors } from '../theme';
import { formatCLP, formatDateLong, formatTime } from '../utils';

export function ConfirmedScreen({ bookingId }: { bookingId: string }) {
  const { bookings, business, reset, go } = useStore();
  const booking = bookings.find((x) => x.id === bookingId);
  if (!booking) return null;
  const b = business(booking.businessId);
  const pro = b.professionals.find((p) => p.id === booking.professionalId);
  const start = new Date(booking.start);
  const services = b.services.filter((s) => booking.serviceIds.includes(s.id));

  return (
    <Screen
      title="¡Listo, tienes hora! 🎉"
      canGoBack={false}
      footer={
        <>
          <Button label="Volver al inicio" onPress={reset} />
          <Button
            label={`Ver la agenda de ${b.name}`}
            variant="secondary"
            onPress={() => {
              reset();
              go({ name: 'agenda', businessId: b.id });
            }}
          />
        </>
      }
    >
      <Card>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>
            {b.emoji} {b.name}
          </Text>
          <Badge label={booking.paid ? 'Pagado' : 'Paga en el local'} tone={booking.paid ? 'success' : 'warning'} />
        </View>
        <Text style={[styles.title, { fontSize: 22, marginTop: 8 }]}>
          {formatDateLong(start)}, {formatTime(start)}
        </Text>
        <Text style={styles.cardText}>Con {pro?.name}</Text>
        <Text style={styles.cardText}>{services.map((s) => s.name).join(' + ')}</Text>
        <Text style={[styles.price, { marginTop: 6 }]}>{formatCLP(booking.total)}</Text>
        <Text style={styles.cardText}>{b.address}</Text>
      </Card>

      <Card style={{ backgroundColor: colors.primarySoft, borderColor: colors.primarySoft }}>
        <Text style={styles.cardTitle}>💬 Te escribiremos por WhatsApp</Text>
        <Text style={styles.cardText}>
          Al {booking.clientPhone} te llegará la confirmación ahora y un recordatorio el día antes. Desde ahí podrás
          cambiar o cancelar tu hora. (En esta versión de prueba aún no se envían mensajes.)
        </Text>
      </Card>
    </Screen>
  );
}
