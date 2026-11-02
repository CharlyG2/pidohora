import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { Button, Card, Screen, SectionTitle, styles } from '../components';
import { useStore } from '../store';
import { colors } from '../theme';
import { formatCLP, formatDateLong, formatDuration, formatTime, isValidChileanPhone } from '../utils';

export function DetailsScreen() {
  const { business, draft, addBooking, go } = useStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+56 9 ');
  const [method, setMethod] = useState<'online' | 'local'>('online');
  const [touched, setTouched] = useState(false);

  if (!draft || !draft.start) return null;
  const b = business(draft.businessId);
  const services = b.services.filter((s) => draft.serviceIds.includes(s.id));
  const total = services.reduce((sum, s) => sum + s.price, 0);
  const duration = services.reduce((sum, s) => sum + s.durationMin, 0);
  const proId = draft.professionalId ?? draft.assignedProfessionalId!;
  const pro = b.professionals.find((p) => p.id === proId);
  const start = new Date(draft.start);

  const nameOk = name.trim().length >= 2;
  const phoneOk = isValidChileanPhone(phone);

  const confirm = () => {
    setTouched(true);
    if (!nameOk || !phoneOk) return;
    const booking = addBooking({
      businessId: b.id,
      professionalId: proId,
      serviceIds: draft.serviceIds,
      start: draft.start!,
      durationMin: duration,
      total,
      clientName: name.trim(),
      clientPhone: phone.trim(),
      // Pago simulado: en esta versión no se cobra de verdad.
      paid: method === 'online',
      paymentMethod: method,
    });
    go({ name: 'confirmed', bookingId: booking.id });
  };

  return (
    <Screen
      title="Confirma tu hora"
      footer={
        <Button
          label={method === 'online' ? `Pagar ${formatCLP(total)} y reservar` : 'Reservar y pagar en el local'}
          onPress={confirm}
        />
      }
    >
      <Card>
        <Text style={styles.cardTitle}>
          {b.emoji} {b.name}
        </Text>
        <Text style={styles.cardText}>
          {formatDateLong(start)} · {formatTime(start)} · {formatDuration(duration)}
        </Text>
        <Text style={styles.cardText}>Con {pro?.name}</Text>
        <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 10 }} />
        {services.map((s) => (
          <View key={s.id} style={styles.rowBetween}>
            <Text style={styles.cardText}>{s.name}</Text>
            <Text style={styles.cardText}>{formatCLP(s.price)}</Text>
          </View>
        ))}
        <View style={[styles.rowBetween, { marginTop: 6 }]}>
          <Text style={styles.cardTitle}>Total</Text>
          <Text style={styles.price}>{formatCLP(total)}</Text>
        </View>
      </Card>

      <SectionTitle>Tus datos</SectionTitle>
      <View>
        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ej: Camila González"
          placeholderTextColor={colors.muted}
          autoComplete="name"
        />
        {touched && !nameOk ? <Text style={styles.error}>Escribe tu nombre.</Text> : null}
      </View>
      <View>
        <Text style={styles.label}>WhatsApp</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoComplete="tel"
        />
        {touched && !phoneOk ? (
          <Text style={styles.error}>Revisa el número. Debe ser un celular chileno, ej: +56 9 1234 5678.</Text>
        ) : (
          <Text style={[styles.cardText, { marginTop: 4, fontSize: 13 }]}>
            Aquí te llegan la confirmación y el recordatorio.
          </Text>
        )}
      </View>

      <SectionTitle>¿Cómo quieres pagar?</SectionTitle>
      <Card onPress={() => setMethod('online')} selected={method === 'online'}>
        <Text style={styles.cardTitle}>💳 Pagar ahora con tarjeta o Webpay</Text>
        <Text style={styles.cardText}>Tu hora queda asegurada. (En esta versión de prueba el pago es simulado.)</Text>
      </Card>
      <Card onPress={() => setMethod('local')} selected={method === 'local'}>
        <Text style={styles.cardTitle}>🏪 Pagar en el local</Text>
        <Text style={styles.cardText}>Pagas cuando te atiendan.</Text>
      </Card>
    </Screen>
  );
}
