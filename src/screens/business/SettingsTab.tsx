import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Badge, Button, Card, SectionTitle, styles } from '../../components';
import { categoryOf } from '../../data';
import { useStore } from '../../store';
import { colors, radius } from '../../theme';

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function SettingsTab() {
  const { myBusiness, account, logout, resetDemo, updateBusiness } = useStore();
  const [confirmReset, setConfirmReset] = useState(false);
  if (!myBusiness || !account) return null;

  const toggleDay = (d: number) => {
    const hours = { ...myBusiness.hours };
    if (hours[d]) delete hours[d];
    else hours[d] = { open: 10, close: 19 };
    updateBusiness(myBusiness.id, { hours });
  };
  const shiftHour = (d: number, key: 'open' | 'close', delta: number) => {
    const h = myBusiness.hours[d];
    if (!h) return;
    const next = { ...h, [key]: Math.min(23, Math.max(6, h[key] + delta)) };
    if (next.open >= next.close) return;
    updateBusiness(myBusiness.id, { hours: { ...myBusiness.hours, [d]: next } });
  };

  return (
    <>
      <Text style={styles.title}>Ajustes</Text>

      <Card style={{ gap: 4 }}>
        <Text style={styles.cardTitle}>
          {myBusiness.emoji} {myBusiness.name}
        </Text>
        <Text style={styles.cardText}>
          {categoryOf(myBusiness.category).label} · {myBusiness.comuna}
        </Text>
        {myBusiness.address ? <Text style={styles.cardText}>📍 {myBusiness.address}</Text> : null}
        <Text style={styles.cardText}>
          Cuenta: {account.name} · {account.email}
        </Text>
      </Card>

      <SectionTitle>Tu link de reservas</SectionTitle>
      <Card style={{ gap: 6 }}>
        <Text selectable style={{ fontSize: 16, fontWeight: '700', color: colors.primary }}>
          pidohora.cl/{myBusiness.id}
        </Text>
        <Text style={styles.cardText}>Ponlo en tu Instagram, Google Maps y WhatsApp para que te reserven directo.</Text>
      </Card>

      <SectionTitle>Horario de atención</SectionTitle>
      <Card style={{ gap: 8 }}>
        {[1, 2, 3, 4, 5, 6, 0].map((d) => {
          const h = myBusiness.hours[d];
          return (
            <View key={d} style={styles.rowBetween}>
              <Pressable onPress={() => toggleDay(d)} accessibilityRole="switch" accessibilityState={{ checked: !!h }} style={[styles.row, { gap: 8 }]}>
                <View
                  style={{
                    width: 36,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: h ? colors.primary : colors.border,
                    padding: 2,
                    alignItems: h ? 'flex-end' : 'flex-start',
                  }}
                >
                  <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: colors.onPrimary }} />
                </View>
                <Text style={[styles.cardTitle, { fontSize: 14, width: 40 }]}>{DAY_NAMES[d]}</Text>
              </Pressable>
              {h ? (
                <View style={[styles.row, { gap: 8 }]}>
                  <Stepper value={`${h.open}:00`} onMinus={() => shiftHour(d, 'open', -1)} onPlus={() => shiftHour(d, 'open', 1)} />
                  <Stepper value={`${h.close}:00`} onMinus={() => shiftHour(d, 'close', -1)} onPlus={() => shiftHour(d, 'close', 1)} />
                </View>
              ) : (
                <Text style={styles.cardText}>Cerrado</Text>
              )}
            </View>
          );
        })}
      </Card>

      <SectionTitle>Plan y extras</SectionTitle>
      <Card style={{ gap: 6 }}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>Plan Base · $5.990 al mes</Text>
          <Badge label="3 meses gratis" tone="success" />
        </View>
        <Text style={styles.cardText}>Agenda ilimitada, recordatorios por WhatsApp y cobro con tarjeta.</Text>
      </Card>
      <Card style={{ gap: 6 }}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>💬 Promociones por WhatsApp</Text>
          <Badge label="Próximamente" tone="info" />
        </View>
        <Text style={styles.cardText}>Envía ofertas y horas libres a tus clientes. Paquetes desde $2.990.</Text>
      </Card>
      <Card style={{ gap: 6 }}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>💳 Cobros con tarjeta y Webpay</Text>
          <Badge label="Próximamente" tone="info" />
        </View>
        <Text style={styles.cardText}>El dinero llega directo a tu cuenta, sin intermediarios.</Text>
      </Card>

      <SectionTitle>Cuenta</SectionTitle>
      <Button label="Cerrar sesión" variant="secondary" onPress={logout} />
      {confirmReset ? (
        <Card style={{ gap: 8, borderColor: colors.dangerSoft }}>
          <Text style={styles.cardText}>Se borran todas las reservas y cuentas de prueba y vuelve todo al inicio. ¿Seguro?</Text>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Button label="Sí, reiniciar" variant="danger" onPress={resetDemo} />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="No" variant="secondary" onPress={() => setConfirmReset(false)} />
            </View>
          </View>
        </Card>
      ) : (
        <Button label="Reiniciar datos de prueba" variant="danger" onPress={() => setConfirmReset(true)} />
      )}
    </>
  );
}

function Stepper({ value, onMinus, onPlus }: { value: string; onMinus: () => void; onPlus: () => void }) {
  const btn = { width: 24, height: 24, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, alignItems: 'center' as const, justifyContent: 'center' as const };
  return (
    <View style={[styles.row, { gap: 4 }]}>
      <Pressable onPress={onMinus} style={btn} accessibilityLabel="Menos">
        <Text style={{ fontWeight: '800', color: colors.primary }}>−</Text>
      </Pressable>
      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, width: 44, textAlign: 'center' }}>{value}</Text>
      <Pressable onPress={onPlus} style={btn} accessibilityLabel="Más">
        <Text style={{ fontWeight: '800', color: colors.primary }}>+</Text>
      </Pressable>
    </View>
  );
}
