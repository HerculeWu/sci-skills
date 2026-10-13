# ADS 能不能回答「这个有人做过吗」

Ticket: [#4](https://github.com/HerculeWu/sci-skills/issues/4)，map: [#1](https://github.com/HerculeWu/sci-skills/issues/1)。调查日期 2026-10-13。

本文只报事实，不决定 skill 怎么查新。每条都标了来源，分三类：

- **文档**：ADS 官方文档或源码里写的。
- **实测**：2026-10-13 对 `api.adsabs.harvard.edu/v1/search/query` 实际发请求看到的，写成 `observed: <query>`。
- **推断**：我从前两类得出的，单独放在第 7 节，正文其它地方不混入。

## 1. 结论

- ADS 能把「集合外、主题相邻」的工作找出来，靠的主要是引用图的交集（`citations(A) citations(B)`）和全文检索（`body:`、`full:`）。只查摘要（`abs:`）不够：方法细节通常只在正文里。
- 样本想法实测：没有查到一篇论文在摘要里声明比较了 tidal tail 粒子的三种处理方式。查到了 9 篇集合外的相邻工作（第 5 节），其中最接近的是 `2021arXiv210410843W`（用 PeTar 研究长程/短程力精度对 escapers 的影响）和 `2026arXiv260213385C`（KRIOS、NBODY6++GPU、particle spray 三种方法在 stream 上的对比）。
- 「没查到」不能当作「没人做过」。实测到三种会漏的机制：全文分词把小型大写的代码名拆碎（PeTar 在集合内 5 篇里只命中 3 篇）、大写词被当成缩写精确匹配（`body:NBODY6` 370 篇，`body:nbody6` 721 篇）、方法细节的措辞猜不中就查不到。
- `ads.mjs` 的 `search` 已经能原样传 `citations()`、`body:` 这些查询；缺的是结果总数、翻页、`fq`、排序、高亮片段、集合内外标记和重试。

## 2. 来源与方法

| 标记 | 来源 |
|---|---|
| S1 | [Search Syntax](https://ui.adsabs.harvard.edu/help/search/search-syntax) |
| S2 | [Second Order Queries](https://ui.adsabs.harvard.edu/help/search/second-order) |
| S3 | [Citations and References](https://ui.adsabs.harvard.edu/help/search/citations-and-references) |
| S4 | [Comprehensive Solr Term List](https://ui.adsabs.harvard.edu/help/search/comprehensive-solr-term-list) |
| S5 | [Search Parser](https://ui.adsabs.harvard.edu/help/search/search-parser) |
| S6 | [FAQ](https://ui.adsabs.harvard.edu/help/faq/) |
| S7 | [Data FAQ](https://ui.adsabs.harvard.edu/help/data_faq/) |
| S8 | API Rate Limit Policy，源文件 [`help/policies/_posts/2025-08-01-rate-limits.md`](https://github.com/adsabs/adsabs.github.io/blob/master/help/policies/_posts/2025-08-01-rate-limits.md) |
| S9 | [adsabs-dev-api README](https://github.com/adsabs/adsabs-dev-api/blob/master/README.md) |
| S10 | [Search_API.ipynb](https://github.com/adsabs/adsabs-dev-api/blob/master/API_documentation_UNIXshell/Search_API.ipynb) |
| S11 | [openapi/parameters.yaml](https://github.com/adsabs/adsabs-dev-api/blob/master/openapi/parameters.yaml) |
| S12 | ADS 查询解析器源码 [`AqpAdsabsSubQueryProvider.java`](https://github.com/adsabs/montysolr/blob/main/montysolr/src/main/java/org/apache/lucene/queryparser/flexible/aqp/builders/AqpAdsabsSubQueryProvider.java) |

- S1–S7 我读的是帮助站的 Markdown 源文件（仓库 `adsabs/adsabs.github.io`，commit `eec2296`，路径 `_includes/_help/...`），不是线上页面：`ui.adsabs.harvard.edu/help/...` 对 `curl` 返回 HTTP 202 空响应，WebFetch 报证书错误。线上页面和仓库 master 是否逐字一致，我没能核对。
- S9–S11 取自 `adsabs/adsabs-dev-api` commit `2e221c0`，S12 取自 `adsabs/montysolr` commit `cdefd8b`。
- 实测共发了约 200 个请求。集合内的 33 个 bibcode 取自各论文目录的 `meta.json`，和 canvas 里 `paper` 卡片上的 bibcode 逐一比对一致。

## 3. 查询形式

### 3.1 文档里写的

| 形式 | 作用 | 来源 |
|---|---|---|
| `abs:"…"` | 一次查 `title`、`abstract`、`keyword` | S1, S4 |
| `title:"…"`、`abstract:"…"`、`keyword:"…"` | 只查该字段 | S1 |
| `body:"…"` | 只查正文（「extracted fulltext minus acknowledgements section」） | S1, S4 |
| `full:"…"` | 查正文、致谢、摘要、标题、关键词 | S1 |
| `ack:"…"` | 只查致谢 | S1 |
| `has:body` | 筛出有可检索全文的记录 | S6 |
| `citations(q)` | 引用了 `q` 结果的全部记录 | S3 |
| `references(q)` | 被 `q` 结果引用的全部记录 | S3 |
| `similar(q)` | 把 `q` 结果的摘要拼成一篇，按文本相似度给全库摘要排序，排除 `q` 自己的结果 | S2 |
| `useful(q)` | `q` 结果的参考文献，按被引次数排序 | S2 |
| `reviews(q)` | 引用 `q` 结果的论文，按引用其中多少篇排序 | S2 |
| `trending(q)` | 读过 `q` 结果的读者还在读什么 | S2 |
| `topn(N, q, sort)` | 取 `q` 的前 N 条 | S2 |
| `a NEAR5 b` | 同一字段内相距不超过 5 个词，N 取 1–5，不分先后 | S1, S5 |
| `"a b"~3` | 有序邻近 | S5 |
| `=term` | 关闭同义词扩展 | S1 |
| `doctype:`、`property:refereed`、`year:`、`bibstem:`、`database:` | 过滤 | S1 |

文档里和查新直接相关的行为：

- 默认对检索词做同义词扩展；全大写的词被当作缩写，「A search for an uppercase word will only match documents which contain that acronym」，小写词匹配任意大小写。（S1）
- 多个词之间默认是 AND。（S1, S5）
- `citations()` 和 `references()` 之外，可以再接别的条件收窄或放宽，例如 `citations(bibcode:X) OR abstract:(…)`。（S3）
- 算子可以嵌套，例如 `trending(topn(10, reviews("weak lensing")))`。（S2）
- 源码里 `useful`、`reviews`、`trending` 都只取内层查询的前 200 条再做二阶运算；`similar` 取内层前 200 篇的 `abstract` 和 `title`，最多用 100 个词，默认要求词在输入里至少出现 2 次、在库里至少 2 篇文档出现；`citations` 和 `references` 没有这个 200 的截断。（S12）
- `similar` 有一种文档站没写、源码里有的用法：`similar("一段文字", input)`，把引号里的文字本身当作输入，不去查库。（S12）

### 3.2 文档里写的限制

| 限制 | 值 | 来源 |
|---|---|---|
| 每日请求数 | 5000 次/天（「for most request types」），每个 endpoint 单独计 | S8, S9 |
| 提额 | 发邮件给 adshelp 申请 | S8 |
| `rows` | 默认 10，最大 2000 | S10, S11 |
| `q` 长度 | 不超过 1000 字符 | S10 |
| bigquery | 每次最多 2000 个 bibcode，通常每天 100 次；只在主查询之后当过滤器用 | S10 |
| `body` 字段 | 只能检索，不能用 `fl` 取回，不能排序 | S4, S10 |
| 高亮片段 | `hl.snippets` 最多 4，`hl.fragsize` 最多 100 字符，默认只分析字段前 51,200 字符；「Limits are in place to prevent scraping of our full-text holdings」 | S10 |
| 全文覆盖 | 「available for searching for many records, including most recent publications」；「not all records with source links have searchable full text」；「most major journals in astronomy and physics, especially recent volumes. This includes articles in the arXiv」 | S6, S7 |
| 入库延迟 | arXiv 每天，天文期刊每周（周末），物理期刊约每 3 周 | S7 |
| arXiv 记录的引用 | 参考文献从 PDF 里抽，「this process is not always successful」；正式发表后改用出版社的参考文献表 | S6, S7 |
| arXiv 与发表版 | 自动合并成一条，偶尔合并失败 | S7 |
| 收录范围 | 目标是天体物理文献全集，含会议、书、proposal 等灰色文献 | S6 |

### 3.3 实测到的

**限额与速度**

- 响应头 `x-ratelimit-limit=5000`。observed: 任意一次 `/v1/search/query` 请求。
- `x-ratelimit-reset=1791982824`，即 2026-10-14 13:00:24 UTC，不是 S9 写的 UTC 午夜。成功的响应也带 `retry-after`，值是到 reset 的秒数。observed: 同上。
- `rows=2001` 和 `rows=5000` 都只返回 2000 条，不报错。observed: `abs:"star cluster"`（numFound=40709）。
- 1531 字符的 `q` 被接受，没有按 S10 的 1000 字符拒绝。observed: 61 个 bibcode 用 OR 连起来的 `bibcode:(…)`。集合内 33 个 bibcode 的 OR 表达式是 831 字符。
- 大多数请求 0.5–5 秒。慢的有：`similar(bibcode:(8 篇))` 约 17 秒；`bibcode:"2025A&A...704A..50J" body:"simulations were performed using"` 约 16 秒。
- `trending(abs:"tidal tails" abs:"star cluster" abs:"N-body")` 在 120 秒后返回 HTTP 504。同样内层查询的 `reviews(…)` 5 秒返回，`useful(…)` 2 秒返回。
- 约 200 个请求里遇到 2 次连接超时（`UND_ERR_CONNECT_TIMEOUT`），重试后成功。

**全文覆盖**

| 查询 | numFound |
|---|---|
| `*:*` | 38,338,939 |
| `has:body` | 18,658,021 |
| `database:astronomy` | 3,200,043 |
| `has:body` + `fq=database:astronomy` | 1,545,339 |
| `year:2015-2026 database:astronomy property:refereed` | 385,690 |
| 同上加 `has:body` | 333,391（86%） |

2019–2026 年按期刊（observed: `bibstem:"X" year:2019-2026`，加或不加 `has:body`）：

| bibstem | 全部 | 有全文 |
|---|---|---|
| MNRAS | 28,433 | 27,943 |
| A&A | 21,750 | 21,358 |
| ApJ | 27,111 | 27,033 |
| arXiv | 1,273,866 | 1,239,803 |
| RNAAS | 2,269 | 2,257 |

集合内 33 篇里 32 篇有全文，缺的是会议文集 `2023fscp.conf...11K`。observed: `bibcode:(33 篇) has:body`。

**分词和大小写**

| 查询 | numFound | 说明 |
|---|---|---|
| `body:NBODY6` | 370 | 解析为 `body:acr::nbody6`（`debugQuery=true`） |
| `body:nbody6`、`body:Nbody6` | 721 | 解析为 `body:nbody6` |
| `body:"NBODY6++GPU"` | 118 | |
| `body:"nbody6++gpu"` | 192 | |
| `body:"nbody6++"` | 721 | 和 `body:nbody6` 一样，`++` 被丢掉 |
| `body:"nbody 6"` | 83 | 代码名被拆成两个词的写法 |
| `body:nbody6 OR body:"nbody 6"` | 771 | |
| `body:PeTar`、`body:petar` | 14,781 / 14,779 | 混合大小写不算缩写；绝大多数是人名 Petar |
| `citations(bibcode:2020MNRAS.497..536W)` | 172 | PeTar 论文的全部引用 |
| `body:"tidal tail"` | 7,959 | 解析为 `body:"syn::tidal syn::tail"` |
| `body:"tidal tails"` | 7,960 | |
| `=body:"tidal tail"` | 3,336 | 关掉同义词 |

用集合内论文的本地全文（各目录下的 `.md`）做对照：

- 本地正文出现 PeTar 的有 5 篇（Boffin2022、Jadhav2025、Kroupa2024、Sharma2025、Wang2024）。`bibcode:(33 篇) body:petar` 命中 3 篇，漏了 `2025A&A...704A..50J` 和 `2025A&A...704A.167S`，两篇都 `has:body`。
- `2025A&A...704A..50J` 匹配 `body:"p e t ar"`，不匹配 `body:petar`、`body:petar*`、`full:petar`。即 ADS 抽出的正文里这个小型大写的代码名是四个词「P E T AR」。全库 `body:"p e t ar"` 5 篇，`body:"p etar"` 407 篇，`body:"pe tar"` 17 篇。
- 本地正文出现 NBODY6 各种写法的有 9 篇。`bibcode:(33 篇) body:nbody6` 命中 7 篇，漏了 `2024A&A...691A.143W` 和 `2026A&A...713A..93J`。`2024A&A...691A.143W` 的高亮片段显示 ADS 里是「NBODY 6」。
- 引用 PeTar 论文且有全文的 163 篇里，`body:petar` 命中 130 篇，33 篇不命中；这 33 篇里 4 篇匹配上面三种拆开的写法。observed: `citations(bibcode:2020MNRAS.497..536W) has:body -body:petar`。

**高亮片段（`hl=true&hl.fl=body`）**

- 能拿到匹配处的原句，例如 `2017MNRAS.466.1741C`：「its motion is integrated separately (Aarseth 2003)」「Escapers were not removed from the simulations to allow stars to move from the tidal tails back into the region of the cluster」。observed: `q=body:"tidal tail" body:"integrated separately"`，`fq=bibcode:2017MNRAS.466.1741C`。
- 把 `bibcode:` 条件写进 `q` 时，同一篇论文的高亮返回空对象；改写进 `fq` 就有内容。observed: 上一条的两种写法。
- 有的记录无论怎么写都返回空高亮，例如 `2025A&A...704A..50J`（`q=body:"performed using"`，`fq=bibcode:…`，`hl.maxAnalyzedChars=400000`）。同是 A&A 的 `2024A&A...691A.143W` 有内容。
- 响应里带 `"filtered": "true"`，`fl` 被服务器加上了 `publisher`。
- 高亮会标出 `q` 里所有词的匹配，包括年份这类过滤词。

**二阶算子**

- `similar("…样本想法改写成一段英文…", input)` 能跑，numFound=1,675,488，只是一个排序；前 25 条里 11 条在集合内，集合外的是主题相近的 tidal tail 论文（`2010MNRAS.401..105K`、`2020A&A...640A..84D` 等），也混进了星系的 tidal tail（`2024A&A...690A...4S`、`2007ApJ...659L.115C`）。
- `similar("tidal tail particles tree code direct N-body", input)` 返回 0 条。这段文字里没有重复出现的词。
- `similar(bibcode:(集合内 8 篇模拟论文))` 的前 40 条被星团名字带偏：恒星自转、锂丰度、成员认证的论文占多数（`2019ApJ...879...49C`、`1995ApJ...446..203B` 等）。
- `useful(abs:"tidal tails" abs:"star cluster" abs:"N-body")` 返回背景文献（`2001MNRAS.322..231K`、`1966AJ.....71...64K`、`2003gnbs.book.....A`）。
- `reviews(同上)` 前 15 条里 5 条在集合内，集合外的有 `2025NewAR.10001713B`、`2018NewAR..81....1R`、`2026arXiv260213385C`。

## 4. `ads.mjs` 现状

读的是 `skills/find-papers/scripts/ads.mjs` 和 `skills/find-papers/SKILL.md`（commit `954ead5`）。

已经能做的：

- `search` 把查询串原样发给 ADS，所以 `citations()`、`references()`、`reviews()`、`body:`、`full:`、`similar("…", input)` 都能经 `search` 跑。observed: `ads.mjs search 'citations(bibcode:2020MNRAS.497..536W) body:nbody6 body:"tidal tail"'` 返回 10 条，和直接调 API 一致。
- 429 会带上 `retry-after` 报错；400 会给出 ADS 的错误信息。

没有的：

| 缺口 | 现状 | 和「有人做过吗」的关系 |
|---|---|---|
| 结果总数 | 不输出 `numFound` | 看不出返回的 50 条是全部还是 5000 条里的前 50 条；空结果只有一行 `note:` |
| 行数与翻页 | `--rows` 上限 50，没有 `start` | ADS 允许 2000；本次第 5 节的查询 numFound 在 5–119 之间，B7（104）和 F1（119）超过 50 |
| `fq` | 没有 | 高亮只有把 `bibcode:` 放进 `fq` 才返回（3.3） |
| 排序 | 固定 `score desc` | 不能按 `date desc` 看最新的，也不能按 `citation_count desc` |
| 高亮 | 不发 `hl` 参数 | 拿不到正文里匹配的那句话；`body` 字段本身取不回（S10） |
| 返回字段 | `bibcode,title,author,year,pub,citation_count,doi,abstract,score` | 没有 `doctype`、`property`（是否 refereed）、`identifier`/`alternate_bibcode`（arXiv 版和发表版的对应） |
| 集合内外 | 不知道 library | 每个查询的结果都要另外和 33 个 bibcode 比对；把 33 个 bibcode 写进 `q` 占 831 字符，文档上限是 1000 |
| bigquery | 没有 | 大于几十篇的 bibcode 集合，文档给的做法是 `/search/bigquery`（S10） |
| 重试 | 没有；超时 30 秒 | 本次遇到连接超时 2 次、504 一次，慢查询 16–17 秒 |
| 解析结果 | 不发 `debugQuery` | `NBODY6` 被当成缩写这类情况，只有看 `parsedquery` 才知道 |
| 配额 | 不输出 `x-ratelimit-remaining` | |
| 文档 | `SKILL.md` 只列了 `author:`、`first_author:`、`abs:`、`title:`、`year:`、`property:refereed` | 没提 `body:`、`full:`、`citations()`、`references()`，也没提大写词按缩写匹配 |

## 5. 样本想法实测

样本想法（用户原话）：比较 N-body 模拟里 tidal tail 的三种处理方式对 tail 动力学的影响：tail 单独积分（Nbody6）、tail 粒子和星团成员一起积分（Nbody6）、一起积分但 tail 与星团的相互作用用 tree code（PeTar）。

### 5.1 查询

`LIB` 指集合内 33 个 bibcode 的 OR 表达式；`NB` 指 `bibcode:(1999PASP..111.1333A OR 2003gnbs.book.....A OR 2012MNRAS.424..545N OR 2015MNRAS.450.4070W OR 2012MNRAS.422..841A)`（NBODY6/7 系列的代码论文）；`PT` 指 `bibcode:2020MNRAS.497..536W`（PeTar 论文）。

| 编号 | 查询 | numFound | 集合外 |
|---|---|---|---|
| A1 | `abs:("tidal tail" OR "tidal tails") abs:(PeTar)` | 8 | 7 |
| A2 | `abs:("tidal tail" OR "tidal tails") abs:(nbody6 OR nbody7 OR nbody4 OR "nbody6++gpu")` | 5 | 5 |
| A3 | `abs:(tail 类词) abs:(星团类词) abs:("direct N-body" OR "N-body code" OR "tree code" OR treecode OR "collisional") abs:(comparison OR compare OR compared OR "different codes" OR method OR algorithm)` | 47 | 45 |
| A4 | `abs:("tidal tail" OR "tidal tails") abs:(星团类词) abs:("N-body") abs:("numerical treatment" OR "numerical methods" OR convergence OR "code comparison" OR "integration scheme" OR "force calculation" OR softening …)` | 11 | 3 |
| A5 | `title:("tidal tail" OR "tidal tails" OR "tidal stream" OR "tidal debris") title:(numerical OR code OR codes OR comparison OR method OR algorithm OR "N-body")`，`fq=database:astronomy` | 22 | 20 |
| B3 | `body:petar body:nbody6 body:"tidal tail"` | 10 | 8 |
| B4 | `body:"tidal tail" body:"integrated separately"` | 14 | 14 |
| B5 | `body:"tail members" (body:nbody6 OR body:"nbody 6" OR abs:nbody6)` | 7 | 2 |
| B6 | `body:"tidal tail" body:(escapers NEAR5 integrated) (body:nbody6 OR body:"nbody 6" OR abs:nbody6)` | 14 | 13 |
| B7 | `abs:(tail 类词) body:("tree code" OR "barnes-hut" OR treecode) body:("direct n-body" OR "direct summation") abs:(星团类词) abs:("N-body")` | 104 | 前 60 条里 54 |
| C1 | `citations(PT) citations(NB) abs:("tidal tail" OR "tidal stream" OR "stellar stream" OR escapers OR "tidal debris" OR "extra-tidal")` | 31 | 27 |
| C2 | `citations(PT) full:"tidal tail"` | 38 | 31 |
| C3 | `citations(PT) citations(NB) abs:(comparison OR compare OR compared OR benchmark OR agreement OR reliability OR accuracy)` | 32 | 31 |
| D1 | `similar("样本想法的一段英文改写", input)` | 排序 | 前 25 条里 14 |
| D2 | `similar(bibcode:(集合内 8 篇模拟论文))` | 排序 | 前 40 条里 36 |
| E1 | `citations(LIB) -LIB abs:("N-body" OR nbody6 OR petar OR "direct summation" OR "tree code") abs:(tail 类词)` | 22 | 22 |
| F1 | `abs:("direct N-body" OR "direct summation" OR nbody6 OR "Hermite") abs:("tree code" OR treecode OR "P3T" OR "particle-tree" OR "tree-direct" OR petar OR "Barnes-Hut") abs:(星团类词) abs:(comparison OR compare OR compared OR agreement OR benchmark OR accuracy)` | 119 | 前 60 条里 60 |
| G1 | `reviews(abs:"tidal tails" abs:"star cluster" abs:"N-body")` | 排序 | 前 15 条里 10 |

表里的「tail 类词」「星团类词」是缩写，各查询用的词略有不同：A3 是 `("tidal tail" OR "tidal tails" OR "tidal debris" OR "tidal stream")` 和 `("star cluster" OR "open cluster" OR "globular cluster")`；B7 的 tail 类词多了 `"stellar stream"` 和 `escapers`；E1 是 `("tidal tail" OR "tidal stream" OR escapers OR "tidal debris")`；F1 的星团类词多了 `"star clusters"`。

基数：`citations(PT)` 172；`citations(NB)` 1260；`citations(PT) citations(NB)` 70；`citations(LIB)` 597。

### 5.2 查到的集合外工作

下表每篇的「做了什么」只来自我读到的 ADS 摘要（或标出的高亮片段），没有读正文。

| Bibcode | 标题 | 摘要里说的 | 哪个查询查到 |
|---|---|---|---|
| `2021arXiv210410843W` | On the reliability of simulations of collisional stellar systems | 用 PeTar，改变长程和短程相互作用的精度参数，看 escapers 和结构演化怎么变 | C1, C3 |
| `2026arXiv260213385C` | Modeling Globular Cluster Stellar Streams with a Basis-Expansion N-body Code | KRIOS 复现 NBODY6++GPU 的星团模型及其 stream，并和 particle spray 对比 | B6, B7, E1, F1, G1 |
| `2020MNRAS.497..536W` | PETAR: a high-performance N-body code for modelling massive collisional stellar systems | PeTar 代码论文；benchmark 显示 PeTar 与 NBODY6++GPU 在长期演化上吻合 | B7, F1 |
| `2022MNRAS.509.2075A` | Accelerating NBODY6 with a graphics processing unit-enabled Particle-Particle Particle-Tree scheme | 把 NBODY6 的远距离力换成 GPU Barnes-Hut tree，和原版 NBODY6 比能量守恒与速度 | C3, F1 |
| `2015MNRAS.448.3416R` | A flexible method to evolve collisional systems and their tidal debris in external potentials | 在 NBODY6 里实现的方法，在任意外势里演化星团及其 tidal tails | A2, A3, A5 |
| `2020A&A...640A..85D` | Tidal tails of open star clusters as probes to early gas expulsion. II. Predictions for Gaia | 用 NBODY6 把 tidal tail 和星团一起从嵌埋期积分 300 Myr | A2, A3, E1, F1 |
| `2024ApJ...967...42W` | Stellar Escape from Globular Clusters. II. Clusters May Eat Their Own Tails | 首次用轨道平均的 Monte Carlo 模拟研究 tail 形成，把 potential escapers 当作无碰撞粒子处理 | A3, B6, B7, E1, G1 |
| `2025ApJS..276...32C` | Improved Particle Spray Algorithm for Modeling Globular Cluster Streams | 用 N-body 模拟标定 particle spray 算法 | C1, C3 |
| `2017MNRAS.466.1741C` | The contribution of dissolving star clusters to the population of ultra faint objects in the outer halo of the Milky Way | 摘要是别的题目；正文高亮片段：「Escapers were not removed from the simulations to allow stars to move from the tidal tails back into the region of the cluster」 | B4（只靠正文短语） |

其它反复出现的集合外论文，主题相邻，摘要里没有 tail 处理方式的对比：

- 读了摘要的：`2021A&A...655A..71W`（PeTar 模拟 Hyades 类星团及其 tidal stream；A1, A3, C1, C2, C3, E1）、`2026ApJ..1002...37Z`（PeTar 模拟 Hyades stream；A1, A3, A4, B7, C1, C2, C3, E1, F1）、`2026arXiv260531439K`（疏散星团 tail 对银河系势的敏感性；D1）、`2009MNRAS.392..969J`（tail 里的 clump；B7）、`2007ApJ...659.1212M`（球状星团 tail 的 N-body 模拟；B7）、`2022MNRAS.511.4060K`（NBODY6++GPU 与 MOCCA 的对比，不涉及 tail；B3, C1, C2, C3, F1）、`2026ApJ...998..233W`（PeTar 里 P3T 切换判据对能量守恒和双星演化的影响；C3, F1）。
- 只看了标题的：`2026ApJ..1007..132H`（A1, A3, B7, C2, E1, F1）、`2020A&A...640A..84D`（A2, B5, B6, D1）、`2010MNRAS.401..105K`（D1）。

### 5.3 实测结果

- 上面 18 个查询的结果里，没有一篇的标题或摘要声明比较了 tail 粒子的不同处理方式（单独积分、与成员一起积分、tree code）。
- 最直接表达这个想法的两个查询 A4 和 A5，集合外结果里没有相关的：A4 集合外 3 条是 `2026ApJ..1002...37Z` 和两篇会议摘要；A5 的 20 条里和星团 tail 的数值模拟有关的是 `2015MNRAS.448.3416R`、`2010MNRAS.402.1841C`、`2008IAUS..246..189F`、`2025DDA....5630101C`，标题里都没有处理方式的比较。
- 查到的 9 篇每篇只覆盖想法的一部分：有的比较代码但不看 tail，有的看 tail 但只用一种处理方式。
- 我没有读这 9 篇的正文，所以它们的正文里有没有做过这类比较，这次没有确定。

## 6. 「没查到」有多可信

### 6.1 文档里写的会漏的情况

- 没有全文的记录，`body:` 和 `full:` 的正文部分查不到。（S6：「not all records with source links have searchable full text」）
- 刚出的论文：arXiv 每天入库且可能再晚一天，期刊每周。（S6, S7）
- arXiv 记录的参考文献抽取不一定成功，所以 `citations()` 可能漏掉只有 arXiv 版的引用者。（S6, S7）
- 全大写的检索词只匹配缩写形式。（S1）
- `useful`、`reviews`、`trending` 只看内层查询的前 200 条。（S12）

### 6.2 实测到的会漏的情况

- 全文抽取把小型大写的代码名拆成几个词：集合内 PeTar 5 篇中 2 篇、NBODY6 9 篇中 2 篇因此查不到（3.3）。
- 大写写法只匹配一半：`body:NBODY6` 370 对 `body:nbody6` 721（3.3）。
- 引用了代码论文的论文里，20% 用代码名在正文里查不到：163 篇中 33 篇（3.3）。
- 会议文集没有全文：集合内 `2023fscp.conf...11K`（3.3）。2015–2026 的天文 refereed 记录里 14% 没有全文（3.3）。
- 方法细节只在正文，而且要猜中措辞：`2017MNRAS.466.1741C` 只被 `body:"integrated separately"` 这个短语查到，A、C、E、F 各组查询都没查到它。
- 摘要级查询对代码名很弱：A1 只有 8 条，而 `citations(PT) full:"tidal tail"` 有 38 条。
- 同义词扩展和常见词带来大量无关结果：`body:"tidal tail" body:"integrated separately"` 的 14 条里只有 `2017MNRAS.466.1741C` 一条讲的是星团 N-body 里怎么处理粒子，其余是星系、HI、中子星并合等；`body:petar` 14,781 条。
- `similar()` 给的是主题相近，不是方法相同（3.3）。
- 服务本身会失败：`trending()` 504，偶发连接超时（3.3）。失败和「0 条」不是一回事。

### 6.3 实测到的能查到的情况

- 摘要里写明了的对比能查到：F1 的第 1 条就是 `2020MNRAS.497..536W`（摘要里写了和 NBODY6++GPU 吻合）。
- 用两篇代码论文的引用交集能把「同时用到或提到两个代码」的论文圈到几十篇：`citations(PT) citations(NB)` 是 70 篇，再加 tail 类词是 31 篇，一次请求就能全部取回。
- 引用图不受分词影响：`2025A&A...704A.167S` 用 `body:petar` 查不到，但在 C1 里（它引用了 PeTar 论文）。

## 7. 推断

以下是我的推断，不是文档或实测本身。

- 一个否定结果的含义是「在 ADS 已索引的摘要和正文里，用这些措辞和这些引用锚点没查到」。它对「摘要里明说做了这件事」的情况比较强，对「正文某一节顺带做了」的情况弱。
- 以代码或方法论文为锚点的 `citations()` 交集，比用代码名做 `body:` 检索更不容易漏，因为它绕开了 6.2 的前三条；代价是锚点得先找对，而且漏掉没引用代码论文的工作。
- 实测的漏检率（PeTar 2/5、NBODY6 2/9、引用者 33/163）样本小，且只针对这两个代码名；别的术语的漏检率这次没有数据。A&A 的小型大写排版看起来是主要原因，但我只在 4 篇上确认了拆词的具体形式。
- ADS 查不到的东西有一类根本不在 ADS 里：代码手册和源码注释里的做法（NBODY6 怎样处理 tail 粒子这件事本身就可能只写在代码文档里）、没写成论文的组内测试、审稿中的工作。这一条没有做实验验证。
- 第 5 节「没有查到完整做过样本想法的论文」加上 6.2 的漏检机制，支持的说法是「没有找到证据说有人做过」，不支持「没有人做过」。

## 8. 没能确定的

- 线上帮助页和仓库源文件是否一致（线上页面抓不下来）。
- 高亮为什么对有的记录返回空、为什么 `bibcode:` 写进 `q` 就返回空：文档没写，只有 `"filtered": "true"` 这个线索。
- bigquery 的每日 100 次限额和 2000 个 bibcode 上限：只有文档，没有实际调用。
- 504 和超时的请求算不算配额：没有对照。
- 文档写的 `q` 1000 字符上限实际在多长时生效：只试到 1531 字符仍被接受。
- 查到的 9 篇相邻工作的正文里有没有比较过 tail 的处理方式：没读正文。
- `citations()` 对 2026 年只有 arXiv 版的论文漏了多少：没有可对照的真值。
