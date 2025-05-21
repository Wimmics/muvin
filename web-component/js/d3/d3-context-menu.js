import * as d3 from 'd3'

// Main context menu function
function contextMenu({ shadowRoot, menuItems, onOpen = () => {}, onClose = () => {}, theme = 'd3-context-menu-theme', position } = {}) {
    let currentMenu = null;
  
    // Close the context menu and cleanup
    function closeMenu() {
      if (currentMenu) {
        d3.select(shadowRoot.querySelector('.d3-context-menu')).style('display', 'none');
        d3.select(shadowRoot).on('mousedown.d3-context-menu', null);
        currentMenu = null;
        onClose(); // Callback on close
      }
    }
  
    // Recursively build the menu and any nested submenus
    function buildMenu(parent, items, depth = 0, context = {}) {
        if (!parent) return

        // Create a <ul> to contain menu items
        const ul = parent.append('ul');

        // Append each menu item as an <li>
        ul.selectAll('li')
          .data(items)
          .enter()
          .append('li')
          .each(function(d) {
            const li = d3.select(this);
            const isDivider = !!d.divider;
            const isDisabled = !!d.disabled;
            const hasChildren = Array.isArray(d.children);
            const hasAction = typeof d.action === 'function';
            const multiColumn = hasChildren && d.children.length > 10;

            // Set appropriate classes and content
            li
              .classed('is-divider', isDivider)
              .classed('is-disabled', isDisabled)
              .classed('is-header', !hasAction && !hasChildren)
              .classed('is-parent', hasChildren)
              .classed(d.className || '', !!d.className)
              .html(isDivider ? '<hr>' : (typeof d.title === 'function' ? d.title(context.data, context.index) : d.title))
              .on('click', () => {
                if (isDisabled || !hasAction) return;
                d.action(context.data, context.index);
                closeMenu(); // Close on action
              });

            // If the item has children, build a submenu
            if (hasChildren) {
              const children = li
                .append('ul')
                .classed('is-children', true)
                .classed('multi-column', multiColumn);

              if (multiColumn) {
                // If submenu is long, enable sorting and filtering
                const sortingOptions = [
                  { label: "Alphabetic Order", value: 'alpha' },
                  { label: "Shared Items (Decreasing)", value: 'decreasing' }
                ];

                // Add label and sorting <select>
                children.append('label').text('Sort by');

                const select = children.append('select')
                  .on('change', function() {
                    sortChildren(this.value, children, d.children);
                  });

                select.selectAll('option')
                  .data(sortingOptions)
                  .enter()
                  .append('option')
                  .attr('value', d => d.value)
                  .text(d => d.label);

                // Add search input
                children.append('input')
                  .attr('type', 'text')
                  .attr('placeholder', 'Search for...')
                  .on('input', function() {
                    filterChildren(this.value.toLowerCase(), children);
                  });
              }

              // Recursively build the submenu
              buildMenu(children, d.children, depth + 1, context);
            }
          });
    }
  
    // Sort submenu items based on selection
    function sortChildren(sortType, ul, items) {
      const listItems = ul.selectAll('li').nodes().slice(2); // Skip label and select
      const sorted = [...items];
  
      if (sortType === 'alpha') {
        sorted.sort((a, b) => a.title.localeCompare(b.title));
      } else if (sortType === 'decreasing') {
        sorted.sort((a, b) => (b.shared || 0) - (a.shared || 0));
      }
  
      d3.selectAll(listItems).remove(); // Remove existing items
      buildMenu(ul, sorted, 1); // Rebuild sorted menu
    }
  
    // Filter submenu items by search query
    function filterChildren(query, ul) {
      ul.selectAll('li')
        .style('display', d => {
          return d.title.toLowerCase().includes(query) ? null : 'none';
        });
    }
  
    // Handler function that gets returned and used to open the menu
    function handler(d, i) {
      const event = d3.event; // Get current D3 event

      closeMenu(); // Close any existing menu

      currentMenu = true;

      // Select the menu container, apply theme and make it visible
      const div = d3.select(shadowRoot.querySelector('.d3-context-menu'))
        .attr('class', `d3-context-menu ${theme}`)
        .style('display', 'block')
        .html('') // Remove all children before adding new menu options

      // Register listeners to close menu on click outside
      d3.select(shadowRoot)
        .on('click.d3-context-menu', function() {
            if (!shadowRoot.querySelector('.d3-context-menu').contains(d3.event.target)) {
                closeMenu();
            }
        });
  
      // Build the menu based on provided items
      buildMenu(div, menuItems, 0, { data: d, index: i });
  
      // Optionally prevent menu from opening
      if (onOpen(d, i) === false) return;
  
      // Determine menu position
      const pos = position ? position(d, i) : { x: event.pageX, y: event.pageY };
  
      const pageWidth = window.innerWidth;
      const pageHeight = window.innerHeight;
  
      // Calculate position relative to page edges
      const left = (pos.x > pageWidth / 2) ? null : pos.x;
      const right = (pos.x > pageWidth / 2) ? pageWidth - pos.x : null;
      const top = (pos.y > pageHeight / 2) ? null : pos.y;
      const bottom = (pos.y > pageHeight / 2) ? pageHeight - pos.y : null;
  
      // Apply positioning styles to the menu
      const menuEl = div.node();
      d3.select(menuEl)
        .style('left', left !== null ? `${left}px` : null)
        .style('right', right !== null ? `${right}px` : null)
        .style('top', top !== null ? `${top}px` : null)
        .style('bottom', bottom !== null ? `${bottom}px` : null);
  
      // Prevent default context menu and event bubbling
      event.preventDefault();
      event.stopPropagation();
    }
  
    handler.close = closeMenu; // Expose close method
    return handler; // Return the menu handler function
}

export default contextMenu
