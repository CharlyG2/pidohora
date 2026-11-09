import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button, Card, Field, LinkText, Screen, styles } from '../../components';
import { useStore } from '../../store';

export function LoginScreen() {
  const { login, go } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = (e = email) => setError(login(e));

  return (
    <Screen title="Iniciar sesión" subtitle="Clientes y negocios entran por aquí.">
      <Field
        label="Correo"
        value={email}
        onChangeText={setEmail}
        placeholder="tucorreo@ejemplo.cl"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        nativeID="login-email"
      />
      <Field
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
        onSubmitEditing={() => submit()}
        nativeID="login-password"
      />
      <Text style={styles.cardText}>
        Versión de prueba: no guardamos ni revisamos contraseñas. No uses la contraseña real de tu correo.
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button label="Entrar" onPress={() => submit()} disabled={!email || !password} />
      <View style={[styles.row, { justifyContent: 'center' }]}>
        <Text style={styles.cardText}>¿No tienes cuenta?</Text>
        <LinkText label="Crear cuenta" onPress={() => go({ name: 'register', role: 'client' })} />
      </View>

      <Card style={{ marginTop: 16, gap: 10 }}>
        <Text style={styles.cardTitle}>Cuentas de prueba</Text>
        <Text style={styles.cardText}>Para recorrer el prototipo sin registrarte:</Text>
        <Button label="Entrar como negocio (Barbería El Corte)" variant="secondary" onPress={() => submit('negocio@pidohora.cl')} />
        <Button label="Entrar como cliente (Camila)" variant="secondary" onPress={() => submit('cliente@pidohora.cl')} />
      </Card>
    </Screen>
  );
}
