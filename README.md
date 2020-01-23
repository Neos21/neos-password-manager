# NPM : Neo's Password Manager : @neos21/npm

[![NPM Version](https://img.shields.io/npm/v/@neos21/npm.svg)](https://www.npmjs.com/package/@neos21/npm)

ID やパスワードなどの情報を JSON ファイルに保存し、アカウント情報を管理できるコマンドです。

- JSON ファイルはユーザホームディレクトリ直下に `neos-password-manager-db.json` というファイル名で生成します
- パスワード情報は環境変数 `NEOS_MASTER_PASS` で設定したマスターパスワードを用いて暗号化して保存します
- 参照時は環境変数 `NEOS_MASTER_PASS` で設定したマスターパスワードを用いて復号してコンソール出力します

**N**eo's **P**assword **M**anager の略で <code>@neos21/<strong>npm</strong></code> というパッケージ名にしましたが、コマンド名は __`np`__ です。


## インストール方法

インストールするには Node.js・npm 環境が必要です。

```sh
# npm でグローバルインストールします
$ npm install --global @neos21/npm

# パスワードを暗号化・復号するためのマスターパスワードを設定します
$ export NEOS_MASTER_PASS=my_master_password

# np コマンドが使用できるようになります (サブコマンド未指定の場合、ヘルプが表示されます)
$ np

# 明示的にヘルプを表示します
$ np --help

# バージョン情報を確認できます
$ np --version
```

- 環境変数 `NEOS_MASTER_PASS` を設定しないとコマンド自体が動作しないので注意


## 使い方


### `np add` : アカウント情報の追加 or 削除

```sh
# ロングオプション
$ np add facebook --id my_user --pass my_password --mail me@example.com --url 'https://facebook.com/my_user' --text 備考

# エイリアス・同サービスに別アカウントの情報を登録
$ np a facebook --id second_user --pass my_password

# ショートオプション
$ np add instagram -i 'my_user' -p 'my_password' -m 'me@example.com' -u 'https://instagram.com/my_user' -t '備考'

# このコマンドのヘルプを表示します
$ np add --help
```

`np add` 以降に、項目別に以下の情報を指定して保存できます。

- `サービス名` : アカウント情報の登録先サービス名。この項目は必須です
- `--id`・`-i` : ID (ユーザ ID など)。この項目は必須です
- `--pass`・`-p` : パスワード。この項目は暗号化して保存されます
- `--mail`・`-m` : E-mail。アカウント登録に用いたメールアドレスなどを保存できます
- `--url`・`-u` : URL。登録したサイトの URL などを保存できます
- `--text`・`-t` : 備考。任意のテキストを残せます

初回のコマンド実行時など、ユーザホームディレクトリ配下に JSON ファイルが存在しない場合は自動作成します。

サービス名と ID、もしくは、サービス名と E-mail が合致するデータが既に存在する場合、そのデータに他の項目の情報を上書き保存します。

上述のコマンドを実行すると、ユーザホームディレクトリ直下の JSON ファイルに以下のように情報が記録されます。

```json
{
  "facebook": [
    {
      "id": "my_user",
      "pass": "U2FsdGVkX1/C3EDO1MrOLpaWBKnOw1bDeEwR5JGw/IQ=",
      "mail": "me@example.com",
      "url": "https://facebook.com/my_user",
      "text": "備考",
      "updatedAt": "2018-12-12T02:23:08.881Z",
      "createdAt": "2018-12-12T02:23:08.881Z"
    },
    {
      "id": "second_user",
      "pass": "U2FsdGVkX19DKWBMkL4PhRVccAE5/eA86VgcbYh7XUI=",
      "updatedAt": "2018-12-12T02:35:40.275Z",
      "createdAt": "2018-12-12T02:35:40.275Z"
    }
  ],
  "instagram": [
    {
      "id": "my_user",
      "pass": "U2FsdGVkX1+u5HIuY7RovDSQzPUG8g10dI0ebAdNqeI=",
      "mail": "me@example.com",
      "url": "https://instagram.com/my_user",
      "text": "備考",
      "updatedAt": "2018-12-12T02:23:34.467Z",
      "createdAt": "2018-12-12T02:23:34.467Z"
    }
  ]
}
```

- `createdAt`・`updatedAt` 項目は自動的に追記・更新します


### `np get` : 登録データの検索・表示

```sh
# サービス名・ID・パスワード・E-mail・URL・Text を対象に部分一致検索
$ np get instagram

# エイリアス・対象の項目を指定して部分一致検索
$ np g --id my_user

# このコマンドのヘルプを表示します
$ np get --help
```

`np get` に指定できるオプションは以下のとおりです。いずれも大文字・小文字を区別せず部分一致検索します。

- `--id`・`-i` : ID
- `--pass`・`-p` : パスワード
- `--mail`・`-m` : E-mail
- `--url`・`-u` : URL
- `--text`・`-t` : 備考

上述の2つのコマンドで得られる結果例は以下のとおりです。

```sh
$ np get instagram
1 件ヒットしました

Service Name | ID      | Password    | E-Mail         | URL                           | Text
------------ | --      | --------    | ------         | ---                           | ----
instagram    | my_user | my_password | me@example.com | https://instagram.com/my_user | 備考

$ np g --id my_user
2 件ヒットしました

Service Name | ID      | Password    | E-Mail         | URL                           | Text
------------ | --      | --------    | ------         | ---                           | ----
faceook      | my_user | my_password | me@example.com | https://facebook.com/my_user  | 備考
instagram    | my_user | my_password | me@example.com | https://instagram.com/my_user | 備考
```

パスワードは環境変数 `NEOS_MASTER_PASS` の文字列を使用して復号するため、データ保存時と異なるマスターパスワードを指定していると、パスワード文字列の復号に失敗します。

```sh
# データ保存時と異なるマスターパスワードを設定する
$ export NEOS_MASTER_PASS=my_another_password

# コマンドを実行するとパスワード欄は「(復号に失敗)」と表示される
$ np get instagram
1 件ヒットしました

Service Name | ID      | Password     | E-Mail         | URL                           | Text
------------ | --      | --------     | ------         | ---                           | ----
instagram    | my_user | (復号に失敗) | me@example.com | https://instagram.com/my_user | 備考
```


### `np get-all` : 全データを表示

```sh
$ np get-all

# エイリアス
$ np l
```

JSON ファイルの全ての情報を表示します。

上述のコマンドで得られる結果例は以下のとおりです。

```sh
$ np get-all
全 3 件

Service Name | ID          | Password    | E-Mail         | URL                           | Text
------------ | --          | --------    | ------         | ---                           | ----
facebook     | my_user     | my_password | me@example.com | https://facebook.com/my_user  | 備考
facebook     | second_user | my_password |                |                               |
instagram    | my_user     | my_password | me@example.com | https://instagram.com/my_user | 備考
```


### `np rm` : データの削除

指定のサービス名と ID、もしくは、サービス名と E-mail に合致するデータを JSON ファイルから削除します。

```sh
# サービス名と ID を指定
$ np rm facebook --id my_user

# エイリアス・サービス名と E-mail を指定
$ np r facebook --mail me@example.com

# ショートオプション・サービス名と ID、E-mail を両方指定
$ np rm facebook -i 'my_user' -m 'me@example.com'

# このコマンドのヘルプを表示します
$ np rm --help
```

`np rm` に指定できるオプションは以下のとおりです。

- `--id`・`-i` : ID
- `--mail`・`-m` : E-mail

コマンドの実行例は以下のとおりです。

```sh
$ np rm facebook --id my_user
1 件削除しました
```

コマンド実行後の JSON ファイルの内容は以下のようになります。

```json
{
  "facebook": [
    {
      "id": "second_user",
      "pass": "U2FsdGVkX19DKWBMkL4PhRVccAE5/eA86VgcbYh7XUI=",
      "updatedAt": "2018-12-12T02:35:40.275Z",
      "createdAt": "2018-12-12T02:35:40.275Z"
    }
  ],
  "instagram": [
    {
      "id": "my_user",
      "pass": "U2FsdGVkX1+u5HIuY7RovDSQzPUG8g10dI0ebAdNqeI=",
      "mail": "me@example.com",
      "url": "https://instagram.com/my_user",
      "text": "備考",
      "updatedAt": "2018-12-12T02:23:34.467Z",
      "createdAt": "2018-12-12T02:23:34.467Z"
    }
  ]
}
```


## Author

[Neo](http://neo.s21.xrea.com/)

- [GitHub - neos-password-manager](https://github.com/Neos21/neos-password-manager)
- [npm - @neos21/npm](https://www.npmjs.com/package/@neos21/npm)


## Links

- [Neo's World](http://neo.s21.xrea.com/)
- [Corredor](http://neos21.hatenablog.com/)
- [Murga](http://neos21.hatenablog.jp/)
- [El Mylar](http://neos21.hateblo.jp/)
- [Neo's GitHub Pages](https://neos21.github.io/)
- [GitHub - Neos21](https://github.com/Neos21/)
