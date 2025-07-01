class Demo{
    constructor() {
        this.chart = document.querySelector('vis-muvin')

    }

    async init(key) {
        const _this = this;
        let eventSource;   

        this.nodesLabels = await this.fetchNodesLabels()
        
        d3.select("#nodes-input")
            .on('keydown', () => eventSource = d3.event.key ? 'key' : 'list')
            .on('input', function() {
                if (eventSource === 'key') {
                    if (this.value.length > 2) 
                        _this.updateAutocomplete(this.value.toLowerCase())
                } 
            })

        d3.select("#search-go")
            .on('click', () => {
                let value = d3.select("#nodes-input").node().value
                this.loadData(value)
            })

        d3.select('#clear-cache').on('click', async () => await this.handleClearCache())

        this.chart.sparqlQuery = locals?.query
        this.chart.sparqlEndpoint = locals?.endpoint
        this.chart.sparqlProxy = locals?.proxy
        
        let values;
        if (locals?.value) {
            values = this.extractValues(locals?.value, locals?.type)
        }

        if (values && !this.isStored(values)) {
            sessionStorage.setItem("values", JSON.stringify(values))
        }

        this.setWelcomeMessage()
        
        await this.restoreSession()
    }

    isStored(values) {
        let stored = sessionStorage.getItem("values")
        return values.length === stored.length && new Set(values).size === new Set([...values, ...stored]).size;
    }

    async restoreSession() {
        let values = sessionStorage.getItem("values")
        
        if (values) this.displayMuvin(JSON.parse(values))
    }

    storeValue(value) {
        let values = JSON.parse(sessionStorage.getItem("values")) || []
        values.push(value)
        sessionStorage.setItem("values", JSON.stringify(values)) 
    }

    async fetchNodesLabels() {
        const response = await fetch(`/muvin/${locals?.app}/data/nodes`)
        return await response.json()
    }

    async handleClearCache() {
       
        try {
            let res =  await fetch(`/muvin/clearcache/${locals?.app}`, { 
                method: 'POST',
                headers: {"Content-Type": "application/json"}
            })

            if (res.status === 200)
                Swal.fire({
                    toast: true,               // Enable toast mode
                    position: 'top-end',       // Position the toast in the top right corner
                    icon: 'success',           // Type of icon (success, error, info, warning)
                    title: 'Cache cleared', // Title of the toast
                    showConfirmButton: false,  // Hide the confirm button
                    timer: 3000,               // Duration in milliseconds (3000ms = 3 seconds)
                    timerProgressBar: true,    // Show a progress bar indicating the timer
                    didOpen: (toast) => {
                        toast.addEventListener('mouseenter', Swal.stopTimer); // Pause the timer on hover
                        toast.addEventListener('mouseleave', Swal.resumeTimer); // Resume the timer when the mouse leaves
                    }
                })
            

        } catch (e) {
            alert(`An error occurred: ${e.message}. Please try again later.`)
        }
    }

    loadData(value) {
        let node;
        if (this.chart.app === 'crobora') {
            let datalist = d3.select('#nodes-list')
            let option = datalist.selectAll('option').filter(function() { return this.value === value })
            if (option.size()) node = option.datum()
        } else 
            node = this.getNode(value.trim())
        
        if (node) {
            if (!this.isVisDisplayed) this.displayMuvin([node])
            else this.chart.launch([node])
        }
        else {
            alert('You must choose an option from the list.')
            return
        }

        this.clear()
        this.storeValue({ value:value })
    }

    clear() {
        document.querySelector('#nodes-input').value = ""
    }

    getNode(value) {
        return this.nodesLabels.find(d => d.value === value)
    }

  
    updateAutocomplete(value) {

        let labels = this.getMatchingLabels(value)
 
        d3.select('#nodes-list')
            .selectAll('option')
            .data(labels)
            .join(
                enter => enter.append('option'),
                update => update,
                exit => exit.remove()
            ).attr('value', e =>  `${e.value} ${e.type ? '(' + e.type + ')' : ''}`)
    }

    getMatchingLabels(value) {
        let labels = this.nodesLabels.filter(d => d.value.toLowerCase().includes(value))
        labels.sort( (a,b) => a.value.localeCompare(b.value))

        return labels
    }

    toggleVisualization() {
        const visDiv = document.querySelector('#visualization');
        visDiv.style.display = visDiv.style.display === 'none' ? 'block' : 'none';

        document.querySelector(".welcome-text").style.display = visDiv.style.display === "block" ? "none" : "block"

        this.isVisDisplayed = visDiv.style.display === 'block'
    }

    displayMuvin(values) {
        this.toggleVisualization()
        this.chart.launch(values)
    }

    extractValues(value, type) {
        if (!value) return
        let values = []
        value.forEach( (d,i) => {
            let v = { value: d.trim() }
            if (type)
                v.type = type[i].trim()

            values.push(v)
        })
        return values
    }

    setWelcomeMessage() {
        function escapeHtml(text) {
            return text
              .replace(/&/g, "&amp;")  // escape & first
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;");
          }
          
        const safeQuery = escapeHtml(locals.query)


        let appNodes = {'hal': 'author', 'wasabi': 'artist', 'crobora': 'keyword'}

        let welcomeMessage = `<div class="welcome-message">
                <h3 style="text-align:center;">Welcome to <b>Muvin</b>.</h3><br>`

        if (locals.app === "preview" && !locals.query)
            welcomeMessage +=  `<p>This page requires a SPARQL query and endpoint as parameter. Use it via <a href="https://dataviz.i3s.unice.fr/ldviz/">LDViz.</p>`
        else if (locals.app !== "preview")
            welcomeMessage += `<p style='text-align:center'><strong>Welcome!</strong> Start by searching for a <strong>${appNodes[locals.app]}</strong> to explore its connections.</p><br>
                <p>Data used in this demo comes from the following source:</p><br>
                <p><strong>SPARQL Endpoint:</strong> <code>${locals.endpoint}</code></p> <br>

                <p><strong>SPARQL Query:</strong></p>
                <pre><code class="sparql">
                    ${safeQuery}
                </code></pre>`

        welcomeMessage += `</div>`

        document.querySelector('.welcome-text').innerHTML = welcomeMessage
    }
    
}