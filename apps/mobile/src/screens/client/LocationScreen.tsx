import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { Card, Screen, styles } from '../../components';
import { Icon, type IconName } from '../../icons';
import { COMUNAS } from '@pidohora/core/location';
import { useStore } from '../../store';
import { colors, radius } from '../../theme';
import { norm } from '@pidohora/core/utils';

/** Elegir desde dónde ver los lugares: ubicación actual, comuna donde vive o cualquier comuna. */
export function LocationScreen() {
  const { place, account, locate, setPlaceComuna, chooseHomePlace, setHomeComuna, back } = useStore();
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isClient = account?.role === 'client';
  const [saveAsHome, setSaveAsHome] = useState(isClient && !account?.homeComuna);

  const fromGps = async () => {
    setBusy(true);
    setError(null);
    const err = await locate();
    setBusy(false);
    if (err) setError(err);
    else back();
  };

  const pick = (name: string) => {
    if (isClient && saveAsHome) setHomeComuna(name);
    else setPlaceComuna(name);
    back();
  };

  const q = norm(query.trim());
  const list = COMUNAS.filter((c) => !q || norm(`${c.name} ${c.region}`).includes(q));
  const regions = [...new Set(list.map((c) => c.region))];

  return (
    <Screen title="¿Dónde quieres buscar?" subtitle="Te mostramos primero los lugares más cerca.">
      <Option
        icon="navigation"
        title={busy ? 'Buscando tu ubicación…' : 'Usar mi ubicación actual'}
        text="Ideal si andas fuera de casa"
        onPress={fromGps}
        selected={place?.source === 'gps'}
        right={busy ? <ActivityIndicator color={colors.primary} /> : undefined}
        disabled={busy}
      />
      {error ? (
        <View style={{ flexDirection: 'row', gap: 10, backgroundColor: colors.dangerSoft, borderRadius: 14, padding: 12 }} accessibilityRole="alert">
          <Icon name="alert" size={20} color={colors.danger} />
          <Text style={[styles.cardText, { color: colors.text, flex: 1 }]}>{error}</Text>
        </View>
      ) : null}
      {account?.homeComuna ? (
        <Option
          icon="homeHeart"
          title={`Donde vivo · ${account.homeComuna}`}
          text="Tu comuna guardada"
          onPress={() => {
            chooseHomePlace();
            back();
          }}
          selected={place?.source === 'home'}
        />
      ) : null}

      <Text style={[styles.section, { marginTop: 8 }]}>O elige una comuna</Text>
      {isClient ? (
        <Pressable
          onPress={() => setSaveAsHome(!saveAsHome)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: saveAsHome }}
          style={[styles.row, { gap: 10 }]}
        >
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 7,
              borderWidth: 2,
              borderColor: saveAsHome ? colors.primary : colors.border,
              backgroundColor: saveAsHome ? colors.primary : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {saveAsHome ? <Icon name="check" size={14} color={colors.onPrimary} strokeWidth={3} /> : null}
          </View>
          <Text style={styles.cardText}>Guardarla como la comuna donde vivo</Text>
        </Pressable>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: colors.card,
          borderWidth: 1.5,
          borderColor: colors.border,
          borderRadius: radius.md,
          paddingHorizontal: 16,
        }}
      >
        <Icon name="search" size={20} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Busca tu comuna"
          placeholderTextColor={colors.muted}
          nativeID="comuna-input"
          style={[{ flex: 1, paddingVertical: 13, fontSize: 16, color: colors.text }, { outlineStyle: 'none' } as object]}
        />
      </View>

      {list.length === 0 ? (
        <Text style={[styles.cardText, { textAlign: 'center', paddingVertical: 16 }]}>
          No encontramos esa comuna. Por ahora estamos en Santiago, Valparaíso, Rancagua y Concepción.
        </Text>
      ) : null}
      {regions.map((r) => (
        <View key={r} style={{ gap: 8 }}>
          <Text style={[styles.cardText, { fontWeight: '700' }]}>{r === 'Santiago' ? 'Región Metropolitana' : `Región de ${r}`}</Text>
          <Card style={{ paddingVertical: 4 }}>
            {list
              .filter((c) => c.region === r)
              .map((c, i) => {
                const on = place?.label === c.name && place.source !== 'gps';
                return (
                  <Pressable
                    key={c.name}
                    onPress={() => pick(c.name)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    style={[styles.rowBetween, { paddingVertical: 12 }, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}
                  >
                    <Text style={[styles.cardTitle, { fontWeight: on ? '800' : '500', color: on ? colors.primary : colors.text }]}>{c.name}</Text>
                    {on ? <Icon name="check" size={18} color={colors.primary} /> : null}
                  </Pressable>
                );
              })}
          </Card>
        </View>
      ))}
    </Screen>
  );
}

function Option({
  icon,
  title,
  text,
  onPress,
  selected,
  right,
  disabled,
}: {
  icon: IconName;
  title: string;
  text: string;
  onPress: () => void;
  selected?: boolean;
  right?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <Card onPress={disabled ? undefined : onPress} selected={selected}>
      <View style={styles.row}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardText}>{text}</Text>
        </View>
        {right ?? (selected ? <Icon name="check" size={20} color={colors.primary} /> : null)}
      </View>
    </Card>
  );
}
