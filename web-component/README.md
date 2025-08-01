# Muvin

**Muvin** is a web component for visualizing egocentric networks over time. It works with data retrieved via SPARQL queries or precomputed SPARQL results.

## Installation

```bash
npm install muvin
```

## Usage

1. Import the `vis-muvin.js` file into your web page.
```html
<script type='module' src='/path/to/vis-muvin.js'>
```
2. Define the HTML element holding the visualization, using the `<vis-muvin>` tag as shown below.

```html
<vis-muvin height="100vh" width="100vw" id="muvin"></vis-muvin>
```
3. Configure the component using Javascript. The configuration varies slightly depending on the input information. Check the [Data Configuration](#data-configuration) below.

```js
// 1. Select the component from your web page
const muvin = document.querySelector("#muvin");

// 2. Configure the component (see options below)

// 3. Launch it with one or multiple values for which start the exploration (the ego in the ego-network)
muvin.launch(['value1', 'value2']);
```

## Data Configuration

### SPARQL query and SPARQL endpoint

```js
muvin.sparqlQuery = "SELECT * WHERE { ?s ?p ?o }"
muvin.sparqlEndpoint = "https://your-sparql-endpoint.org/sparql"
```

### Proxy

In certain cases, the SPARQL endpoint does not support CORS requests,. In that case, you can provide a proxy that accepts the `endpoint` and `query` as parameters to perform the query from the server side. The proxy URL should follow a pattern like the one below:

```
http://<your-proxy-route>?endpoint=<sparql-endpoint>&query=<sparql-query>
```
Then, assign it to the component:

```js
muvin.sparqlProxy = "http://<your-proxy-route>"
```

### SPARQL Results

You can visualize the results of a SPARQL query. Muvin supports SPARQL JSON results, such as the example below. For more information, see the [W3C Documentation](https://www.w3.org/TR/sparql11-results-json/).

```js
muvin.sparqlResults = {
  "head": { "vars": [ "book" , "title" ]
  } ,
  "results": { 
    "bindings": [
      {
        "book": { "type": "uri" , "value": "http://example.org/book/book6" } ,
        "title": { "type": "literal" , "value": "Harry Potter and the Half-Blood Prince" }
      } ,
      {
        "book": { "type": "uri" , "value": "http://example.org/book/book7" } ,
        "title": { "type": "literal" , "value": "Harry Potter and the Deathly Hallows" }
      } ,
      {
        "book": { "type": "uri" , "value": "http://example.org/book/book5" } ,
        "title": { "type": "literal" , "value": "Harry Potter and the Order of the Phoenix" }
      } ,
      {
        "book": { "type": "uri" , "value": "http://example.org/book/book4" } ,
        "title": { "type": "literal" , "value": "Harry Potter and the Goblet of Fire" }
      } ,
      {
        "book": { "type": "uri" , "value": "http://example.org/book/book2" } ,
        "title": { "type": "literal" , "value": "Harry Potter and the Chamber of Secrets" }
      } ,
      {
        "book": { "type": "uri" , "value": "http://example.org/book/book3" } ,
        "title": { "type": "literal" , "value": "Harry Potter and the Prisoner Of Azkaban" }
      } ,
      {
        "book": { "type": "uri" , "value": "http://example.org/book/book1" } ,
        "title": { "type": "literal" , "value": "Harry Potter and the Philosopher's Stone" }
      }
    ]
  }
}
```

## Visual Encoding System

Inspired by the [VEGA-Lite grammar of graphics](https://vega.github.io/vega-lite/), we designed a visual encoding system that lets you specify how data fields are mapped to visual properties such as position, color, and size (e.g., the radius of circles). Muvin’s default encoding is illustrated in the example below:

```json
{
  "description": "No description provided",
  "nodes": {
      "field": "ego",
      "label": "Ego"
  },
  "events": {
      "field": "uri",
      "label": "Item",
      "display": true,

      "title": { "field": "title" },
      "browse": { "field": "link" },
  },
  "temporal": {
      "field": "date",
      "label": "Time Unit"
  },
  "color": {
      "field": "type",
      "label": "Link Type",
      "scale": {
          "type": "ordinal",
          "domain": null,
          "range": null
      },
      "legend": {
          "display": true
      }
  },
  "size": {
      "field": null, 
      "label": "Co-occurrence of interaction",
      "scale": {
          "domain": null,
          "range": [3, 15],
          "type": "linear"
      }
  }    
}
```

### `nodes`

Defines the data field used to identify the nodes in the network. In Muvin, these appear on the left of the visualization. For example, nodes may represent authors in a co-authorship network.

---

### `events`

Specifies the events that link nodes over time, forming the dynamic part of the network. For instance, an event could be a publication co-authored by multiple individuals.  
You can also define:

- `title`: a field to label each event (e.g., publication title)
- `browse`: a field with a URL linking to the original source

---

### `temporal`

Indicates the field that represents temporal information. This could be a year, timestamp, or other temporal marker used to sequence events over time.

---

### `color`

Used to map a field to color, especially in the streamgraph that represents the distribution of events. You can configure:

- `field`: which data attribute to use for color
- `scale`: 
  - `type`: `"ordinal"` for categories, or `"quantitative"` for numeric values
  - `domain`: expected input values
  - `range`: output colors (array of color strings or D3 color scheme)

The color legend is toggled with `legend.display`.

> See [d3-scale-chromatic](https://d3js.org/d3-scale-chromatic) for color palette options.

---

### `size`

Determines the radius of circles that represent events on the streamgraph. You can provide:

- `field`: numeric data field for scaling (e.g., citations)
- `scale`: 
  - `type`: `"linear"`, `"log"`, etc.
  - `domain`: min and max of the data
  - `range`: pixel range for radius, e.g. `[3, 15]`

## Online Demo

Explore a live version at [https://dataviz.i3s.unice.fr/muvin/](https://dataviz.i3s.unice.fr/muvin/)

## Source Code

GitHub: [https://github.com/Wimmics/muvin](https://github.com/Wimmics/muvin)

## Cite this work

```bibtex
@inproceedings{menin:hal-03748134,
  TITLE = {{Incremental and multimodal visualization of discographies: exploring the WASABI music knowledge base}},
  AUTHOR = {Menin, Aline and Buffa, Michel and Tikat, Maroua and Molinet, Benjamin and Pelerin, Guillaume and Pottier, Laurent and Michel, Franck and Winckler, Marco},
  URL = {https://hal.science/hal-03748134},
  BOOKTITLE = {{WAC Proceedings 2022}},
  ADDRESS = {Cannes, France},
  SERIES = {WAC Proceedings 2022},
  VOLUME = {2022},
  YEAR = {2022},
  MONTH = Jul,
  DOI = {10.5281/zenodo.6767530},
  KEYWORDS = {Semantic web and learning ; Web audio ; Knowledge bases},
  PDF = {https://hal.science/hal-03748134v1/file/WAC_2022_paper_15.pdf},
  HAL_ID = {hal-03748134},
  HAL_VERSION = {v1},
}
```
