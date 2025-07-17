function wrap(text, width) {
    text.selectAll('tspan').remove()
    let textContent = text.text()
   
    let words = textContent.split(' ').reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        x = text.attr('x'),
        dy = parseFloat(text.attr("dy")) || 0,
        tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");

    while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan")
                .attr("x", x)
                .attr("y", y)
                .attr("dy", ++lineNumber * lineHeight + dy + "em")
                .text(word);
        }
    }
}

function wrap_ellipsis(self, width) {
    let textLength = self.node().getComputedTextLength(),
        text = self.text();

    while (textLength > (width - 3) && text.length > 0) {
        text = text.slice(0, -1);
        self.text(text + '...');
        textLength = self.node().getComputedTextLength();
    }
} 

function showLoading(loadingInfo) {
    const loadingElem = document.getElementById("div-loading")
    loadingElem.style.display = 'block';
    loadingElem.innerHTML = `${loadingInfo} <br><i class="fas fa-spinner fa-spin fa-2x"></i>`;
}

function hideLoading () {
    document.getElementById("div-loading").style.display = 'none';
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function getElementCoords(element, coords) {
    let ctm = element.getCTM()
    let x = ctm.e + coords.x * ctm.a + coords.y * ctm.c;
    let y = ctm.f + coords.x * ctm.b + coords.y * ctm.d;
    return { x: x, y:y }
}

function getTicksDistance(scale, breaks) {
    let scaleRange = scale.range()
    const spaces = []

    for(let i = 0; i < breaks.length; i++){
        let curr = scale(breaks[i]), 
            next = i === breaks.length - 1 ? scaleRange[1] : scale(breaks[i + 1]), 
            prev = i === 0 ? scaleRange[0] : scale(breaks[i - 1]),
            prevStep = curr - prev,
            nextStep = next - curr;
        
        if (i > 0) prevStep *= .5
        if (i < breaks.length - 1) nextStep *= .5

        let p1 = curr + nextStep
        let p2 = curr - prevStep
        spaces.push(p1 - p2)
    }

    return spaces;
}

function getImage(image_title, token) {
  let path = "https://crobora.huma-num.fr/crobora-api/login/images/"
  image_title = encodeURIComponent(image_title)
  return path + image_title + "?token=" + token 
}

function truncateText(selection, width) {
    selection.each(function() {
        const text = d3.select(this);
        let fullText = text.text();
        let truncated = fullText;
        let ellipsis = '...';

        // Start with full text and remove characters until it fits
        while (truncated.length > 0 && text.node().getComputedTextLength() > width) {
            truncated = truncated.slice(0, -1);
            text.text(truncated + ellipsis);
        }

        // Edge case: even the ellipsis doesn't fit
        if (text.node().getComputedTextLength() > width && truncated.length === 0) {
            text.text('');
        }
    });
}

function computePixelValue(dimension, value, parent) {
  
    let pixelValue = null;
      
    if (!value) return null;
    
    if (value.endsWith('vw') && dimension === 'width') {
        const vw = parseFloat(value);
        pixelValue = (vw / 100) * window.innerWidth;
    
    } else if (value.endsWith('vh') && dimension === 'height') {
        const vh = parseFloat(value);
        pixelValue = (vh / 100) * window.innerHeight;
    
    } else if (value.endsWith('px')) {
        pixelValue = parseFloat(value);
    
    } else if (value.endsWith('%')) {
        const percent = parseFloat(value);

        if (parent) {
            const parentRect = parent.getBoundingClientRect();
            pixelValue = (percent / 100) 
            pixelValue *= dimension === 'width' ? parentRect.width : parentRect.height;
            if (pixelValue < 0 || pixelValue === 0) {
                console.warn('Computed pixel value is zero or negative. Using default.');
                pixelValue = dimension === 'width' ? 1200 : 800; // Default values
            } 
        } else {
            console.warn('Parent element is not provided for percentage calculation. Using default 100% of the viewport.');
            pixelValue = (percent / 100) * (dimension === 'width' ? window.innerWidth : window.innerHeight);
        }
    } 

    return pixelValue;
}


export {
    computePixelValue,
    wrap,
    wrap_ellipsis,
    showLoading,
    hideLoading,
    capitalizeFirstLetter,
    getElementCoords,
    getTicksDistance,
    getImage,
    truncateText
}