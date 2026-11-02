import { Text, View } from 'react-native';

import { Button, Card, Screen, styles } from '../components';
import { useStore } from '../store';
import { colors } from '../theme';
import { formatCLP, formatDuration } from '../utils';

export function ServicesScreen({ businessId }: { businessId: string }) {
  const { business, draft, setDraft, go } = useStore();
  const b = business(businessId);
  if (!draft) return null;

  const selected = b.services.filter((s) => draft.serviceIds.includes(s.id));
  const total = selected.reduce((sum, s) => sum + s.price, 0);
  const duration = selected.reduce((sum, s) => sum + s.durationMin, 0);

  const toggle = (id: string) => {
    const ids = draft.serviceIds.includes(id) ? draft.serviceIds.filter((x) => x !== id) : [...draft.serviceIds, id];
    setDraft({ ...draft, serviceIds: ids, start: null, assignedProfessionalId: null });
  };

  const next = () => {
    if (b.professionals.length === 1) {
      setDraft({ ...draft, professionalId: b.professionals[0].id, start: null, assignedProfessionalId: null });
      go({ name: 'datetime' });
    } else {
      go({ name: 'professional' });
    }
  };

  return (
    <Screen
      title={`${b.emoji} ${b.name}`}
      subtitle="Elige uno o varios servicios"
      footer={
        <>
          <View style={styles.rowBetween}>
            <Text style={styles.cardText}>
              {selected.length === 0
                ? 'Ningún servicio elegido'
                : `${selected.length} servicio${selected.length > 1 ? 's' : ''} · ${formatDuration(duration)}`}
            </Text>
            <Text style={styles.price}>{formatCLP(total)}</Text>
          </View>
          <Button label="Continuar" onPress={next} disabled={selected.length === 0} />
        </>
      }
    >
      {b.services.map((s) => {
        const isOn = draft.serviceIds.includes(s.id);
        return (
          <Card key={s.id} onPress={() => toggle(s.id)} selected={isOn}>
            <View style={styles.rowBetween}>
              <View style={[styles.row, { flex: 1 }]}>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    borderWidth: 2,
                    borderColor: isOn ? colors.primary : colors.border,
                    backgroundColor: isOn ? colors.primary : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isOn ? <Text style={{ color: '#fff', fontWeight: '800' }}>✓</Text> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{s.name}</Text>
                  <Text style={styles.cardText}>{formatDuration(s.durationMin)}</Text>
                </View>
              </View>
              <Text style={styles.price}>{formatCLP(s.price)}</Text>
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}
