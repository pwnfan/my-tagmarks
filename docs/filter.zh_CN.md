# TagMark Filters

- [如何确定 Filter 类型](#如何确定-filter-类型)
  - [Advanced Filter](#advanced-filter)
  - [\>= Filter](#-filter)
- [辅助输入 tag](#辅助输入-tag)
- [通过 URL GET 参数使用 filter](#通过-url-get-参数使用-filter)
- [参考链接](#参考链接)

## 如何确定 Filter 类型

### Advanced Filter

Advanced Filter 是我们针对 tags 搜索的需求定制的 Filter，因为 Tabulator 中内置的 Filter 无法满足我们的需求。

判断哪些列的 Filter 属于 Advanced Filter，只需确认 Filter 输入框的帮助文字(placeholder)是
`click here with CTRL/CMD pressed for help...`，则该列的 Filter 即为 Advanced Filter.

Advanced Filter 中定义了如下的关键字（运算符）:

- `AND`: 必须大写，表示 "与" 运算，它类似于Javascript 中的 `&&` 逻辑运算符。
- `OR`: 必须大写，表示 "或" 运算，它类似于Javascript 中的 `||` 逻辑运算符。
- `NOT`: 必须大写，表示 "非" 运算，它类似于Javascript 中的 `!` 逻辑运算符。
- `(` 和 `)`: 用来组合多个表达式，并控制它们的优先级。它的用法与大多数编程语言中的用法一致。

**Advanced Filter 中输入的字符串不需要使用 `"` 或者 `'` 括起来。**

下面给出一个典型的使用示例：

如果我想过滤`网络安全`(<u>security</u>, tag `sec`)中的的`信息侦查`(<u>reconnaissance</u>, tag `recon`) 工具, _**而且**_ 它必须由 <u>Python</u> (tag `python`) _**或者**_ <u>Golang</u> (tag `golang`) 实现，则在 Tags 列的过滤输入框中输入 `sec AND recon AND (Python OR Golang)` 即可。

需要强调一下的是，`tag` 是大小写不敏感的。因此上例中在过滤器中输入`sec AND recon AND (python OR golang)` 可以得到同样的结果。

### >= Filter

目前除了 Advanced Filter，只有 `>= Filter`。这种 Filter 的输入框的帮助文字(placeholder)是 `>=`。顾名思义，以 `Github Info > Star` 列为例，如果在输入框中输入 `500`，即筛选出所有 `Star数 >= 500` 的 (Github Repo) URL。

## 辅助输入 tag

在 `Tags` 列加入了辅助输入 tag 功能，当用鼠标右键单击任何一个 tag 时（鼠标左键单击是显示 tag 的含义），会将此 tag 自动输入到 Tags 列的 header filter 的 input 输入框中。

另外，在 `All Tags` 浮层页面，这种辅助输入 tag 的方式同样有效：

需要特别指出到是，这种辅助输入到方式仅对 `Tags` 列有效，其他列无效，尤其是 `Github Info` > `Topics` 列也未添加此功能。

## 通过 URL GET 参数使用 filter

tagmark-ui 通过纯前端 Javascript 实现了 通过GET参数对filter的调用。因此，之前的过滤器示例可以通过 [https://your.site/tagmark/?tags=sec AND recon AND (Python OR Golang)](https://pwnfan.github.io/my-tagmarks/?tags=sec+AND+recon+AND+(Python+OR+Golang)) (此链接的真实URL是我的 blog 中的 tagmark 页面 - pwnfan)

这个功能是为了便于和他人分享特定经过过滤后的 URL 子集使用的，比如包含某些指定标签的 URL。

仔细的你可能会发现上面的列子中，`UI 中的列名 Tags` 是首字母大写的，而 `GET 参数中的 tags` 是小写的，没错，这里必须写成小写，否则过滤器不会生效。因为大写的列名 `Tags` 是 UI 中的显示名称，而 小写的 `tags` 是 Javascript 中的变量名称，GET 参数中的 key 需要写成后者出才能正常调用。

这里给出 `UI 中的列名` 和 `GET参数中调用Filter的列名` 的映射关系：

- `Title`: `title`
- `URL`: `url`
- `Tags`: `tags`
- `Github Info > Description`: `github_repo_info.description`
- `Github Info > Star`: `github_repo_info.count_star`
  - 这里需要注意 GET参数 `?github_repo_info.count_star=500` 表示的是 `star数 >= 500`，因为此列的 Filter 类型是 `>= Filter`。其他类似的列也一样。
- `Github Info > Fork`: `github_repo_info.count_fork`
- `Github Info > Topics`: `github_repo_info.topics`
- `Github Info > Last Commit`: `github_repo_info.time_last_commit`
- `Github Info > Created`: `github_repo_info.time_created`
- `Github Info > Archived`: `github_repo_info.is_archived`
- `Date Added`: `time_added`
- `Comment`: `comment`

另外补充一下，GET参数里多个 key 也是允许的，比如 [https://your.site/tagmark/?tags=sec AND recon AND (Python OR Golang)&github_repo_info.count_star=3000](https://pwnfan.github.io/my-tagmarks/?tags=sec+AND+recon+AND+(Python+OR+Golang)&github_repo_info.count_star=3000) (此链接的真实URL是我的 blog 中的 tagmark 页面 - pwnfan)，这在之前的 tags 过滤条件的基础上，又加了一个 `Github 的 Star数 >= 3000` 的过滤条件。

最后，可能会有人担心这种 GET 参数的安全性，因为它没有使用后端代码而是通过纯前端代码实现的，一般最容易想到的纯前端实现方法就是使用Javascript 获取到 GET 参数，然后调用 eval 函数调用过滤函数进行过滤。确实我一开始也是这么做的，我知道使用 eval 会引入反射型 XSS，但是很久都无法找到既能规避这个安全问题又能实现这个纯前端 Filter 的方法。我对前端开发不是很熟，所以之后又花了很久才找到好的解决方法，现在好像已经可以规避这类通过 GET 参数传入恶意 Javascript 代码的攻击。如果你发现我的实现方式仍然存在安全问题，请及时告知我，非常感谢。

## 参考链接

- Tabulator Document
  - [Custom Filter Functions](https://tabulator.info/docs/5.4/filter#func-builtin)
  - [Header Filtering](https://tabulator.info/docs/5.4/filter#header)
