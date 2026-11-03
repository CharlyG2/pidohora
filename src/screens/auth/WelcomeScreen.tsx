import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Logo, styles } from '../../components';
import { useStore } from '../../store';
import { colors, radius } from '../../theme';

export function WelcomeScreen() {
  const { go, continueAsGuest } = useStore();
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 16 }}>
        <View style={{ width: '100%', maxWidth: 440, alignSelf: 'center', gap: 14 }}>
          <View style={{ alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <View
              style={{
                width: 84,
                height: 84,
                borderRadius: 24,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 42 }}>🗓️</Text>
            </View>
            <Logo size={36} />
            <Text style={[styles.cardText, { textAlign: 'center', fontSize: 16 }]}>
              Pide hora en barberías, salones, centros de estética, salud y más. Sin llamar, sin esperar respuesta.
            </Text>
          </View>

          <Button label="Crear cuenta" onPress={() => go({ name: 'register', role: 'client' })} />
          <Button label="Iniciar sesión" variant="secondary" onPress={() => go({ name: 'login' })} />
          <Button label="Seguir como invitado" variant="ghost" onPress={continueAsGuest} />

          <View
            style={{
              marginTop: 18,
              padding: 16,
              borderRadius: radius.lg,
              backgroundColor: colors.card,
              borderWidth: 1.5,
              borderColor: colors.border,
              gap: 8,
            }}
          >
            <Text style={styles.cardTitle}>¿Tienes un negocio?</Text>
            <Text style={styles.cardText}>
              Recibe reservas 24/7, recordatorios por WhatsApp y cobros con tarjeta. Desde $5.990 al mes.
            </Text>
            <Button label="Registrar mi negocio" variant="secondary" onPress={() => go({ name: 'register', role: 'business' })} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
