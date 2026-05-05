# BasePod scripts/

TestFlight リリースの自動化ワンショット。Capacitor 8 + Next.js 16 static export → Xcode archive → App Store Connect upload を 1 コマンドで実行する。

## release.sh

### 使い方

```bash
# フル実行 (Web build → cap sync → archive → upload)
bash scripts/release.sh

# Web build スキップ (直前ビルドを流用して native だけ再アップロード)
SKIP_WEB_BUILD=1 bash scripts/release.sh

# Sim 検証スキップ (非推奨 / 緊急時のみ)
SKIP_C6_SIM=1 bash scripts/release.sh

# Sim デバイス変更 (デフォルト: iPhone 16 Pro)
SIM_DEVICE="iPhone 15" bash scripts/release.sh
```

### フロー (9 ステップ)

| # | フェーズ | 内容 |
|---|---|---|
| 1 | Web | `pnpm build` → `out/` static export |
| 2 | Web | `npx cap sync ios` → `ios/App/App/public/` |
| 3 | Native | `project.pbxproj` の `CURRENT_PROJECT_VERSION` を +1 |
| 4 | Native | Info.plist `CFBundleVersion` 同期 (xcvar 展開後の保険) |
| 5 | C6 Sim | Sim build + `ios_app_validator.sh --app` (plist レイヤー診断) |
| 6 | Native | `xcodebuild archive` (Cloud signing) |
| 7 | Native | `xcodebuild -exportArchive` (.ipa) |
| 8 | Validate | `ios_app_validator.sh --ipa` (HR-13 配信前検証) |
| 9 | Upload | `xcrun altool --upload-app` |

ステップ 5 / 8 のどちらかが FAIL (exit ≥ 2) すると以降は中止する。

## 初回セットアップ

### 1. App Store Connect で App 登録

1. App ID: `jp.base393.BasePod` を Apple Developer Identifiers で登録
2. App Store Connect で App `BasePod` を作成
3. ユーザーとアクセス → 統合 で API Key 発行 (役割 Admin or App Manager)
4. 発行された `.p8` を以下に配置:
   ```bash
   mkdir -p ~/.appstoreconnect/private_keys
   mv ~/Downloads/AuthKey_XXXXXXXXXX.p8 ~/.appstoreconnect/private_keys/
   chmod 600 ~/.appstoreconnect/private_keys/AuthKey_XXXXXXXXXX.p8
   ```

### 2. release.env 作成

```bash
cp scripts/release.env.example scripts/release.env
chmod 600 scripts/release.env
# release.env を編集して値を埋める:
#   API_KEY_ID=XXXXXXXXXX        ← .p8 ファイル名の中央 10 文字
#   API_KEY_ISSUER=xxxxxxxx-...  ← App Store Connect 統合ページの Issuer ID
```

`release.env` は `.gitignore` 対象。コミットされない。

### 3. ExportOptions plist の Team ID 確認

`Configuration/ExportOptions-iOS.plist` の `teamID` が自分の Team ID (`FLVVA4CT6P`) になっているか確認。違う場合は手で書き換える。

### 4. (初回のみ) signing 確認

```bash
# Xcode で 1 回開いて signing が通ることを確認
open ios/App/App.xcodeproj
```

`Signing & Capabilities` で Team を選択し Automatic signing が緑になればOK。

## 必要環境

- macOS + Xcode (CLI)
- pnpm 10 系 + Node 22 系 (`.tool-versions` 参照)
- Capacitor 8 (`npx cap` が動くこと)
- `~/.appstoreconnect/private_keys/AuthKey_<ID>.p8`
- `04_tools/ios_app_validator.sh` (HR-13、母艦 `_Claude/04_tools/` から自動参照)

## セキュリティ

- `release.env` は `chmod 600` 推奨。`.gitignore` 対象
- altool は env 経由でも secret を渡している (HR-14 process listing 漏洩防止の二重構え)
- `.p8` は `~/.appstoreconnect/private_keys/` 以外に置かない (altool の標準探索パス)
- API Key の役割は最小権限 (App Manager) で運用可能

## トラブルシュート

| 症状 | 対応 |
|---|---|
| `API_KEY_ID と API_KEY_ISSUER が未設定` | `scripts/release.env` を作成して値を埋める |
| `API key file not found` | `~/.appstoreconnect/private_keys/AuthKey_<ID>.p8` の配置と権限を確認 |
| Sim build FAILED | Xcode で App.xcodeproj を開き signing と Capacitor SPM 解決を確認 |
| `pre-archive validator FAIL` | Info.plist の `UILaunchScreen` 等の必須キー欠落、validator の出力を読む |
| `HR-13 validator FAIL` | ipa 内 plist を確認、`UILaunchScreen` 注入が必要なら Info.plist に追加 |
| altool 401 / Invalid Issuer | `release.env` の Issuer ID と .p8 の Key ID の組み合わせを再確認 |
