import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button, Chip, Field, Screen, styles } from '../../components';
import { useStore } from '../../store';
import { newId } from '@pidohora/core/utils';

const DURATIONS = [15, 20, 30, 45, 60, 90, 120, 180];

export function ServiceEditScreen({ serviceId }: { serviceId?: string }) {
  const { myBusiness, updateBusiness, back } = useStore();
  const existing = myBusiness?.services.find((s) => s.id === serviceId);
  const [name, setName] = useState(existing?.name ?? '');
  const [price, setPrice] = useState(existing ? String(existing.price) : '');
  const [duration, setDuration] = useState(existing?.durationMin ?? 30);
  const [touched, setTouched] = useState(false);
  if (!myBusiness) return null;

  const priceNum = Number(price.replace(/\D/g, ''));
  const errors = {
    name: name.trim().length < 2 ? 'Escribe el nombre del servicio.' : null,
    price: !priceNum ? 'Escribe el precio en pesos.' : null,
  };

  const save = () => {
    setTouched(true);
    if (errors.name || errors.price) return;
    const service = { id: existing?.id ?? newId(), name: name.trim(), price: priceNum, durationMin: duration };
    updateBusiness(myBusiness.id, {
      services: existing
        ? myBusiness.services.map((s) => (s.id === existing.id ? service : s))
        : [...myBusiness.services, service],
    });
    back();
  };

  const remove = () => {
    updateBusiness(myBusiness.id, { services: myBusiness.services.filter((s) => s.id !== existing?.id) });
    back();
  };

  return (
    <Screen
      title={existing ? 'Editar servicio' : 'Nuevo servicio'}
      footer={
        <>
          <Button label="Guardar" onPress={save} />
          {existing && myBusiness.services.length > 1 ? <Button label="Eliminar servicio" variant="danger" onPress={remove} /> : null}
        </>
      }
    >
      <Field label="Nombre" value={name} onChangeText={setName} placeholder="Ej: Corte + barba" error={touched ? errors.name : null} nativeID="svc-name" />
      <Field
        label="Precio (CLP)"
        value={price}
        onChangeText={setPrice}
        keyboardType="number-pad"
        placeholder="Ej: 12000"
        error={touched ? errors.price : null}
        nativeID="svc-price"
      />
      <View>
        <Text style={styles.label}>Duración</Text>
        <View style={styles.wrap}>
          {DURATIONS.map((d) => (
            <Chip key={d} small label={d < 60 ? `${d} min` : `${d / 60} h`} selected={duration === d} onPress={() => setDuration(d)} />
          ))}
        </View>
      </View>
    </Screen>
  );
}
