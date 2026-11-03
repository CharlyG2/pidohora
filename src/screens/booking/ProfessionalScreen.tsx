import { Text, View } from 'react-native';

import { Card, Screen, styles } from '../../components';
import { useStore } from '../../store';
import { Icon } from '../../icons';
import { colors } from '../../theme';

export function ProfessionalScreen() {
  const { business, draft, setDraft, go } = useStore();
  if (!draft) return null;
  const b = business(draft.businessId);

  const choose = (professionalId: string | null) => {
    setDraft({ ...draft, professionalId, start: null, assignedProfessionalId: null });
    go({ name: 'datetime' });
  };

  const options = [
    { id: null, name: 'Cualquiera disponible', role: 'Te mostramos todas las horas libres' },
    ...b.professionals,
  ];

  return (
    <Screen title="¿Con quién?" subtitle={b.name}>
      {options.map((p) => (
        <Card key={p.id ?? 'any'} onPress={() => choose(p.id)} selected={draft.professionalId === p.id}>
          <View style={styles.row}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.primarySoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.primary }}>
                {p.id ? p.name[0] : '★'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{p.name}</Text>
              <Text style={styles.cardText}>{p.role}</Text>
            </View>
            <Icon name="chevron" size={20} color={colors.muted} />
          </View>
        </Card>
      ))}
    </Screen>
  );
}
