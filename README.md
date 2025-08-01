# Muvin

A repository dedicated to Muvin, a visualization tool for exploring time-varying networks, specially represented through knowledge graphs. 

## Overview

Muvin is particularly tailored to support exploration of SPARQL JSON results. Its main features are:

- Web component built with modern JavaScript
- Supports flexible visual encodings, inspired by VEGA-Lite grammar of graphics.
- SPARQL query integration
- Easily embeddable in other web apps
- Demo included to test configurations

## Web Component

Muvin is published as a NPM package, available [here](https://www.npmjs.com/package/muvin).

See the [Web Component](web-component) repository.

## Live Demo

Try the demo [here](http://dataviz.i3s.unice.fr/muvin/hal)

Or run it locally:

1. Clone the repository
```bash
git clone https://github.com/Wimmics/muvin.git
cd muvin
```

2. Build the web component :
```bash
cd web-component
npm install
npm run build
```

3. Define the environment variables below in a `.env` file

```bash
APP_HAL_QUERY=queries/hal.rq
APP_HAL_NODES=queries/halNodes.rq
APP_HAL_ENDPOINT=http://sparql.archives-ouvertes.fr/sparql
APP_HAL_ENCODING=encoding/hal.json
```

4. Run the demo:
```bash
cd demo
npm install
npm start
```

5. Enjoy at `http://localhost:8020/muvin/hal`

Check the code in the [Demo](demo) repository.


## License

See the [LICENSE](LICENSE) file.

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
