import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button, Chip, Field, Screen, Segmented, styles } from '../../components';
import { categories, type CategoryId } from '../../data';
import { findComuna } from '../../location';
import { useStore } from '../../store';
import { isValidChileanPhone, isValidEmail } from '../../utils';

const POPULAR_COMUNAS = ['Santiago Centro', 'Providencia', 'Las Condes', 'Ñuñoa', 'La Florida', 'Maipú', 'Puente Alto', 'Viña del Mar'];

export function RegisterScreen({ role: initialRole }: { role: 'client' | 'business' }) {
  const { register } = useStore();
  const [role, setRole] = useState(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+56 9 ');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [comuna, setComuna] = useState('');
  const [address, setAddress] = useState('');
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBiz = role === 'business';
  const errors = {
    name: name.trim().length < 2 ? 'Escribe tu nombre.' : null,
    email: !isValidEmail(email) ? 'Revisa el correo.' : null,
    phone: !isValidChileanPhone(phone) ? 'Debe ser un celular chileno, ej: +56 9 1234 5678.' : null,
    password: password.length < 4 ? 'Usa al menos 4 caracteres.' : null,
    comuna: isBiz && comuna.trim() && !findComuna(comuna) ? 'No reconocemos esa comuna. Revisa cómo está escrita.' : null,
    businessName: isBiz && businessName.trim().length < 2 ? 'Escribe el nombre de tu negocio.' : null,
    category: isBiz && !category ? 'Elige un rubro.' : null,
  };
  const show = (k: keyof typeof errors) => (touched ? errors[k] : null);

  const submit = () => {
    setTouched(true);
    if (Object.values(errors).some(Boolean)) return;
    setError(
      register({
        role,
        name,
        email,
        phone,
        password,
        businessName,
        category: category ?? undefined,
        comuna,
        address,
      }),
    );
  };

  return (
    <Screen
      title="Crear cuenta"
      footer={<Button label={isBiz ? 'Crear mi negocio' : 'Crear cuenta'} onPress={submit} />}
    >
      <Segmented
        options={[
          { id: 'client', label: 'Quiero reservar' },
          { id: 'business', label: 'Tengo un negocio' },
        ]}
        value={role}
        onChange={setRole}
      />

      {isBiz ? (
        <>
          <Text style={styles.cardText}>Tu negocio queda publicado en PidoHora y empiezas con 3 meses gratis.</Text>
          <Field label="Nombre del negocio" value={businessName} onChangeText={setBusinessName} placeholder="Ej: Barbería Don Pepe" error={show('businessName')} nativeID="reg-business" />
          <View>
            <Text style={styles.label}>Rubro</Text>
            <View style={styles.wrap}>
              {categories.map((c) => (
                <Chip key={c.id} small label={`${c.emoji} ${c.label}`} selected={category === c.id} onPress={() => setCategory(c.id)} />
              ))}
            </View>
            {show('category') ? <Text style={styles.error}>{show('category')}</Text> : null}
          </View>
          <Field label="Comuna" value={comuna} onChangeText={setComuna} placeholder="Ej: Providencia" error={show('comuna')} hint="Así te encuentran los clientes que están cerca." nativeID="reg-comuna" />
          <Field label="Dirección" value={address} onChangeText={setAddress} placeholder="Ej: Av. Providencia 1234" nativeID="reg-address" />
          <Text style={[styles.section, { marginTop: 8 }]}>Tus datos</Text>
        </>
      ) : null}

      <Field label="Nombre" value={name} onChangeText={setName} placeholder="Ej: Camila González" autoComplete="name" error={show('name')} nativeID="reg-name" />
      <Field label="Correo" value={email} onChangeText={setEmail} placeholder="tucorreo@ejemplo.cl" keyboardType="email-address" autoCapitalize="none" error={show('email')} nativeID="reg-email" />
      <Field label="WhatsApp" value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={show('phone')} hint="Aquí llegan las confirmaciones y recordatorios." nativeID="reg-phone" />
      <Field label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry error={show('password')} hint="Versión de prueba: no la guardamos. No uses tu contraseña real." nativeID="reg-password" />
      {!isBiz ? (
        <View style={{ gap: 6 }}>
          <Text style={styles.label}>¿En qué comuna vives? (opcional)</Text>
          <View style={styles.wrap}>
            {POPULAR_COMUNAS.map((c) => (
              <Chip key={c} small label={c} selected={comuna === c} onPress={() => setComuna(comuna === c ? '' : c)} />
            ))}
          </View>
          <Text style={styles.hint}>Así te mostramos primero los lugares cerca de tu casa. Puedes cambiarla después.</Text>
        </View>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}
