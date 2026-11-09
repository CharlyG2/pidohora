import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';

import { Badge, Button, Logo, styles } from '../../components';
import { Icon } from '../../icons';
import { useStore } from '../../store';
import { colors, radius, shadow } from '../../theme';

export function WelcomeScreen() {
  const { go, continueAsGuest } = useStore();
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 16 }}>
        <View style={{ width: '100%', maxWidth: 440, alignSelf: 'center', gap: 14 }}>
          <View style={{ alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <LinearGradient
              colors={['#EEEBFF', '#DDF8F0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: '100%', maxWidth: 320, height: 210, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}
            >
              <View style={{ backgroundColor: colors.card, borderRadius: 18, paddingHorizontal: 18, paddingVertical: 14, gap: 6, ...shadow.float }}>
                <View style={[styles.row, { gap: 8 }]}>
                  <Icon name="calendar" size={18} color={colors.primary} />
                  <Text style={styles.cardTitle}>Mañana, 10:30</Text>
                </View>
                <Text style={styles.cardText}>Corte + barba · con Matías</Text>
                <Badge label="Confirmada por WhatsApp" tone="success" />
              </View>
            </LinearGradient>
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
              backgroundColor: colors.mintSoft,
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
