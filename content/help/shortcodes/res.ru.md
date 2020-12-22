---
title: res
description: Микрокод для получения ссылки на ресурс
authors:
  - toby3d
---
Данный микрокод возвращает ссылку на ресурс страницы по его имени.

```markdown
---
title: Мои творения
resources:
  - src: style-guide.pdf
    name: book
  - src: monitor.mp3
    name: music
---

* [Книга в формате PDF]({{</* res "book" */>}})
* [Черновая композиция]({{</* res "music" */>}})
```

Результатом работы микрокода станет следующее:

```html
<ul>
  <li><a href="/my-stuff/style-guide.pdf">Книга в формате PDF</a></li>
  <li><a href="/my-stuff/monitor.mp3">Черновая композиция</a></li>
</ul>
```
