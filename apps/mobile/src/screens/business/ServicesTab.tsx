import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { Avatar, Button, Card, SectionTitle, styles } from '../../components';
import { proColors } from '@pidohora/core/data';
import { useStore } from '../../store';
import { colors } from '../../theme';
import { formatCLP, formatDuration, newId } from '@pidohora/core/utils';

export function ServicesTab() {
  const { myBusiness, updateBusiness, go } = useStore();
  const [newPro, setNewPro] = useState('');
  if (!myBusiness) return null;

  const addPro = () => {
    const name = newPro.trim();
    if (!name) return;
    updateBusiness(myBusiness.id, {
      professionals: [
        ...myBusiness.professionals,
        { id: newId(), name, role: 'Profesional', color: proColors[myBusiness.professionals.length % proColors.length] },
      ],
    });
    setNewPro('');
  };

  return (
    <>
      <Text style={styles.title}>Servicios y equipo</Text>
      <Text style={styles.subtitle}>Esto es lo que ven tus clientes al reservar.</Text>

      <SectionTitle>Servicios</SectionTitle>
      {myBusiness.services.map((s) => (
        <Card key={s.id} onPress={() => go({ name: 'serviceEdit', serviceId: s.id })}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.cardTitle}>{s.name}</Text>
              <Text style={styles.cardText}>{formatDuration(s.durationMin)}</Text>
            </View>
            <Text style={styles.price}>{formatCLP(s.price)}</Text>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>Editar</Text>
          </View>
        </Card>
      ))}
      <Button label="+ Agregar servicio" variant="secondary" onPress={() => go({ name: 'serviceEdit' })} />

      <SectionTitle>Equipo</SectionTitle>
      {myBusiness.professionals.map((p) => (
        <Card key={p.id}>
          <View style={styles.row}>
            <Avatar label={p.name} color={p.color} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{p.name}</Text>
              <Text style={styles.cardText}>{p.role}</Text>
            </View>
            <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: p.color }} />
            {myBusiness.professionals.length > 1 ? (
              <Pressable
                onPress={() => updateBusiness(myBusiness.id, { professionals: myBusiness.professionals.filter((x) => x.id !== p.id) })}
                accessibilityRole="button"
                accessibilityLabel={`Quitar a ${p.name}`}
                hitSlop={8}
              >
                <Text style={{ color: colors.danger, fontWeight: '700' }}>Quitar</Text>
              </Pressable>
            ) : null}
          </View>
        </Card>
      ))}
      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={newPro}
          onChangeText={setNewPro}
          placeholder="Nombre de la persona"
          placeholderTextColor={colors.muted}
          onSubmitEditing={addPro}
          nativeID="new-pro"
        />
        <Button label="Agregar" onPress={addPro} disabled={!newPro.trim()} />
      </View>
    </>
  );
}
