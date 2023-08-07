// see https://github.com/davidchambers/string-format#method-mode
format.extend(String.prototype, {});

// marked.options({mangle: false, headerIds: true});
marked.use(markedMangle.mangle());
marked.use(markedGfmHeadingId.gfmHeadingId());

// Define date format options
const DATA_OPTIONS = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
};

const uiDataUrl = "data/tagmarks.jsonl";
const tagsUrl = "data/tags.json";
const fitlerDocUrlTempl = "docs/filter.{language}.md";
const tagmarkTagDocUrl = "docs/tag-doc.md";

const customizedHeaderFilterPlaceholder =
    "Press CTRL/CMD and click here for help...";

var table;
var tabulatorData = Array();
var tagsInfo;
var maxTagCount;
var minTagCount;
var githubItemCount = 0;
var rainbow = new Rainbow();
var docs = {
    en: {
        filter: undefined,
        tagmarkTagDoc: undefined,
    },
    zh_CN: {
        filter: undefined,
    },
    ja: {
        filter: undefined,
    },
};

var overlaySwitchButtons = {
    "all-tags-show-switch-container": {
        buttonSpanClasses: ["fa-solid", "fa-tags", "fa-beat-fade"],
        titleDivId: "all-tags-show-switch-container-title",
        events: {
            click: () => {
                document
                    .getElementById("all-tags-overlay")
                    .classList.toggle("active");
            },
            mouseover: handleOverlayShowSwitchButtonMouseover,
            mouseout: handleOverlayShowSwitchButtonMouseout,
        },
    },
    "tagmark-tag-doc-show-switch-container": {
        buttonSpanClasses: ["fa-brands", "fa-readme", "fa-beat-fade"],
        titleDivId: "tagmark-tag-doc-show-switch-container-title",
        events: {
            click: displayTagMarkTagDoc,
            mouseover: handleOverlayShowSwitchButtonMouseover,
            mouseout: handleOverlayShowSwitchButtonMouseout,
        },
    },
};

// Fetch data from JSONL file and parse each line as a JSON object
function initData() {
    let fetchTabulatorDataPromise = fetch(uiDataUrl)
        .then((response) => response.text())
        .then((data) =>
            data
                .trim()
                .split("\n")
                .map((line) => {
                    let obj = JSON.parse(line);

                    obj.time_added = new Date(
                        obj.time_added * 1000
                    ).toLocaleString("zh-CN", DATA_OPTIONS);
                    if (obj.github_repo_info) {
                        obj.github_repo_info.time_created = new Date(
                            Date.parse(obj.github_repo_info.time_created)
                        ).toLocaleString("zh-CN", DATA_OPTIONS);
                        obj.github_repo_info.time_last_commit = new Date(
                            Date.parse(obj.github_repo_info.time_last_commit)
                        ).toLocaleString("zh-CN", DATA_OPTIONS);
                        obj.github_repo_info.time_last_release = new Date(
                            Date.parse(obj.github_repo_info.time_last_release)
                        ).toLocaleString("zh-CN", DATA_OPTIONS);

                        if (!obj.github_repo_info.is_archived) {
                            obj.github_repo_info.is_archived = false;
                        }
                        obj.github_repo_info.is_archived =
                            obj.github_repo_info.is_archived.toString();
                    }

                    if (obj.is_github_url && obj.github_repo_info) {
                        githubItemCount += 1;
                        if (!obj.github_repo_info.count_star) {
                            obj.github_repo_info.count_star = 0;
                        }
                        if (!obj.github_repo_info.count_fork) {
                            obj.github_repo_info.count_fork = 0;
                        }
                        if (!obj.github_repo_info.count_watcher) {
                            obj.github_repo_info.count_watcher = 0;
                        }
                    }

                    return obj;
                })
        );

    let fetchTagDefinitionsPromise = fetch(tagsUrl).then((response) =>
        response.json()
    );

    return Promise.all([fetchTabulatorDataPromise, fetchTagDefinitionsPromise])
        .then((data) => {
            [tabulatorData, tagsInfo] = data;
            tabulatorData.reduce((tagsInfo, item) => {
                item.tags.forEach((tag) => {
                    tagsInfo[tag]["count"] = (tagsInfo[tag]["count"] || 0) + 1;
                });
                return tagsInfo;
            }, tagsInfo);
            tagsInfo = formatTags(tagsInfo);
            maxTagCount = Math.max(
                ...Object.values(tagsInfo)
                    .filter((tagInfo) => tagInfo.hasOwnProperty("count"))
                    .map((tagInfo) => tagInfo.count)
            );
            minTagCount = Math.min(
                ...Object.values(tagsInfo)
                    .filter((tagInfo) => tagInfo.hasOwnProperty("count"))
                    .map((tagInfo) => tagInfo.count)
            );
            rainbow.setNumberRange(minTagCount, maxTagCount);
            rainbow.setSpectrum("white", "Red");

            return;
        })
        .catch((error) => {
            console.error(error.message);
        });
}

function formatTags(tagsInfo) {
    for (const key in tagsInfo) {
        tagsInfo[key]["tag"] = key;
        tagsInfo[key]["formatted_name"] = tagsInfo[key]["prefer_format"].format(
            tagsInfo[key]
        );
    }
    return tagsInfo;
}

function customHeaderFilter(headerValue, rowValue, rowData, filterParams) {
    //headerValue - the value of the header filter element
    //rowValue - the value of the column in this row
    //rowData - the data for the row being filtered
    //filterParams - params object passed to the headerFilterFuncParams property

    function filter(headerValue, cellValue) {
        if (!cellValue) return false;

        // case insensitive and trim
        let headerValueParts = headerValue.trim().split(/\b(OR|AND|NOT)\b/);
        let checkHeaderValueParts = Array();
        headerValueParts.forEach((headerValuePart) => {
            headerValuePart = headerValuePart.trim();
            if (headerValuePart === "AND") {
                checkHeaderValueParts.push("&&");
            } else if (headerValuePart === "OR") {
                checkHeaderValueParts.push("||");
            } else if (headerValuePart === "NOT") {
                checkHeaderValueParts.push("!");
            } else if (isOnlyOpenParentheses(headerValuePart)) {
                checkHeaderValueParts.push(headerValuePart);
            } else {
                let keyword = extractKeyword(headerValuePart);
                if (!keyword.trim()) return;
                if (Array.isArray(cellValue)) {
                    if (cellValue.length === 0) return false;
                    checkHeaderValueParts.push(
                        headerValuePart.replace(
                            keyword,
                            cellValue.some(
                                (elem) =>
                                    elem.trim().toLowerCase() ===
                                    keyword.toLowerCase().trim()
                            )
                        )
                    );
                } else if (typeof cellValue === "string") {
                    checkHeaderValueParts.push(
                        headerValuePart.replace(
                            keyword,
                            cellValue.trim().toLowerCase().includes(keyword)
                        )
                    );
                }
            }
        });
        let checkHeaderValueFuncCode =
            '"use strict"; return ' + checkHeaderValueParts.join(" ") + ";";
        let checkHeaderValueFunc = new Function(checkHeaderValueFuncCode);
        return checkHeaderValueFunc();
    }

    function isOnlyOpenParentheses(str) {
        const charSet = new Set(str);

        return charSet.size === 1 && charSet.has("(");
    }

    function extractKeyword(headerValuePart) {
        // This function takes a string headerValuePart as its argument and extracts the text between the
        // first opening parenthesis '(', and the last closing parenthesis ')' in the string. The
        // extracted text is then returned as the output of the function.

        // Find the index of the first opening parenthesis
        let startIndex = 0;
        for (let i = 0; i < headerValuePart.length; i++) {
            if (headerValuePart[i] === "(") {
                startIndex = i + 1;
            } else {
                break;
            }
        }

        // Find the index of the last closing parenthesis
        let endIndex = headerValuePart.length;
        for (let i = headerValuePart.length - 1; i >= 0; i--) {
            if (headerValuePart[i] === ")") {
                endIndex = i;
            } else {
                break;
            }
        }

        // Extract the text between the parentheses
        const textBetweenParentheses = headerValuePart
            .substring(startIndex, endIndex)
            .trim();

        return textBetweenParentheses;
    }

    function getCellValue(rowData, filterParams) {
        let cellValue;
        if (filterParams.field.indexOf(".") === -1) {
            cellValue = rowData[filterParams.field];
        } else {
            filterParams.field.split(".").forEach((property) => {
                cellValue = cellValue ? cellValue[property] : rowData[property];
            });
        }
        return cellValue;
    }

    return filter(headerValue, getCellValue(rowData, filterParams));
}

// Create Tabulator table with parsed data and specified columns
function createTable() {
    //define column header menu as column visibility toggle
    var headerMenu = function () {
        function createMenuItem(column) {
            //create checkbox element using font awesome icons
            let icon = document.createElement("i");
            icon.classList.add("fas");

            //build label
            let label = document.createElement("span");
            let title = document.createElement("span");

            title.textContent = " " + column.getDefinition().title;

            label.appendChild(icon);
            label.appendChild(title);

            let subColumns = column.getSubColumns();
            let menuItem = {
                label: label,
                action: function (e) {
                    //prevent menu closing
                    e.stopPropagation();

                    //toggle current column visibility
                    column.toggle();

                    //change menu item icon
                    if (column.isVisible()) {
                        icon.classList.remove("fa-square");
                        icon.classList.add("fa-check-square");
                    } else {
                        icon.classList.remove("fa-check-square");
                        icon.classList.add("fa-square");
                    }
                },
            };

            // recursively add sub menu
            if (subColumns.length > 0) {
                icon.classList.add("fa-square-plus");

                menuItem.menu = Array();
                subColumns.forEach((subColumn) =>
                    menuItem.menu.push(createMenuItem(subColumn))
                );
            } else {
                icon.classList.add(
                    column.isVisible() ? "fa-check-square" : "fa-square"
                );
            }
            return menuItem;
        }

        var menu = [];
        this.getColumns(true).forEach((column) =>
            menu.push(createMenuItem(column))
        );
        return menu;
    };

    const columns = [
        {
            title: "No",
            frozen: true,
            headerHozAlign: "center",
            formatter: "rownum",
            headerSort: false,
            titleFormatter: function (cell, formatterParams) {
                let title = cell.getValue();

                let div = document.createElement("div");
                let toTop = document.createElement("div");
                let toBottom = document.createElement("div");

                toTop.id = "to-top";
                toBottom.id = "to-bottom";

                toTop.innerText = "⏫";
                toBottom.innerText = "⏬";

                toTop.style.cursor = "pointer";
                toBottom.style.cursor = "pointer";

                toTop.classList.add("fa-fade");
                toBottom.classList.add("fa-fade");

                toTop.title = "scroll to top";
                toBottom.title = "scroll to bottom";

                div.innerHTML = `${toTop.outerHTML} ${toBottom.outerHTML}`;

                return `${title} ${div.outerHTML}`;
            },
        },
        {
            title: "Title",
            field: "title",
            width: "20%",
            formatter: "textarea",
            frozen: true,
            headerHozAlign: "center",
            tooltip: true,
            headerFilter: "input",
            headerFilterPlaceholder: customizedHeaderFilterPlaceholder,
            headerFilterFunc: customHeaderFilter,
            headerFilterFuncParams: { field: "title" },
            headerFilterLiveFilter: false,
            headerMenu: headerMenu,
        },
        {
            title: "URL",
            field: "url",
            width: "15%",
            formatter: "link",
            formatterParams: {
                labelField: "url",
                target: "_blank",
            },
            frozen: true,
            headerHozAlign: "center",
            tooltip: true,
            headerFilter: "input",
            headerFilterPlaceholder: customizedHeaderFilterPlaceholder,
            headerFilterFunc: customHeaderFilter,
            headerFilterFuncParams: { field: "url" },
            headerFilterLiveFilter: false,
            headerMenu: headerMenu,
        },
        {
            title: "Tags",
            field: "tags",
            width: "15%",
            headerHozAlign: "center",
            headerSort: false,
            titleFormatter: function (cell, formatterParams) {
                let title = cell.getValue();

                for (const id in overlaySwitchButtons) {
                    overlaySwitchButtons[id]["spanElement"] =
                        document.createElement("span");
                    overlaySwitchButtons[id]["spanElement"].id = id;
                    overlaySwitchButtons[id]["spanElement"].classList.add(
                        "button-show-switch-container"
                    );
                    let showSwitch = document.createElement("i");
                    overlaySwitchButtons[id]["buttonSpanClasses"].forEach(
                        (className) => {
                            showSwitch.classList.add(className);
                        }
                    );
                    overlaySwitchButtons[id]["spanElement"].appendChild(
                        showSwitch
                    );
                    title += ` ${overlaySwitchButtons[id]["spanElement"].outerHTML}`; // <span id="all-tags-show-switch-container"><i class="fa-solid fa-tags fa-beat"></i></span>;
                }

                return title;
            },
            headerFilter: "input",
            headerFilterPlaceholder: customizedHeaderFilterPlaceholder,
            headerFilterLiveFilter: false,
            headerFilterFunc: customHeaderFilter,
            headerFilterFuncParams: { field: "tags" },
            headerMenu: headerMenu,
            formatter: function (cell, formatterParams) {
                let tags = cell.getValue() || [];
                return addTags(tags, false, "tag", "original");
            },
        },
        {
            title: "GitHub Info",
            headerHozAlign: "center",
            headerMenu: headerMenu,
            columns: [
                {
                    title: "Description",
                    field: "github_repo_info.description",
                    width: "20%",
                    formatter: "textarea",
                    headerHozAlign: "center",
                    tooltip: true,
                    headerFilter: "input",
                    headerSort: false,
                    headerFilterPlaceholder: customizedHeaderFilterPlaceholder,
                    headerFilterLiveFilter: false,
                    headerFilterFunc: customHeaderFilter,
                    headerFilterFuncParams: {
                        field: "github_repo_info.description",
                    },
                    headerMenu: headerMenu,
                },
                {
                    title: "Star",
                    field: "github_repo_info.count_star",
                    sorter: "number",
                    headerHozAlign: "center",
                    headerFilter: "input",
                    headerFilterPlaceholder: ">=",
                    headerFilterFunc: ">=",
                    headerFilterLiveFilter: false,
                    headerMenu: headerMenu,
                },
                {
                    title: "Fork",
                    field: "github_repo_info.count_fork",
                    sorter: "number",
                    headerHozAlign: "center",
                    headerFilter: "input",
                    headerFilterPlaceholder: ">=",
                    headerFilterFunc: ">=",
                    headerFilterLiveFilter: false,
                    headerMenu: headerMenu,
                },
                {
                    title: "Topics",
                    field: "github_repo_info.topics",
                    width: "20%",
                    formatter: "textarea",
                    headerHozAlign: "center",
                    headerFilter: "input",
                    headerSort: false,
                    headerFilterPlaceholder: customizedHeaderFilterPlaceholder,
                    headerFilterLiveFilter: false,
                    headerFilterFunc: customHeaderFilter,
                    headerFilterFuncParams: {
                        field: "github_repo_info.topics",
                    },
                    formatter: function (cell, formatterParams) {
                        let topics = cell.getValue() || [];
                        let topicDiv = document.createElement("div");
                        topicDiv.classList.add("topics-container");
                        topics.forEach((topic) => {
                            let topicSpan = document.createElement("span");
                            topicSpan.classList.add("topic-span");
                            topicSpan.style.backgroundColor = "LightSteelBlue";
                            topicSpan.innerText = `${topic}`;
                            topicDiv.appendChild(topicSpan);
                        });
                        return topicDiv;
                    },
                    headerMenu: headerMenu,
                },
                {
                    title: "Last Commit",
                    field: "github_repo_info.time_last_commit",
                    headerHozAlign: "center",
                    headerFilter: "input",
                    headerFilterPlaceholder: ">=",
                    headerFilterFunc: ">=",
                    headerFilterLiveFilter: false,
                    headerMenu: headerMenu,
                },
                {
                    title: "Created",
                    field: "github_repo_info.time_created",
                    headerHozAlign: "center",
                    headerFilter: "input",
                    headerFilterPlaceholder: ">=",
                    headerFilterFunc: ">=",
                    headerFilterLiveFilter: false,
                    headerMenu: headerMenu,
                },
                {
                    title: "Archived",
                    field: "github_repo_info.is_archived",
                    headerHozAlign: "center",
                    hozAlign: "center",
                    headerFilter: "input",
                    headerFilterPlaceholder: "=",
                    headerFilterFunc: "=",
                    headerFilterLiveFilter: false,
                    headerMenu: headerMenu,
                },
            ],
        },
        {
            title: "Date Added",
            field: "time_added",
            headerHozAlign: "center",
            headerFilter: "input",
            headerFilterPlaceholder: ">=",
            headerFilterFunc: ">=",
            headerFilterLiveFilter: false,
            headerMenu: headerMenu,
        },
        {
            title: "Comment",
            field: "comment",
            width: "20%",
            formatter: "textarea",
            headerHozAlign: "center",
            tooltip: true,
            headerFilter: "input",
            headerFilterPlaceholder: customizedHeaderFilterPlaceholder,
            headerFilterLiveFilter: false,
            headerFilterFunc: customHeaderFilter,
            headerFilterFuncParams: {
                field: "comment",
            },
            headerMenu: headerMenu,
        },
    ];

    return new Tabulator("#tagmark-table", {
        data: tabulatorData,
        popupContainer: true,
        columns: columns,
        layout: "fitDataFill",
        pagination: "local",
        // we can not set maxHeight to "90%", this will cause the header frozen not work
        // instead we should caculate the value then set to maxHeight
        maxHeight: `${0.9 * window.innerHeight}px`,
        initialSort: [
            { column: "github_repo_info.time_last_commit", dir: "desc" },
        ],
        pagination: true,
        paginationSize: 10000,
        paginationSizeSelector: [100, 1000, 10000, 100000],
        paginationCounter: "rows",
    });
}

function getClickedTag(tagDiv) {
    const showFieldset = document.getElementById("all-tags-show-fieldset");
    const showInputs = showFieldset.querySelectorAll(
        'input[name="tags-show-name"]'
    );
    showInputs.forEach((input) => {
        if (input.checked) {
            show = input.value;
        }
    });

    let tagShowName = tagDiv.getElementsByTagName("span")[0].innerText;
    let tag;
    let tagCountSub = tagDiv.getElementsByTagName("sub")[0];
    if (tagCountSub && show === "formatted_name") {
        tag = Object.keys(tagsInfo).filter(
            (tag) => tagsInfo[tag]["formatted_name"] === tagShowName
        )[0];
    } else {
        tag = tagShowName;
    }

    return tag;
}

function showTagDefinition(event) {
    let tagDefinitionDiv = document.getElementById("tag-definition");

    // toggle display
    if (!["none", ""].includes(tagDefinitionDiv.style.display)) {
        tagDefinitionDiv.style.display = "none";
        return;
    }

    let tag = getClickedTag(this);

    let tagDefinitionText = tagsInfo[tag]["definition"];
    if (!tagDefinitionText) {
        console.warn(
            `definition of tag "${tag}" is missing, please define it.`
        );
        tagDefinitionDiv.innerText = "[Warning] definition missing";
    } else {
        tagDefinitionDiv.innerText = tagDefinitionText;
    }

    let boundingRect = this.getBoundingClientRect();
    let windowHeight =
        window.innerHeight || document.documentElement.clientHeight;
    let windowWidth = window.innerWidth || document.documentElement.clientWidth;

    // set Y postion of tagDefinitionDiv
    if (boundingRect.top + boundingRect.height / 2 < windowHeight / 2) {
        tagDefinitionDiv.style.top = `${
            boundingRect.bottom + window.scrollY
        }px`;
        tagDefinitionDiv.style.bottom = "auto";
    } else {
        tagDefinitionDiv.style.top = "auto";
        tagDefinitionDiv.style.bottom = `${
            windowHeight - boundingRect.top + window.scrollY
        }px`;
    }

    // set X position of tagDefinitionDiv
    if (boundingRect.left + boundingRect.width / 2 < windowWidth / 2) {
        tagDefinitionDiv.style.left = `${
            (boundingRect.left + boundingRect.right) / 2 + window.scrollX
        }px`;
        tagDefinitionDiv.style.right = "auto";
    } else {
        tagDefinitionDiv.style.left = "auto";
        tagDefinitionDiv.style.right = `${
            windowWidth -
            (boundingRect.left + boundingRect.right) / 2 +
            window.scrollX
        }px`;
    }
    tagDefinitionDiv.style.display = "block";

    // check div top overflow and reset it
    tagDefinitionDivBoundingRect = tagDefinitionDiv.getBoundingClientRect();
    if (tagDefinitionDivBoundingRect.top < 0) {
        tagDefinitionDiv.style.top = `${window.scrollY}px`;
    }
    if (tagDefinitionDivBoundingRect.bottom > window.innerHeight) {
        tagDefinitionDiv.style.bottom = `${window.scrollY}px`;
    }
}

function startFadeTag(event) {
    this.style.cursor = "pointer";
    this.classList.toggle("fa-fade");
}

function stopFadeTag(event) {
    this.classList.toggle("fa-fade");
}

function addTagIntoHeaderFilter(event) {
    event.preventDefault();
    let tag = getClickedTag(this);

    // here we can not use table.setHeaderFilterValue because it refresh the table automatically, which is not we want
    //table.setHeaderFilterValue("tags", newTagsHeaderFilterValue);
    let tagsHeaderFilterInput = document.querySelector(
        '.tabulator-col[tabulator-field="tags"] input[type="text"]'
    );
    tagsHeaderFilterInput.value = tagsHeaderFilterInput.value
        ? `${tagsHeaderFilterInput.value} ${tag}`
        : tag;

    var interval = setInterval(function () {
        tagsHeaderFilterInput.classList.toggle("fa-fade");
    }, 500);

    setTimeout(function () {
        clearInterval(interval);
        tagsHeaderFilterInput.classList.remove("fa-fade");
    }, 3000);
}

function handleOverlayShowSwitchButtonMouseover(event) {
    let titleDiv = document.getElementById(
        overlaySwitchButtons[event.currentTarget.id].titleDivId
    );
    let boundingRect = event.currentTarget.getBoundingClientRect();
    titleDiv.style.top = boundingRect.bottom + window.scrollY + "px";
    titleDiv.style.left =
        (boundingRect.left + boundingRect.right) / 2 + window.scrollX + "px";

    titleDiv.style.display = "block";
}

function handleOverlayShowSwitchButtonMouseout(event) {
    let titleDiv = document.getElementById(
        overlaySwitchButtons[event.currentTarget.id].titleDivId
    );
    titleDiv.style.display = "none";
}

function addTags(
    tags,
    withCount = false,
    show = "formatted_name",
    sort = "original"
) {
    let tagsDiv = document.createElement("div");
    tagsDiv.classList.add("tags-container");

    // Sort tags based on the sort parameter
    if (sort === "original") {
        // Do not modify the order, iterate in the original order
    } else if (sort === "name") {
        tags.sort((a, b) =>
            tagsInfo[a][show].localeCompare(tagsInfo[b][show], undefined, {
                sensitivity: "base",
            })
        );
    } else if (sort === "count") {
        tags = tags.sort((a, b) => {
            if (tagsInfo[b]["count"] !== tagsInfo[a]["count"]) {
                // If count is not equal, sort by count value in descending order
                return tagsInfo[b]["count"] - tagsInfo[a]["count"];
            } else {
                try {
                    // If count is equal, sort by element name in ascending order
                    return tagsInfo[a][show].localeCompare(
                        tagsInfo[b][show],
                        undefined,
                        { sensitivity: "base" }
                    );
                } catch (error) {
                    console.error("An error occurred:", error.message);
                }
            }
        });
    }

    tags.forEach((tag) => {
        let count = tagsInfo[tag]["count"];

        let tagDiv = document.createElement("div");
        tagDiv.classList.add("tag-container");
        tagDiv.style.backgroundColor = `#${rainbow.colorAt(count)}`;
        tagsDiv.appendChild(tagDiv);

        let tagSpan = document.createElement("span");
        // tagSpan.classList.add("tag-span");
        tagSpan.innerText = tagsInfo[tag][show];
        tagDiv.appendChild(tagSpan);

        let tagsInfoInTitle = { ...tagsInfo[tag] };
        delete tagsInfoInTitle["definition"];
        tagDiv.title = `${JSON.stringify(
            tagsInfoInTitle,
            null,
            4
        )}\n\nTag Mouse Operation Guide:\n* [Left Click] to show/hide the definition of this tag.\n* [Right Click] to add this tag into the header filter input box.\n* [Hover] to show tag information (this popup).`;

        let tagCountSub;
        if (withCount) {
            tagCountSub = document.createElement("sub");
            tagDiv.appendChild(tagCountSub);
            tagCountSub.innerText = `${count}`;
        }

        // Change the font color to ensure it looks clear when the background color is deep
        if (count / maxTagCount >= 0.6) {
            tagSpan.style.color = "white";
            if (tagCountSub) {
                tagCountSub.style.color = "white";
            }
        }

        tagDiv.addEventListener("click", showTagDefinition);
        tagDiv.addEventListener("mouseover", startFadeTag);
        tagDiv.addEventListener("mouseout", stopFadeTag);
        tagDiv.addEventListener("contextmenu", addTagIntoHeaderFilter); // right click
    });
    return tagsDiv;
}

function changeFilterDoc() {
    let filterDocLanguageSelect = document.getElementById(
        "filter-doc-language-select"
    );
    let filterDocDiv = document.getElementById("filter-doc");
    let language = filterDocLanguageSelect.value;
    let doc = docs[language].filter;

    if (!doc || !filterDocDiv.innerHTML.trim()) {
        let docUrl = fitlerDocUrlTempl.replace("{language}", language);
        fetch(docUrl)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.text();
            })
            .then((markdown) => {
                docs[language].filter = markdown;
                filterDocDiv.innerHTML = marked.parse(markdown);
            })
            .catch((error) => {
                console.error(
                    "There was a problem with the fetch operation:",
                    error
                );
            });
    } else {
        filterDocDiv.innerHTML = marked.parse(doc);
    }
}

function displayTagMarkTagDoc() {
    document
        .getElementById("tagmark-tag-doc-overlay")
        .classList.toggle("active");
    let tagmarkTagDocDiv = document.getElementById("tagmark-tag-doc");

    if (!tagmarkTagDocDiv.innerHTML.trim()) {
        fetch(tagmarkTagDocUrl)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.text();
            })
            .then((markdown) => {
                docs.en.tagmarkTagDoc = markdown;
                tagmarkTagDocDiv.innerHTML = marked.parse(markdown);
            })
            .catch((error) => {
                console.error(
                    "There was a problem with the fetch operation:",
                    error
                );
            });
    } else {
        tagmarkTagDocDiv.innerHTML = marked.parse(docs.en.tagmarkTagDoc);
    }
}

function onTableBuiltInits() {
    function setHeaderFilterValueAccordingToUrlParams() {
        let queryParams = new URLSearchParams(window.location.search);
        for (const [filterFiled, filterValue] of queryParams.entries()) {
            table.setHeaderFilterValue(filterFiled, filterValue);
        }
    }

    function setPageFooterStats() {
        let bookmarkCountSpan = document.getElementById("bookmark-count");
        bookmarkCountSpan.innerText = tabulatorData.length;
        let githubBookmarkCountSpan = document.getElementById(
            "github-bookmark-count"
        );
        githubBookmarkCountSpan.innerText = githubItemCount;
        let tagCountSpan = document.getElementById("tag-count");
        tagCountSpan.innerText = Object.keys(tagsInfo).length;
    }

    function initAllTagsOverlay() {
        let allTagsDiv = document.getElementById("all-tags-div");

        allTagsDiv.appendChild(
            addTags(
                Object.keys(tagsInfo).filter(
                    (tag) =>
                        tagsInfo[tag].hasOwnProperty("count") &&
                        tagsInfo[tag].count > 0
                ),
                true,
                "formatted_name",
                "count"
            )
        );

        let allTagsFieldsets = document
            .getElementById("all-tags-menu")
            .getElementsByTagName("fieldset");
        for (const fieldset of allTagsFieldsets) {
            fieldset.addEventListener("change", (event) => {
                const sortFieldset = document.getElementById(
                    "all-tags-sort-fieldset"
                );
                const showFieldset = document.getElementById(
                    "all-tags-show-fieldset"
                );

                const sortInputs = sortFieldset.querySelectorAll(
                    'input[name="tags-sort"]'
                );
                const showInputs = showFieldset.querySelectorAll(
                    'input[name="tags-show-name"]'
                );

                let sort;
                let show;

                sortInputs.forEach((input) => {
                    if (input.checked) {
                        sort = input.value;
                    }
                });

                showInputs.forEach((input) => {
                    if (input.checked) {
                        show = input.value;
                    }
                });

                allTagsDiv.innerHTML = "";
                allTagsDiv.appendChild(
                    addTags(
                        Object.keys(tagsInfo).filter(
                            (tag) =>
                                tagsInfo[tag].hasOwnProperty("count") &&
                                tagsInfo[tag].count > 0
                        ),
                        true,
                        show,
                        sort
                    )
                );
            });
        }
    }

    function initHeaderFilterInputShowDocEvents() {
        let filterDocOverlay = document.getElementById("filter-doc-overlay");

        let allHeaderFilterInput = document.querySelectorAll(
            ".tabulator-header-filter>input"
        );
        let filterDocLanguageSelect = document.getElementById(
            "filter-doc-language-select"
        );
        allHeaderFilterInput.forEach((input) =>
            input.addEventListener("mousedown", function (event) {
                if (
                    // left button clicked and CTRL/COMMAND key pressed
                    event.button === 0 &&
                    (event.ctrlKey || event.metaKey)
                ) {
                    event.preventDefault();
                    filterDocOverlay.classList.toggle("active");
                    changeFilterDoc();
                }
            })
        );
        filterDocLanguageSelect.addEventListener("change", changeFilterDoc);
    }

    function initToTopAndToBottomButtons() {
        let toTop = document.getElementById("to-top");
        let toBottom = document.getElementById("to-bottom");
        toTop.addEventListener("click", () => {
            table.scrollToRow(table.getRowFromPosition(1), "top", true);
        });
        toBottom.addEventListener("click", () => {
            table.scrollToRow(
                table.getRowFromPosition(
                    Math.min(table.getDataCount("active"), table.getPageSize())
                ),
                "top",
                true
            );
        });
    }

    function initOverlayCloseButtonEvents() {
        document.querySelectorAll(".overlay .close-btn").forEach((closeBtn) => {
            closeBtn.addEventListener("click", (event) => {
                let overlayDiv = event.currentTarget.parentNode;
                while (overlayDiv !== null) {
                    if (overlayDiv.classList.contains("overlay")) {
                        // Found the ancestor with the class "overlay"
                        break;
                    }
                    overlayDiv = overlayDiv.parentNode;
                }
                overlayDiv.classList.toggle("active");
            });
        });
    }

    function initOverlaySwitchButtonEvents() {
        for (const id in overlaySwitchButtons) {
            Object.entries(overlaySwitchButtons[id]["events"]).forEach(
                ([eventName, func]) => {
                    document
                        .getElementById(id)
                        .addEventListener(eventName, func);
                }
            );
        }
    }

    setHeaderFilterValueAccordingToUrlParams();
    setPageFooterStats();
    initAllTagsOverlay();
    initHeaderFilterInputShowDocEvents();
    initToTopAndToBottomButtons();
    initOverlayCloseButtonEvents();
    initOverlaySwitchButtonEvents();
}

// Dynamically load the script regardless of the user's choice
function loadStatisticsScript() {
    const script = document.createElement("script");
    script.src =
        "https://cdn.jsdelivr.net/npm/busuanzi@2.3.0/bsz.pure.mini.min.js";
    script.crossOrigin = "anonymous";
    script.referrerPolicy = "no-referrer";
    document.head.appendChild(script);
}

function showPvUserConfirm() {
    window.addEventListener("load", function () {
        let ifLoadStatisticsScript = Cookies.get("ifLoadStatisticsScript");

        if (ifLoadStatisticsScript === undefined) {
            Swal.fire({
                title: "Privacy Confirm",
                text: "Do you want to load the script (powered by busuanzi) for showing page view statistics in the page bottom, which will include your visit?",
                icon: "warning",
                showCancelButton: true,
                color: "white",
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "Yes",
                cancelButtonText: "No",
            }).then((result) => {
                ifLoadStatisticsScript = result.isConfirmed;
                Cookies.set("ifLoadStatisticsScript", ifLoadStatisticsScript, {
                    expires: 7,
                    path: "",
                });
                if (ifLoadStatisticsScript) {
                    loadStatisticsScript();
                }
            });
        } else {
            // convert into Boolean
            ifLoadStatisticsScript = JSON.parse(ifLoadStatisticsScript);
        }

        if (ifLoadStatisticsScript) {
            loadStatisticsScript();
        }
    });
}

showPvUserConfirm();

// Wait for DOM to load and then fetch and initialize data, create table, bind events
document.addEventListener("DOMContentLoaded", () => {
    initData()
        .then(() => {
            table = createTable();
            table.on("tableBuilt", onTableBuiltInits);
        })
        .catch((error) => console.error(error.message));
});
