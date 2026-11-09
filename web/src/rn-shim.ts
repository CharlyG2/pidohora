// Reemplazo mínimo de 'react-native' para la página web.
export type ViewStyle = Record<string, unknown>;
export const Platform = {
  OS: 'web',
  select<T>(o: { web?: T; default?: T }): T | undefined {
    return o.web ?? o.default;
  },
};
