# Saúde10 — App de Saúde e Bem-estar

Aplicativo móvel de saúde e bem-estar desenvolvido com React Native + Expo. Fornece ferramentas e rastreamento para hábitos saudáveis.

## Principais features
- Pomodoro e histórico de sessões
- Registro e acompanhamento de hidratação (Water tracker)
- Monitoramento de atividade e métricas (sensores / localização)
- Lembretes e notificações
- Registro de pressão arterial e outros logs de saúde
- Persistência local com Realm

## Tecnologias
- Expo (SDK) + expo-router
- React Native
- Banco de dados Realm (`@realm/react`)

## Pré-requisitos
- Node.js (recomenda-se v22+)
- npm
- Expo CLI (`npm install -g expo-cli`) — ou usar `npx expo` conforme preferência
- Para builds nativos/Android: JDK e Android Studio (SDK/Emulador)

## Instalação (desenvolvimento)
Clone o repositório e instale dependências:

```bash
git clone <repo-url>
cd projeto-sus-gerson
npm install
```

Inicie o Metro/Expo:

```bash
npm run start
```

Para rodar em Android (emulador ou dispositivo conectado):

```bash
npm run android
# ou
yarn android
```

Executar como web:

```bash
npm run web
# ou
yarn web
```

Scripts úteis (ver também [package.json](package.json))
- `start` — iniciar Expo
- `android` — executar no Android
- `web` — executar no navegador
- `lint` — rodar linter

## Notas Android e permissões
- Package id definido em [app.json](app.json) como `com.pedromartins.sus`.
- Permissões detectadas (p.ex.): `ACTIVITY_RECOGNITION`, `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION` — necessárias para tracking de atividade e localização.
- Existe a pasta `android/` com configurações nativas e arquivos Gradle para builds nativos.

Se precisar gerar uma build nativa, siga as instruções do Expo ou use `expo run:android` para builds locais.

## Troubleshooting
- Limpar cache do Expo:

```bash
expo start -c
```