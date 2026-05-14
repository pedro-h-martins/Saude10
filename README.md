# Saúde10 — App de Saúde e Bem-estar

Aplicativo móvel de saúde e bem-estar desenvolvido com React Native + Expo. Fornece ferramentas e rastreamento para hábitos saudáveis.

## Principais features
- Autenticação e gerenciamento de usuários (Firebase Auth)
- Sincronização online-first com Firebase (Firestore) e fallback/local queue em Realm
- Acompanhamento de metas e hábitos (criação/edição/remoção)
- Registro de hidratação (Water tracker) com lembretes
- Registro de sintomas, pressão arterial e outros logs de saúde
- Upload e gerenciamento de fotos de progresso
- Widgets integrados: Pomodoro, Monitor de água, Wellness rating
- Lembretes e notificações locais

## Tecnologias
- Expo + React Native + `expo-router`
- TypeScript
- Firebase (Auth, Firestore) — via `@react-native-firebase/*` e `firebase` quando aplicável
- Realm (`@realm/react`) para persistência local e fila de sincronização

## Pré-requisitos
- Node.js (recomenda-se v22+)
- npm
- Expo CLI (usar via `npx expo` ou instalar globalmente)
- Android Studio + Android SDK + JDK para builds Android (Windows: configurar `ANDROID_HOME` / `ANDROID_SDK_ROOT`)
- Conta Firebase configurada e `android/app/google-services.json` presente no repositório para builds Android nativos

## Instalação (desenvolvimento)
Clone o repositório e instale dependências:

```bash
git clone <repo-url>
cd Saude10
npm install
```
Se for usar Firebase nativo no Android, confirme que `android/app/google-services.json` está presente (forneça-o a partir do console Firebase ou do repositório privado da equipe).

Inicie o Metro/Expo em modo desenvolvimento:

```bash
npm run start
```

Comandos úteis (conferir `package.json`):

```bash
npm run android    # expo run:android — build/instala no emulador ou dispositivo
npm run ios        # expo run:ios (macOS)
npm run web        # rodar no navegador
npm run lint       # rodar linter
npm run reset-project  # script local de reset (use com cuidado)
```

Observações:
- O projeto adota política online-first: a camada de sincronização tenta gravar no Firebase e, em caso de falha, persiste localmente em Realm para posterior sincronização.
- Para limpar cache do Expo, use `expo start -c`.

Scripts e comandos adicionais podem ser verificados em [package.json](package.json).

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