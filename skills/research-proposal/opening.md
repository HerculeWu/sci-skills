# Opening a paper
One subagent per paper reads the paper against the checklist agreed in step 1 and reports the paper's stance on each element.

## Brief for the subagent
- The checklist: the goal, the object, the levers and the quantities, each element with its id from the comparison table. Two elements are always added:
  - **K**: what the paper says about constraints on, or warnings for, this kind of run;
  - **S**: the scatter or effect sizes it reports that could serve as a yardstick.
- The paper's key, its canvas (the path in the library's link list), and the path of its full text or "none".

The subagent reads the whole canvas, and the full text where there is one. Cards come first, since the proposal cites them: a card is named `` `<paper key>:<card id>` ``, the id in the paper's canvas prefixed by its key, which is its id in the library.

## The full text
Two things are checked against it before they are reported:
- **A silence.** "Not in any card" may only mean the reader left it out. Search the full text before reporting 没说; without a full text, report 没有卡片提到 instead. A false 没说 sends the user to collaborators with a gap that does not exist.
- **A reader's inference.** Where the stance rests on a Warrant marked `(implicit)` or another inference, check the text and say whether it bears the inference out.

## Report
Returned as the subagent's reply, in the user's language:

```markdown
# <paper key>
全文：有 | 无

| 要素 | 态度 | 卡片 | 原文 |
|---|---|---|---|
| T | 确立 | `Gieles2021:A_setup` | "escapers are removed and integrated as tracers" |
| K | … | … | … |
| S | … | … | … |

## 其他观察
- one line each, with card ids
```

One row per element, with one stance:

| Stance | Meaning |
|---|---|
| 确立 | the paper argues it, on its own Grounds |
| 假定 | the paper relies on it without arguing it |
| 争议 | the paper argues against it, or reports results that conflict |
| 没说 | the full text, searched, does not address it |
| 没有卡片提到 | no full text, and no card addresses it |
| — | the element does not apply to this paper |

Add **(读者推断)** to a stance that rests on an inference, with what the full text showed. **其他观察** holds silences and conflicts the subagent noticed outside the checklist; it may be empty.
