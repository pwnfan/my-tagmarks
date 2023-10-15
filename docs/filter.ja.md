# TagMark フィルター

- [フィルターの種類を決定する方法](#フィルターの種類を決定する方法)
  - [アドバンストフィルター](#アドバンストフィルター)
  - [\>= フィルター](#-フィルター)
- [タグの快速入力](#タグの快速入力)
- [URL GET パラメータを介したフィルターの使用](#url-get-パラメータを介したフィルターの使用)
- [参考リンク](#参考リンク)

## フィルターの種類を決定する方法

### アドバンストフィルター

アドバンストフィルターは、Tabulator内のビルトインフィルターではニーズに満たせないことに対応するため、特別にカスタマイズされたフィルターです。

フィルター入力ボックスのヘルプテキスト（プレースホルダー）を確認して、「click here with CTRL/CMD pressed for help...」と表示されている場合、この列のフィルターはアドバンストフィルターであることがわかります。

以下のキーワード（演算子）がアドバンストフィルターで定義されています。

- `AND`：大文字でなければならず、「そして」操作を示し、Javascriptの`&&`論理演算子に似ています。
- `OR`：大文字でなければならず、「または」操作を示し、Javascriptの`||`論理演算子に似ています。
- `NOT`：大文字でなければならず、「非」操作を示し、Javascriptの`!`論理演算子に似ています。
- `(` および `)`：複数の式を結合し、その優先順位を制御するために使用されます。ほとんどのプログラミング言語と一致します。

**アドバンストフィルターで入力する文字列に引用符（`"`または`'`）は必要ありません。**

典型的な使用例：

`セキュリティ` (<u>security</u>, tag `sec`) の `偵察` (<u>reconnaissance</u>, tag `recon`) ツールをフィルタリングしたい場合、_**かつ**_ <u>Python</u>（tag `python`）_**または**_ <u>Golang</u>（tag `golang`）で実装されている場合、Tags列のフィルター入力ボックスに`sec AND recon AND (Python OR Golang)`を入力します。

それは、`tag` が大文字小文字を区別しないことを強調する必要があります。したがって、上記の例では、フィルターに `sec AND recon AND (python OR golang)` を入力することで同じ結果を得ることができます。

### >= フィルター

現在、アドバンストフィルターに加えて、tagmark-uiでは`>= フィルター`のみが利用可能です。このフィルター入力ボックスのヘルプテキスト（プレースホルダー）は`>=`です。例えば、「Github Info > Star」というカラムを取り上げると、入力ボックスに`500`を入力すると、`Star number >= 500`のURL（Github Repo）がフィルターされます。

## タグの快速入力

`Tags` カラムにタグの入力を支援する機能が追加されました。マウスで任意のタグを右クリックすると（左クリックでタグの定義を表示）、Tagsカラムのヘッダーフィルターの入力ボックスに自動的にタグが入力されます。

また、このクイック入力方法は`All Tags`オーバーレイにも有効です。

なお、クイックタグ入力は`Tags`カラムだけで有効であることに注意してください。他のカラム、特に`Github Info` > `Topics`カラムはこの機能と統合されていません。

## URL GET パラメータを介したフィルターの使用

tagmark-uiは、純粋なフロントエンドJavaScriptを介してフィルターの呼び出しを実装しました。したがって、前のフィルター例の結果は[https://your.site/tagmark/?tags=sec AND recon AND (Python OR Golang)](https://pwnfan.github.io/my-tagmarks/?tags=sec+AND+recon+AND+(Python+OR+Golang))（このリンクの実際のURLは私のブログ - pwnfan のタグマークページです）を介してアクセスできます。

この機能は、特定の指定されたタグを含むURLなど、他の人と特定のフィルターされたURLサブセットを簡単に共有するためのものです。

注意深い読者は、UI内の「Tags」という列名が大文字の頭文字であることに気づいたかもしれませんが、GETパラメータ内の「tags」は小文字です。その通りです、ここでは小文字で書かなければなりません。なぜなら、大文字の列名「Tags」はUI内の表示名であり、小文字の「tags」はJavascript内の変数名であるため、GETパラメータのキーを後者のように書く必要があるからです。

以下は、「UI列名」と「GETパラメータでフィルターによって呼び出される列名」との関連付けの関係です：

- `Title`: `title`
- `URL`: `url`
- `Tags`: `tags`
- `Github Info > Description`: `github_repo_info.description`
- `Github Info > Star`: `github_repo_info.count_star`
  - この列のフィルタータイプが `>= Filter` であることに注意してください。GETパラメーター `?github_repo_info.count_star=500` は、「star数 >= 500」を意味します。他の類似の列も同様です。
- `Github Info > Fork`: `github_repo_info.count_fork`
- `Github Info > Topics`: `github_repo_info.topics`
- `Github Info > Last Commit`: `github_repo_info.time_last_commit`
- `Github Info > Created`: `github_repo_info.time_created`
- `Github Info > Archived`: `github_repo_info.is_archived`
- `Date Added`: `time_added`
- `Comment`: `comment`

さらに、GETパラメータで複数のキーを使用することもできます。例えば[https://your.site/tagmark/?tags=sec AND recon AND (Python OR Golang)&github_repo_info.count_star=3000](https://pwnfan.github.io/my-tagmarks/?tags=sec+AND+recon+AND+(Python+OR+Golang)&github_repo_info.count_star=3000)（このリンクの実際のURLは私のブログ - pwnfan の tagmark ページです）は、元のタグフィルタ条件に加えて「Github Star 数 >= 3000」のフィルタ条件を追加します。

最後に、このGETパラメータのセキュリティに関して、人々は心配するかもしれません。なぜなら、バックエンドコードを使用せずに純粋なフロントエンドコードで実装されているからです。この純粋なフロントエンドで実装するための最も簡単な方法は、Javascriptを使用してGETパラメータを取得し、eval関数を呼び出してフィルタ関数を呼び出すことです。実際、これが私が最初に行ったことです。evalを使用すると反射型XSSが発生することを知っていますが、このセキュリティの問題を回避しながら、この純粋なフロントエンドのフィルタを実装する方法をずっと見つけることができませんでした。私はフロントエンド開発に上手くないので、良い解決策を見つけるのに長い時間がかかりました。今のところ、GETパラメータを介したこのような攻撃を回避することができるようです。もし私の実装にまだセキュリティ上の問題があると感じた場合は、お早めにお知らせください。ありがとうございます。

## 参考リンク

- Tabulator Document
  - [Custom Filter Functions](https://tabulator.info/docs/5.4/filter#func-builtin)
  - [Header Filtering](https://tabulator.info/docs/5.4/filter#header)