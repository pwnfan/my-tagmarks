# TagMark Filters

- [TagMark Filters](#tagmark-filters)
  - [How to Determine Filter Type](#how-to-determine-filter-type)
    - [Advanced Filter](#advanced-filter)
    - [\>= Filter](#-filter)
  - [Quick Tag Inputting](#quick-tag-inputting)
  - [Using Filters Through URL GET Parameters](#using-filters-through-url-get-parameters)
  - [Reference Links](#reference-links)

## How to Determine Filter Type

### Advanced Filter

Advanced Filter is a specially customized filter to replace the built-in filters in Tabulator which can not meet our needs.

To determine if a columns is an Advanced Filter, just confirm that the help text (placeholder) of the filter input box, if it is "click here with CTRL/CMD pressed for help...", then the filter of this column is an Advanced Filter.

The following keywords (operators) are defined in Advanced Filter:

- `AND`: Must be uppercase, indicating "and" operation, similar to the `&&` logical operator in Javascript.
- `OR`: Must be uppercase, indicating "or" operation, similar to the `||` logical operator in Javascript.
- `NOT`: Must be uppercase, indicating "not" operation, similar to the `!` logical operator in Javascript.
- `(` and `)`: Used to combine multiple expressions and control their priority, what is consistent with most programming languages.

**No quotation marks (`"` or `'`) are required in the string entered in Advanced Filter.**

Here is a typical usage example:

If I want to filter out the <u>reconnaissance</u> (tag `recon`) tools in <u>security</u> (tag `sec`), _**and**_ it must be implemented in <u>Python</u> (tag `python`) _**or**_ <u>Golang</u> (tag `golang`), then I should enter `sec AND recon AND (Python OR Golang)` in the filter input box of the Tags column.

It should be emphasized that `tag` are case-insensitive. Therefore, in the example above, entering `sec AND recon AND (python OR golang)` in the filter can get the same results.

### >= Filter

Currently, in addition to Advanced Filter, there is only `>= Filter` in tagmark-ui. The help text (placeholder) of this filter input box is `>=`. For example, taking the column `Github Info > Star` as an example, if you enter `500` in the input box, all URLs (which is a Github Repo) with `Star number >= 500` will be filtered out.

## Quick Tag Inputting

A feature of assisting inputting tags has been added to the `Tags` column. When you right-click any tag with the mouse(left-click will display the  definition of the tag), it will automatically enter the tag into the input box of the header filter of the Tags column.

In addition, this quick inputting method is also effective on the `All Tags` overlay.

It should be noted that quick tag inputting is only available in the `Tags` column, other columns, especially the `Github Info` > `Topics` column has not be integrated with this feature so far.

## Using Filters Through URL GET Parameters

tagmark-ui has implemented the invocation of filters through pure frontend Javascript. Therefore, the result of the previous filter examples can be accessed through [https://your.site/tagmark/?tags=sec AND recon AND (Python OR Golang)](https://pwnfan.github.io/tagmark/?tags=sec%20AND%20recon%20AND%20(Python%20OR%20Golang)) (the real URL of this link is my tagmark page in my blog - pwnfan).

This feature is for easy sharing of specific filtered URL subsets with others, such as URLs containing certain specified tags.

Careful readers may have noticed that the column name "Tags" in the UI is capitalized, while the "tags" in the GET parameters is lowercase. Yes, it must be written in lowercase here, otherwise the filter will not work. Because the capitalized column name "Tags" is the display name in the UI, and the lowercase "tags" is the variable name in Javascript, the key in the GET parameter needs to be written as the latter to be able to call normally.

Here is the mapping relationship between the "UI column name" and the "column name called by Filter in GET parameter":

- `Title`: `title`
- `URL`: `url`
- `Tags`: `tags`
- `Github Info > Description`: `github_repo_info.description`
- `Github Info > Star`: `github_repo_info.count_star`
  - Note that the GET parameter `?github_repo_info.count_star=500` means `star number >= 500`, because the Filter type of this column is `>= Filter`. Other similar columns are the same.
- `Github Info > Fork`: `github_repo_info.count_fork`
- `Github Info > Topics`: `github_repo_info.topics`
- `Github Info > Last Commit`: `github_repo_info.time_last_commit`
- `Github Info > Created`: `github_repo_info.time_created`
- `Github Info > Archived`: `github_repo_info.is_archived`
- `Date Added`: `time_added`
- `Comment`: `comment`

In addition, multiple keys in GET parameters are also allowed, such as [https://your.site/tagmark/?tags=sec AND recon AND (Python OR Golang)&github_repo_info.count_star=3000](https://pwnfan.github.io/tagmark/?tags=sec%20AND%20recon%20AND%20(Python%20OR%20Golang)&github_repo_info.count_star=3000) (the real URL of this link is my tagmark page in my blog - pwnfan), which adds an additional filter condition of "Github Star number >= 3000" on the basis of the original filter condition for tags.

At last, some people may worry about the security of this GET parameter, because it is implemented by pure frontend code without using back-end code. The easiest way to implement it in a pure frontend way is to use Javascript to get the GET parameters and then call the eval function to call the filter function for filtering. Indeed, this is what I did at first. I know that using eval will introduce reflected XSS, but I couldn't find a way to both avoid this security issue and implement this pure frontend Filter for a long time. I'm not familiar with frontend development, so it took me a long time to find a good solution. Now it seems that this kind of attack through GET parameters can be avoided. If you find my implementation still has security issues, please let me know in time, thanks very much.

## Reference Links

- Tabulator Document
  - [Custom Filter Functions](https://tabulator.info/docs/5.4/filter#func-builtin)
  - [Header Filtering](https://tabulator.info/docs/5.4/filter#header)