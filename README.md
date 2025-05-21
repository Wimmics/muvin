# Muvin

**Muvin** is a web component for visualizing egocentric networks over time. It works with data retrieved via SPARQL queries or precomputed SPARQL results.

---

## 📦 Installation

```bash
npm install muvin
```

---

## 🚀 Usage

### In Vanilla JavaScript

```html
<vis-muvin height="100vh" width="100vw" id="muvin"></vis-muvin>

<script type="module">
  import 'muvin';

  const muvin = document.querySelector("#muvin");
  muvin.sparqlQuery = `SELECT * WHERE { ?s ?p ?o }`;
  muvin.sparqlEndpoint = "https://your-sparql-endpoint.org/sparql";

  muvin.appendDataFromQuery([{ value: "YourValueHere" }]);
</script>
```

---

### In React

```jsx
import 'muvin';
import { useEffect } from 'react';

export default function MuvinComponent() {
  useEffect(() => {
    const muvin = document.querySelector("#muvin");
    if (muvin) {
      muvin.sparqlQuery = `SELECT * WHERE { ?s ?p ?o }`;
      muvin.sparqlEndpoint = "https://your-sparql-endpoint.org/sparql";
      muvin.appendDataFromQuery([{ value: "YourValueHere" }]);
    }
  }, []);

  return <vis-muvin height="100vh" width="100vw" id="muvin"></vis-muvin>;
}
```

---

### In Angular

Update `angular.json`:

```json
"assets": [
  {
    "glob": "**/*",
    "input": "node_modules/muvin/",
    "output": "/assets/muvin/"
  }
]
```

Component:

```ts
import { Component, AfterViewInit } from '@angular/core';
import 'muvin';

@Component({
  selector: 'app-muvin',
  template: '<vis-muvin height="100vh" width="100vw" id="muvin"></vis-muvin>',
})
export class MuvinComponent implements AfterViewInit {
  ngAfterViewInit() {
    const muvin = document.querySelector('#muvin') as any;
    muvin.sparqlQuery = `SELECT * WHERE { ?s ?p ?o }`;
    muvin.sparqlEndpoint = 'https://your-sparql-endpoint.org/sparql';
    muvin.appendDataFromQuery([{ value: 'YourValueHere' }]);
  }
}
```

---

## 🔍 Knowledge Graph Exploration with Muvin

Muvin works with:

- A SPARQL query (with a `$ego` placeholder)
- Or precomputed SPARQL result objects

### Required Variables in the Query

| Variable  | Description                                  |
|-----------|----------------------------------------------|
| `?uri`    | Unique ID of the item                        |
| `?title`  | Label for tooltips and filters               |
| `?date`   | Year or date (`YYYY` or `YYYY-MM-DD`, etc.) |
| `?type`   | Category (max 7 unique values for coloring)  |
| `?link`   | URL for more info                            |
| `?ego`    | The main entity being explored               |
| `?alter`  | Related node identifier                      |

### Example SPARQL Query Template

```sparql
SELECT DISTINCT ?uri ?title ?date ?type ?link ?ego ?alter WHERE {
  BIND ("$ego" AS ?ego)
  # Your custom graph pattern here
}
```

---

## ⚙️ Component Attributes

- `sparqlQuery`: the query to run (must include `$ego`)
- `sparqlEndpoint`: the URL of the SPARQL endpoint
- `sparqlProxy`: optional proxy for CORS or caching

---

## 🛠 Methods

### `appendDataFromQuery(values)`

Runs the `sparqlQuery` for each given `$ego`.

```js
muvin.appendDataFromQuery([
  { value: "http://example.org/person1" },
  { value: "http://example.org/person2" }
]);
```

### `loadSparqlResults(values, results)`

Use precomputed query results.

```js
muvin.loadSparqlResults(
  [{ value: "http://example.org/person1" }],
  [[
    {
        "uri":   { "type": "uri", "value": "http://example.org/item1" },
        "title": { "type": "literal", "value": "Item Title" },
        "date":  { "type": "literal", "value": "2020" },
        "type":  { "type": "literal", "value": "Book" },
        "link":  { "type": "uri", "value": "http://example.org/item1" },
        "ego":   { "type": "uri", "value": "http://example.org/person1" },
        "alter": { "type": "uri", "value": "http://example.org/person2" }
      }
  ]]
);
```

---

## 🌐 Online Demo

Explore a live version:  
👉 [https://dataviz.i3s.unice.fr/muvin/](https://dataviz.i3s.unice.fr/muvin/)

---

## 🧠 Source Code

GitHub: [https://github.com/Wimmics/muvin](https://github.com/Wimmics/muvin)

---

## 📝 Citation

> Aline Menin, Michel Buffa, Maroua Tikat, Benjamin Molinet, Guillaume Pelerin, et al.  
> *Incremental and multimodal visualization of discographies: exploring the WASABI music knowledge base*.  
> WAC 2022 - Web Audio Conference 2022, Jul 2022, Cannes, France.  
> DOI: [10.5281/zenodo.6767530](https://dx.doi.org/10.5281/zenodo.6767530)  
> HAL: [hal-03748134](https://hal.science/hal-03748134v1)

---

## 📄 License

Licensed under the [Apache 2.0 License](LICENSE).