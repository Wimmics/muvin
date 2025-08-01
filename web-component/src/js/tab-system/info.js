class InfoPanel {
    constructor(chart) {
        this.chart = chart
    }

    update() {
        let infoContent = this.chart.shadowRoot.querySelector("#info");
        let stats = this.chart.data.getStats()
        infoContent.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 20px;">
            
            <div>
                <p><strong>Data Source</strong></p>
                <table border="1" cellpadding="6">
                    <thead>
                        <tr>
                        <th>SPARQL Endpoint</th>
                        <th>SPARQL Proxy</th>
                        <th>SPARQL Query</th>
                        <th>SPARQL Results</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                        <td>${this.chart.sparqlEndpoint ?? 'Not provided'}</td>
                        <td>${this.chart.sparqlProxy ?? 'Not provided'}</td>
                        <td>
                            ${this.chart.sparqlQuery
                            ? `<a href="data:text/plain;charset=utf-8,${encodeURIComponent(this.chart.sparqlQuery)}" download="query.rq">Download query.rq</a>`
                            : 'Not provided'}
                        </td>
                        <td>
                            ${this.chart.sparqlResults
                            ? `<a href="data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(this.chart.sparqlResults, null, 2))}" download="sparql-results.json">
                                Download sparql-results.json
                                </a>`
                            : 'Not provided'}
                        </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div>
            <p><strong>Network Stats</strong></p>
            <table border="1" style="border-collapse: collapse;">
                <thead>
                <tr>
                    <th>Nodes</th>
                    <th>Events</th>
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
    
        </div>
        `;
    }
}

export default InfoPanel