import { Text, View } from 'react-native';

import { Card, Screen, SectionTitle, styles } from '../components';
import { businesses } from '../data';
import { useStore } from '../store';
import { colors } from '../theme';

export function HomeScreen() {
  const { go, setDraft } = useStore();

  const startBooking = (businessId: string) => {
    setDraft({ businessId, serviceIds: [], professionalId: null, start: null, assignedProfessionalId: null });
    go({ name: 'services', businessId });
  };

  return (
    <Screen
      title="Pide tu hora en segundos"
      subtitle="Elige el lugar, el servicio y la hora. Te confirmamos por WhatsApp."
      canGoBack={false}
    >
      <SectionTitle>Soy cliente: reservar</SectionTitle>
      {businesses.map((b) => (
        <Card key={b.id} onPress={() => startBooking(b.id)}>
          <View style={styles.row}>
            <Text style={{ fontSize: 34 }}>{b.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{b.name}</Text>
              <Text style={styles.cardText}>
                {b.category} · {b.address}
              </Text>
            </View>
            <Text style={{ fontSize: 22, color: colors.primary }}>›</Text>
          </View>
        </Card>
      ))}

      <SectionTitle>Soy negocio: ver mi agenda</SectionTitle>
      <Text style={styles.cardText}>
        Versión de prueba: entra como cualquiera de estos negocios para ver su agenda, quién pagó y cuánto se ha
        cobrado.
      </Text>
      <View style={styles.wrap}>
        {businesses.map((b) => (
          <Card key={b.id} onPress={() => go({ name: 'agenda', businessId: b.id })} style={{ paddingVertical: 10 }}>
            <Text style={[styles.cardTitle, { fontSize: 14 }]}>
              {b.emoji} {b.name}
            </Text>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
