import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Button, Chip, Field, Screen, SectionTitle, styles } from '../../components';
import { useStore } from '../../store';
import { colors } from '../../theme';
import { addDays, dayShort, formatCLP, formatDuration, formatTime, isValidChileanPhone, sameDay, startOfDay } from '@pidohora/core/utils';

/** El negocio agenda una hora a mano (por ejemplo, alguien que llamó o llegó al local). */
export function NewBookingScreen({ start: initialStart, professionalId }: { start?: string; professionalId?: string }) {
  const { myBusiness, bookings, addBooking, back } = useStore();
  const initial = initialStart ? new Date(initialStart) : null;
  const [day, setDay] = useState(() => startOfDay(initial ?? new Date()));
  const [time, setTime] = useState<string | null>(initial ? formatTime(initial) : null);
  const [proId, setProId] = useState(professionalId ?? myBusiness?.professionals[0]?.id ?? '');
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+56 9 ');
  const [note, setNote] = useState('');
  const [touched, setTouched] = useState(false);
  const days = useMemo(() => Array.from({ length: 21 }, (_, i) => addDays(startOfDay(new Date()), i - 1)), []);
  if (!myBusiness) return null;

  const services = myBusiness.services.filter((s) => serviceIds.includes(s.id));
  const duration = services.reduce((s, x) => s + x.durationMin, 0);
  const total = services.reduce((s, x) => s + x.price, 0);
  const hours = myBusiness.hours[day.getDay()];
  const times: string[] = [];
  if (hours) {
    for (let h = hours.open; h < hours.close; h++) {
      times.push(`${String(h).padStart(2, '0')}:00`, `${String(h).padStart(2, '0')}:30`);
    }
  }

  const startDate = (() => {
    if (!time) return null;
    const [h, m] = time.split(':').map(Number);
    const d = new Date(day);
    d.setHours(h, m, 0, 0);
    return d;
  })();

  const clash =
    startDate && duration
      ? bookings.find((b) => {
          if (b.businessId !== myBusiness.id || b.professionalId !== proId) return false;
          const s = new Date(b.start).getTime();
          const e = s + b.durationMin * 60_000;
          const ns = startDate.getTime();
          return ns < e && ns + duration * 60_000 > s;
        })
      : undefined;

  const errors = {
    services: serviceIds.length === 0 ? 'Elige al menos un servicio.' : null,
    time: !time ? 'Elige una hora.' : clash ? `Choca con la hora de ${clash.clientName} (${formatTime(new Date(clash.start))}).` : null,
    name: name.trim().length < 2 ? 'Escribe el nombre del cliente.' : null,
    phone: !isValidChileanPhone(phone) ? 'Revisa el número, ej: +56 9 1234 5678.' : null,
  };

  const save = () => {
    setTouched(true);
    if (Object.values(errors).some(Boolean) || !startDate) return;
    addBooking({
      businessId: myBusiness.id,
      professionalId: proId,
      serviceIds,
      start: startDate.toISOString(),
      durationMin: duration,
      total,
      clientName: name.trim(),
      clientPhone: phone.trim(),
      paid: false,
      paymentMethod: 'local',
      source: 'manual',
      note: note.trim() || undefined,
    });
    back();
  };

  return (
    <Screen
      title="Nueva reserva"
      subtitle="Para clientes que te escriben, llaman o llegan al local."
      footer={
        <>
          {services.length > 0 ? (
            <View style={styles.rowBetween}>
              <Text style={styles.cardText}>{formatDuration(duration)}</Text>
              <Text style={styles.price}>{formatCLP(total)}</Text>
            </View>
          ) : null}
          <Button label="Guardar reserva" onPress={save} />
        </>
      }
    >
      <SectionTitle>Servicios</SectionTitle>
      <View style={styles.wrap}>
        {myBusiness.services.map((s) => (
          <Chip
            key={s.id}
            small
            label={`${s.name} · ${formatCLP(s.price)}`}
            selected={serviceIds.includes(s.id)}
            onPress={() => setServiceIds(serviceIds.includes(s.id) ? serviceIds.filter((x) => x !== s.id) : [...serviceIds, s.id])}
          />
        ))}
      </View>
      {touched && errors.services ? <Text style={styles.error}>{errors.services}</Text> : null}

      {myBusiness.professionals.length > 1 && (
        <>
          <SectionTitle>Con quién</SectionTitle>
          <View style={styles.wrap}>
            {myBusiness.professionals.map((p) => (
              <Chip key={p.id} small label={p.name} selected={proId === p.id} onPress={() => setProId(p.id)} />
            ))}
          </View>
        </>
      )}

      <SectionTitle>Día</SectionTitle>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {days.map((d) => (
          <Chip
            key={d.toISOString()}
            small
            label={`${dayShort(d)} ${d.getDate()}`}
            selected={sameDay(d, day)}
            onPress={() => {
              setDay(d);
              setTime(null);
            }}
          />
        ))}
      </ScrollView>

      <SectionTitle>Hora</SectionTitle>
      {times.length === 0 ? (
        <Text style={styles.cardText}>Este día está cerrado según tu horario.</Text>
      ) : (
        <View style={styles.wrap}>
          {times.map((t) => (
            <Chip key={t} small label={t} selected={time === t} onPress={() => setTime(t)} />
          ))}
        </View>
      )}
      {(touched || clash) && errors.time ? <Text style={styles.error}>{errors.time}</Text> : null}

      <SectionTitle>Cliente</SectionTitle>
      <Field label="Nombre" value={name} onChangeText={setName} placeholder="Ej: Pedro Soto" error={touched ? errors.name : null} nativeID="nb-name" />
      <Field label="WhatsApp" value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={touched ? errors.phone : null} hint="Le enviaremos la confirmación y el recordatorio." nativeID="nb-phone" />
      <Field label="Nota (opcional)" value={note} onChangeText={setNote} placeholder="Ej: prefiere degradado bajo" nativeID="nb-note" />
      <Text style={[styles.cardText, { fontSize: 12, color: colors.muted }]}>Las reservas a mano quedan como “por cobrar”.</Text>
    </Screen>
  );
}
