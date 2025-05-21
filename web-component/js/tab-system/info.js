class InfoPanel {
    constructor(chart) {
        this.chart = chart
    }

    update() {
        let infoContent = this.chart.shadowRoot.querySelector("#info");
        let stats = this.chart.data.getStats()
        infoContent.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 1rem;">
            <div>
            <p><strong>Stats</strong></p>
            <table border="1" style="border-collapse: collapse;">
                <thead>
                <tr>
                    <th>Nodes</th>
                    <th>Items</th>
                    <th>Links</th>
                </tr>
                </thead>
                <tbody>
                <tr>
                    <td>${stats.nodes}</td>
                    <td>${stats.items}</td>
                    <td>${stats.links}</td>
                </tr>
                </tbody>
            </table>
            </div>
            <div>
                <p><strong>Data Source</strong></p>
                <p><strong>SPARQL Endpoint:</strong> ${this.chart.sparqlEndpoint}</p>
                <p><strong>SPARQL Proxy:</strong> ${this.chart.sparqlProxy}</p>
                <p>
                <strong>SPARQL Query:</strong>
                <a
                    href="data:text/plain;charset=utf-8,${encodeURIComponent(this.chart.sparqlQuery)}"
                    download="query.rq"> Download query.rq </a>
                </p>
            </div>
    
        </div>
        `;
    }
}

export default InfoPanel