import fetch from 'node-fetch'
import { Transform } from './transform.js'

export class CroboraTransform extends Transform {
    constructor(app, data) {
        super(app, data)
    }

    async fetchItems() {
        const params = {
            keywords: [this.data.node.name],
            categories: [this.data.node.type],
            options: ["illustration", "location", "celebrity", "event"]
        }

        try {
            const response = await fetch("https://crobora.huma-num.fr/crobora-api/search/imagesOR", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(params)
            })

            if (!response.ok) {
                console.error(`Failed to fetch items: ${response.statusText}`)
                return response
            }

            const json = await response.json()
            this.values = await this.clean(json)

        } catch (error) {
            console.error(`Fetch failed: ${error}`)
            return `Fetch failed: ${error}`
        }
    }

    async getNodeLabels() {
        const data = []

        for (const query of this.nodesQuery) {
            try {
                const res = await fetch(query, {
                    method: 'GET',
                    headers: { 'Accept': "application/sparql-results+json" }
                })

                if (!res.ok) {
                    console.warn(`Request to ${query} failed with status: ${res.status}`)
                    continue
                }

                const json = await res.json()
                data.push(...json)

            } catch (err) {
                console.error(`Error fetching ${query}:`, err)
            }
        }

        return data
    }

    async clean(rawData) {
        const records = rawData?.map(d => d.records)?.flat() ?? []
        const categories = ['event', 'location', 'illustration', 'celebrity']
        const values = []

        for (const d of records) {
            const alters = []

            for (const category of categories) {
                for (const name of d[category] ?? []) {
                    alters.push({ name, nature: category })
                }
            }

            for (const alter of alters) {
                values.push({
                    uri: { value: d._id },
                    ego: { value: this.data.node.name },
                    egoNature: { value: this.data.node.type },
                    type: { value: d.channel?.toLowerCase() ?? 'unknown' },
                    title: { value: d.image_title },
                    date: { value: d.day_airing },
                    link: { value: `https://crobora.huma-num.fr/crobora/document/${d.ID_document}` },
                    alter: { value: alter.name },
                    alterNature: { value: alter.nature },
                    parentName: { value: d.document_title },
                    parentId: { value: d.ID_document }
                })
            }
        }

        return values
    }
}

// Example usage (commented out):
// const transform = new CroboraTransform('crobora', { node: { name: 'Angela Merkel', type: 'celebrity' } })
// transform.fetchItems()

export default CroboraTransform
