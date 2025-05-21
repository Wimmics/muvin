function ascending$4(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

function bisector$3(compare) {
  if (compare.length === 1) compare = ascendingComparator$3(compare);
  return {
    left: function(a, x, lo, hi) {
      if (lo == null) lo = 0;
      if (hi == null) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (compare(a[mid], x) < 0) lo = mid + 1;
        else hi = mid;
      }
      return lo;
    },
    right: function(a, x, lo, hi) {
      if (lo == null) lo = 0;
      if (hi == null) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (compare(a[mid], x) > 0) hi = mid;
        else lo = mid + 1;
      }
      return lo;
    }
  };
}

function ascendingComparator$3(f) {
  return function(d, x) {
    return ascending$4(f(d), x);
  };
}

var ascendingBisect$1 = bisector$3(ascending$4);
var bisectRight$1 = ascendingBisect$1.right;

function extent(values, valueof) {
  var n = values.length,
      i = -1,
      value,
      min,
      max;

  if (valueof == null) {
    while (++i < n) { // Find the first comparable value.
      if ((value = values[i]) != null && value >= value) {
        min = max = value;
        while (++i < n) { // Compare the remaining values.
          if ((value = values[i]) != null) {
            if (min > value) min = value;
            if (max < value) max = value;
          }
        }
      }
    }
  }

  else {
    while (++i < n) { // Find the first comparable value.
      if ((value = valueof(values[i], i, values)) != null && value >= value) {
        min = max = value;
        while (++i < n) { // Compare the remaining values.
          if ((value = valueof(values[i], i, values)) != null) {
            if (min > value) min = value;
            if (max < value) max = value;
          }
        }
      }
    }
  }

  return [min, max];
}

function max(values, valueof) {
  var n = values.length,
      i = -1,
      value,
      max;

  if (valueof == null) {
    while (++i < n) { // Find the first comparable value.
      if ((value = values[i]) != null && value >= value) {
        max = value;
        while (++i < n) { // Compare the remaining values.
          if ((value = values[i]) != null && value > max) {
            max = value;
          }
        }
      }
    }
  }

  else {
    while (++i < n) { // Find the first comparable value.
      if ((value = valueof(values[i], i, values)) != null && value >= value) {
        max = value;
        while (++i < n) { // Compare the remaining values.
          if ((value = valueof(values[i], i, values)) != null && value > max) {
            max = value;
          }
        }
      }
    }
  }

  return max;
}

function min(values, valueof) {
  var n = values.length,
      i = -1,
      value,
      min;

  if (valueof == null) {
    while (++i < n) { // Find the first comparable value.
      if ((value = values[i]) != null && value >= value) {
        min = value;
        while (++i < n) { // Compare the remaining values.
          if ((value = values[i]) != null && min > value) {
            min = value;
          }
        }
      }
    }
  }

  else {
    while (++i < n) { // Find the first comparable value.
      if ((value = valueof(values[i], i, values)) != null && value >= value) {
        min = value;
        while (++i < n) { // Compare the remaining values.
          if ((value = valueof(values[i], i, values)) != null && min > value) {
            min = value;
          }
        }
      }
    }
  }

  return min;
}

function sum(values, valueof) {
  var n = values.length,
      i = -1,
      value,
      sum = 0;

  if (valueof == null) {
    while (++i < n) {
      if (value = +values[i]) sum += value; // Note: zero and null are equivalent.
    }
  }

  else {
    while (++i < n) {
      if (value = +valueof(values[i], i, values)) sum += value;
    }
  }

  return sum;
}

var noop = {value: function() {}};

function dispatch() {
  for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
    if (!(t = arguments[i] + "") || (t in _) || /[\s.]/.test(t)) throw new Error("illegal type: " + t);
    _[t] = [];
  }
  return new Dispatch(_);
}

function Dispatch(_) {
  this._ = _;
}

function parseTypenames$1(typenames, types) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
    return {type: t, name: name};
  });
}

Dispatch.prototype = dispatch.prototype = {
  constructor: Dispatch,
  on: function(typename, callback) {
    var _ = this._,
        T = parseTypenames$1(typename + "", _),
        t,
        i = -1,
        n = T.length;

    // If no callback was specified, return the callback of the given type and name.
    if (arguments.length < 2) {
      while (++i < n) if ((t = (typename = T[i]).type) && (t = get$1(_[t], typename.name))) return t;
      return;
    }

    // If a type was specified, set the callback for the given type and name.
    // Otherwise, if a null callback was specified, remove callbacks of the given name.
    if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
    while (++i < n) {
      if (t = (typename = T[i]).type) _[t] = set$1(_[t], typename.name, callback);
      else if (callback == null) for (t in _) _[t] = set$1(_[t], typename.name, null);
    }

    return this;
  },
  copy: function() {
    var copy = {}, _ = this._;
    for (var t in _) copy[t] = _[t].slice();
    return new Dispatch(copy);
  },
  call: function(type, that) {
    if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
  },
  apply: function(type, that, args) {
    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
  }
};

function get$1(type, name) {
  for (var i = 0, n = type.length, c; i < n; ++i) {
    if ((c = type[i]).name === name) {
      return c.value;
    }
  }
}

function set$1(type, name, callback) {
  for (var i = 0, n = type.length; i < n; ++i) {
    if (type[i].name === name) {
      type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
      break;
    }
  }
  if (callback != null) type.push({name: name, value: callback});
  return type;
}

var xhtml = "http://www.w3.org/1999/xhtml";

var namespaces = {
  svg: "http://www.w3.org/2000/svg",
  xhtml: xhtml,
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
};

function namespace(name) {
  var prefix = name += "", i = prefix.indexOf(":");
  if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
  return namespaces.hasOwnProperty(prefix) ? {space: namespaces[prefix], local: name} : name;
}

function creatorInherit(name) {
  return function() {
    var document = this.ownerDocument,
        uri = this.namespaceURI;
    return uri === xhtml && document.documentElement.namespaceURI === xhtml
        ? document.createElement(name)
        : document.createElementNS(uri, name);
  };
}

function creatorFixed(fullname) {
  return function() {
    return this.ownerDocument.createElementNS(fullname.space, fullname.local);
  };
}

function creator(name) {
  var fullname = namespace(name);
  return (fullname.local
      ? creatorFixed
      : creatorInherit)(fullname);
}

function none$2() {}

function selector(selector) {
  return selector == null ? none$2 : function() {
    return this.querySelector(selector);
  };
}

function selection_select(select) {
  if (typeof select !== "function") select = selector(select);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
      }
    }
  }

  return new Selection$1(subgroups, this._parents);
}

function empty() {
  return [];
}

function selectorAll(selector) {
  return selector == null ? empty : function() {
    return this.querySelectorAll(selector);
  };
}

function selection_selectAll(select) {
  if (typeof select !== "function") select = selectorAll(select);

  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        subgroups.push(select.call(node, node.__data__, i, group));
        parents.push(node);
      }
    }
  }

  return new Selection$1(subgroups, parents);
}

function matcher(selector) {
  return function() {
    return this.matches(selector);
  };
}

function selection_filter(match) {
  if (typeof match !== "function") match = matcher(match);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }

  return new Selection$1(subgroups, this._parents);
}

function sparse(update) {
  return new Array(update.length);
}

function selection_enter() {
  return new Selection$1(this._enter || this._groups.map(sparse), this._parents);
}

function EnterNode(parent, datum) {
  this.ownerDocument = parent.ownerDocument;
  this.namespaceURI = parent.namespaceURI;
  this._next = null;
  this._parent = parent;
  this.__data__ = datum;
}

EnterNode.prototype = {
  constructor: EnterNode,
  appendChild: function(child) { return this._parent.insertBefore(child, this._next); },
  insertBefore: function(child, next) { return this._parent.insertBefore(child, next); },
  querySelector: function(selector) { return this._parent.querySelector(selector); },
  querySelectorAll: function(selector) { return this._parent.querySelectorAll(selector); }
};

function constant$5(x) {
  return function() {
    return x;
  };
}

var keyPrefix = "$"; // Protect against keys like “__proto__”.

function bindIndex(parent, group, enter, update, exit, data) {
  var i = 0,
      node,
      groupLength = group.length,
      dataLength = data.length;

  // Put any non-null nodes that fit into update.
  // Put any null nodes into enter.
  // Put any remaining data into enter.
  for (; i < dataLength; ++i) {
    if (node = group[i]) {
      node.__data__ = data[i];
      update[i] = node;
    } else {
      enter[i] = new EnterNode(parent, data[i]);
    }
  }

  // Put any non-null nodes that don’t fit into exit.
  for (; i < groupLength; ++i) {
    if (node = group[i]) {
      exit[i] = node;
    }
  }
}

function bindKey(parent, group, enter, update, exit, data, key) {
  var i,
      node,
      nodeByKeyValue = {},
      groupLength = group.length,
      dataLength = data.length,
      keyValues = new Array(groupLength),
      keyValue;

  // Compute the key for each node.
  // If multiple nodes have the same key, the duplicates are added to exit.
  for (i = 0; i < groupLength; ++i) {
    if (node = group[i]) {
      keyValues[i] = keyValue = keyPrefix + key.call(node, node.__data__, i, group);
      if (keyValue in nodeByKeyValue) {
        exit[i] = node;
      } else {
        nodeByKeyValue[keyValue] = node;
      }
    }
  }

  // Compute the key for each datum.
  // If there a node associated with this key, join and add it to update.
  // If there is not (or the key is a duplicate), add it to enter.
  for (i = 0; i < dataLength; ++i) {
    keyValue = keyPrefix + key.call(parent, data[i], i, data);
    if (node = nodeByKeyValue[keyValue]) {
      update[i] = node;
      node.__data__ = data[i];
      nodeByKeyValue[keyValue] = null;
    } else {
      enter[i] = new EnterNode(parent, data[i]);
    }
  }

  // Add any remaining nodes that were not bound to data to exit.
  for (i = 0; i < groupLength; ++i) {
    if ((node = group[i]) && (nodeByKeyValue[keyValues[i]] === node)) {
      exit[i] = node;
    }
  }
}

function selection_data(value, key) {
  if (!value) {
    data = new Array(this.size()), j = -1;
    this.each(function(d) { data[++j] = d; });
    return data;
  }

  var bind = key ? bindKey : bindIndex,
      parents = this._parents,
      groups = this._groups;

  if (typeof value !== "function") value = constant$5(value);

  for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
    var parent = parents[j],
        group = groups[j],
        groupLength = group.length,
        data = value.call(parent, parent && parent.__data__, j, parents),
        dataLength = data.length,
        enterGroup = enter[j] = new Array(dataLength),
        updateGroup = update[j] = new Array(dataLength),
        exitGroup = exit[j] = new Array(groupLength);

    bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

    // Now connect the enter nodes to their following update node, such that
    // appendChild can insert the materialized enter node before this node,
    // rather than at the end of the parent node.
    for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
      if (previous = enterGroup[i0]) {
        if (i0 >= i1) i1 = i0 + 1;
        while (!(next = updateGroup[i1]) && ++i1 < dataLength);
        previous._next = next || null;
      }
    }
  }

  update = new Selection$1(update, parents);
  update._enter = enter;
  update._exit = exit;
  return update;
}

function selection_exit() {
  return new Selection$1(this._exit || this._groups.map(sparse), this._parents);
}

function selection_join(onenter, onupdate, onexit) {
  var enter = this.enter(), update = this, exit = this.exit();
  enter = typeof onenter === "function" ? onenter(enter) : enter.append(onenter + "");
  if (onupdate != null) update = onupdate(update);
  if (onexit == null) exit.remove(); else onexit(exit);
  return enter && update ? enter.merge(update).order() : update;
}

function selection_merge(selection) {

  for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge[i] = node;
      }
    }
  }

  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }

  return new Selection$1(merges, this._parents);
}

function selection_order() {

  for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
    for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
      if (node = group[i]) {
        if (next && node.compareDocumentPosition(next) ^ 4) next.parentNode.insertBefore(node, next);
        next = node;
      }
    }
  }

  return this;
}

function selection_sort(compare) {
  if (!compare) compare = ascending$3;

  function compareNode(a, b) {
    return a && b ? compare(a.__data__, b.__data__) : !a - !b;
  }

  for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        sortgroup[i] = node;
      }
    }
    sortgroup.sort(compareNode);
  }

  return new Selection$1(sortgroups, this._parents).order();
}

function ascending$3(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

function selection_call() {
  var callback = arguments[0];
  arguments[0] = this;
  callback.apply(null, arguments);
  return this;
}

function selection_nodes() {
  var nodes = new Array(this.size()), i = -1;
  this.each(function() { nodes[++i] = this; });
  return nodes;
}

function selection_node() {

  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
      var node = group[i];
      if (node) return node;
    }
  }

  return null;
}

function selection_size() {
  var size = 0;
  this.each(function() { ++size; });
  return size;
}

function selection_empty() {
  return !this.node();
}

function selection_each(callback) {

  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
      if (node = group[i]) callback.call(node, node.__data__, i, group);
    }
  }

  return this;
}

function attrRemove$1(name) {
  return function() {
    this.removeAttribute(name);
  };
}

function attrRemoveNS$1(fullname) {
  return function() {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}

function attrConstant$1(name, value) {
  return function() {
    this.setAttribute(name, value);
  };
}

function attrConstantNS$1(fullname, value) {
  return function() {
    this.setAttributeNS(fullname.space, fullname.local, value);
  };
}

function attrFunction$1(name, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttribute(name);
    else this.setAttribute(name, v);
  };
}

function attrFunctionNS$1(fullname, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
    else this.setAttributeNS(fullname.space, fullname.local, v);
  };
}

function selection_attr(name, value) {
  var fullname = namespace(name);

  if (arguments.length < 2) {
    var node = this.node();
    return fullname.local
        ? node.getAttributeNS(fullname.space, fullname.local)
        : node.getAttribute(fullname);
  }

  return this.each((value == null
      ? (fullname.local ? attrRemoveNS$1 : attrRemove$1) : (typeof value === "function"
      ? (fullname.local ? attrFunctionNS$1 : attrFunction$1)
      : (fullname.local ? attrConstantNS$1 : attrConstant$1)))(fullname, value));
}

function defaultView(node) {
  return (node.ownerDocument && node.ownerDocument.defaultView) // node is a Node
      || (node.document && node) // node is a Window
      || node.defaultView; // node is a Document
}

function styleRemove$1(name) {
  return function() {
    this.style.removeProperty(name);
  };
}

function styleConstant$1(name, value, priority) {
  return function() {
    this.style.setProperty(name, value, priority);
  };
}

function styleFunction$1(name, value, priority) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.style.removeProperty(name);
    else this.style.setProperty(name, v, priority);
  };
}

function selection_style(name, value, priority) {
  return arguments.length > 1
      ? this.each((value == null
            ? styleRemove$1 : typeof value === "function"
            ? styleFunction$1
            : styleConstant$1)(name, value, priority == null ? "" : priority))
      : styleValue(this.node(), name);
}

function styleValue(node, name) {
  return node.style.getPropertyValue(name)
      || defaultView(node).getComputedStyle(node, null).getPropertyValue(name);
}

function propertyRemove(name) {
  return function() {
    delete this[name];
  };
}

function propertyConstant(name, value) {
  return function() {
    this[name] = value;
  };
}

function propertyFunction(name, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) delete this[name];
    else this[name] = v;
  };
}

function selection_property(name, value) {
  return arguments.length > 1
      ? this.each((value == null
          ? propertyRemove : typeof value === "function"
          ? propertyFunction
          : propertyConstant)(name, value))
      : this.node()[name];
}

function classArray(string) {
  return string.trim().split(/^|\s+/);
}

function classList(node) {
  return node.classList || new ClassList(node);
}

function ClassList(node) {
  this._node = node;
  this._names = classArray(node.getAttribute("class") || "");
}

ClassList.prototype = {
  add: function(name) {
    var i = this._names.indexOf(name);
    if (i < 0) {
      this._names.push(name);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  remove: function(name) {
    var i = this._names.indexOf(name);
    if (i >= 0) {
      this._names.splice(i, 1);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  contains: function(name) {
    return this._names.indexOf(name) >= 0;
  }
};

function classedAdd(node, names) {
  var list = classList(node), i = -1, n = names.length;
  while (++i < n) list.add(names[i]);
}

function classedRemove(node, names) {
  var list = classList(node), i = -1, n = names.length;
  while (++i < n) list.remove(names[i]);
}

function classedTrue(names) {
  return function() {
    classedAdd(this, names);
  };
}

function classedFalse(names) {
  return function() {
    classedRemove(this, names);
  };
}

function classedFunction(names, value) {
  return function() {
    (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
  };
}

function selection_classed(name, value) {
  var names = classArray(name + "");

  if (arguments.length < 2) {
    var list = classList(this.node()), i = -1, n = names.length;
    while (++i < n) if (!list.contains(names[i])) return false;
    return true;
  }

  return this.each((typeof value === "function"
      ? classedFunction : value
      ? classedTrue
      : classedFalse)(names, value));
}

function textRemove() {
  this.textContent = "";
}

function textConstant$1(value) {
  return function() {
    this.textContent = value;
  };
}

function textFunction$1(value) {
  return function() {
    var v = value.apply(this, arguments);
    this.textContent = v == null ? "" : v;
  };
}

function selection_text(value) {
  return arguments.length
      ? this.each(value == null
          ? textRemove : (typeof value === "function"
          ? textFunction$1
          : textConstant$1)(value))
      : this.node().textContent;
}

function htmlRemove() {
  this.innerHTML = "";
}

function htmlConstant(value) {
  return function() {
    this.innerHTML = value;
  };
}

function htmlFunction(value) {
  return function() {
    var v = value.apply(this, arguments);
    this.innerHTML = v == null ? "" : v;
  };
}

function selection_html(value) {
  return arguments.length
      ? this.each(value == null
          ? htmlRemove : (typeof value === "function"
          ? htmlFunction
          : htmlConstant)(value))
      : this.node().innerHTML;
}

function raise() {
  if (this.nextSibling) this.parentNode.appendChild(this);
}

function selection_raise() {
  return this.each(raise);
}

function lower() {
  if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
}

function selection_lower() {
  return this.each(lower);
}

function selection_append(name) {
  var create = typeof name === "function" ? name : creator(name);
  return this.select(function() {
    return this.appendChild(create.apply(this, arguments));
  });
}

function constantNull() {
  return null;
}

function selection_insert(name, before) {
  var create = typeof name === "function" ? name : creator(name),
      select = before == null ? constantNull : typeof before === "function" ? before : selector(before);
  return this.select(function() {
    return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
  });
}

function remove() {
  var parent = this.parentNode;
  if (parent) parent.removeChild(this);
}

function selection_remove() {
  return this.each(remove);
}

function selection_cloneShallow() {
  var clone = this.cloneNode(false), parent = this.parentNode;
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
}

function selection_cloneDeep() {
  var clone = this.cloneNode(true), parent = this.parentNode;
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
}

function selection_clone(deep) {
  return this.select(deep ? selection_cloneDeep : selection_cloneShallow);
}

function selection_datum(value) {
  return arguments.length
      ? this.property("__data__", value)
      : this.node().__data__;
}

var filterEvents = {};

var event = null;

if (typeof document !== "undefined") {
  var element = document.documentElement;
  if (!("onmouseenter" in element)) {
    filterEvents = {mouseenter: "mouseover", mouseleave: "mouseout"};
  }
}

function filterContextListener(listener, index, group) {
  listener = contextListener(listener, index, group);
  return function(event) {
    var related = event.relatedTarget;
    if (!related || (related !== this && !(related.compareDocumentPosition(this) & 8))) {
      listener.call(this, event);
    }
  };
}

function contextListener(listener, index, group) {
  return function(event1) {
    var event0 = event; // Events can be reentrant (e.g., focus).
    event = event1;
    try {
      listener.call(this, this.__data__, index, group);
    } finally {
      event = event0;
    }
  };
}

function parseTypenames(typenames) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    return {type: t, name: name};
  });
}

function onRemove(typename) {
  return function() {
    var on = this.__on;
    if (!on) return;
    for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
      if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.capture);
      } else {
        on[++i] = o;
      }
    }
    if (++i) on.length = i;
    else delete this.__on;
  };
}

function onAdd(typename, value, capture) {
  var wrap = filterEvents.hasOwnProperty(typename.type) ? filterContextListener : contextListener;
  return function(d, i, group) {
    var on = this.__on, o, listener = wrap(value, i, group);
    if (on) for (var j = 0, m = on.length; j < m; ++j) {
      if ((o = on[j]).type === typename.type && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.capture);
        this.addEventListener(o.type, o.listener = listener, o.capture = capture);
        o.value = value;
        return;
      }
    }
    this.addEventListener(typename.type, listener, capture);
    o = {type: typename.type, name: typename.name, value: value, listener: listener, capture: capture};
    if (!on) this.__on = [o];
    else on.push(o);
  };
}

function selection_on(typename, value, capture) {
  var typenames = parseTypenames(typename + ""), i, n = typenames.length, t;

  if (arguments.length < 2) {
    var on = this.node().__on;
    if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
      for (i = 0, o = on[j]; i < n; ++i) {
        if ((t = typenames[i]).type === o.type && t.name === o.name) {
          return o.value;
        }
      }
    }
    return;
  }

  on = value ? onAdd : onRemove;
  if (capture == null) capture = false;
  for (i = 0; i < n; ++i) this.each(on(typenames[i], value, capture));
  return this;
}

function customEvent(event1, listener, that, args) {
  var event0 = event;
  event1.sourceEvent = event;
  event = event1;
  try {
    return listener.apply(that, args);
  } finally {
    event = event0;
  }
}

function dispatchEvent(node, type, params) {
  var window = defaultView(node),
      event = window.CustomEvent;

  if (typeof event === "function") {
    event = new event(type, params);
  } else {
    event = window.document.createEvent("Event");
    if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;
    else event.initEvent(type, false, false);
  }

  node.dispatchEvent(event);
}

function dispatchConstant(type, params) {
  return function() {
    return dispatchEvent(this, type, params);
  };
}

function dispatchFunction(type, params) {
  return function() {
    return dispatchEvent(this, type, params.apply(this, arguments));
  };
}

function selection_dispatch(type, params) {
  return this.each((typeof params === "function"
      ? dispatchFunction
      : dispatchConstant)(type, params));
}

var root = [null];

function Selection$1(groups, parents) {
  this._groups = groups;
  this._parents = parents;
}

function selection() {
  return new Selection$1([[document.documentElement]], root);
}

Selection$1.prototype = selection.prototype = {
  constructor: Selection$1,
  select: selection_select,
  selectAll: selection_selectAll,
  filter: selection_filter,
  data: selection_data,
  enter: selection_enter,
  exit: selection_exit,
  join: selection_join,
  merge: selection_merge,
  order: selection_order,
  sort: selection_sort,
  call: selection_call,
  nodes: selection_nodes,
  node: selection_node,
  size: selection_size,
  empty: selection_empty,
  each: selection_each,
  attr: selection_attr,
  style: selection_style,
  property: selection_property,
  classed: selection_classed,
  text: selection_text,
  html: selection_html,
  raise: selection_raise,
  lower: selection_lower,
  append: selection_append,
  insert: selection_insert,
  remove: selection_remove,
  clone: selection_clone,
  datum: selection_datum,
  on: selection_on,
  dispatch: selection_dispatch
};

function select(selector) {
  return typeof selector === "string"
      ? new Selection$1([[document.querySelector(selector)]], [document.documentElement])
      : new Selection$1([[selector]], root);
}

function sourceEvent() {
  var current = event, source;
  while (source = current.sourceEvent) current = source;
  return current;
}

function point$2(node, event) {
  var svg = node.ownerSVGElement || node;

  if (svg.createSVGPoint) {
    var point = svg.createSVGPoint();
    point.x = event.clientX, point.y = event.clientY;
    point = point.matrixTransform(node.getScreenCTM().inverse());
    return [point.x, point.y];
  }

  var rect = node.getBoundingClientRect();
  return [event.clientX - rect.left - node.clientLeft, event.clientY - rect.top - node.clientTop];
}

function mouse(node) {
  var event = sourceEvent();
  if (event.changedTouches) event = event.changedTouches[0];
  return point$2(node, event);
}

function selectAll(selector) {
  return typeof selector === "string"
      ? new Selection$1([document.querySelectorAll(selector)], [document.documentElement])
      : new Selection$1([selector == null ? [] : selector], root);
}

function touch(node, touches, identifier) {
  if (arguments.length < 3) identifier = touches, touches = sourceEvent().changedTouches;

  for (var i = 0, n = touches ? touches.length : 0, touch; i < n; ++i) {
    if ((touch = touches[i]).identifier === identifier) {
      return point$2(node, touch);
    }
  }

  return null;
}

function nopropagation() {
  event.stopImmediatePropagation();
}

function noevent() {
  event.preventDefault();
  event.stopImmediatePropagation();
}

function dragDisable(view) {
  var root = view.document.documentElement,
      selection = select(view).on("dragstart.drag", noevent, true);
  if ("onselectstart" in root) {
    selection.on("selectstart.drag", noevent, true);
  } else {
    root.__noselect = root.style.MozUserSelect;
    root.style.MozUserSelect = "none";
  }
}

function yesdrag(view, noclick) {
  var root = view.document.documentElement,
      selection = select(view).on("dragstart.drag", null);
  if (noclick) {
    selection.on("click.drag", noevent, true);
    setTimeout(function() { selection.on("click.drag", null); }, 0);
  }
  if ("onselectstart" in root) {
    selection.on("selectstart.drag", null);
  } else {
    root.style.MozUserSelect = root.__noselect;
    delete root.__noselect;
  }
}

function constant$4(x) {
  return function() {
    return x;
  };
}

function DragEvent(target, type, subject, id, active, x, y, dx, dy, dispatch) {
  this.target = target;
  this.type = type;
  this.subject = subject;
  this.identifier = id;
  this.active = active;
  this.x = x;
  this.y = y;
  this.dx = dx;
  this.dy = dy;
  this._ = dispatch;
}

DragEvent.prototype.on = function() {
  var value = this._.on.apply(this._, arguments);
  return value === this._ ? this : value;
};

// Ignore right-click, since that should open the context menu.
function defaultFilter() {
  return !event.ctrlKey && !event.button;
}

function defaultContainer() {
  return this.parentNode;
}

function defaultSubject(d) {
  return d == null ? {x: event.x, y: event.y} : d;
}

function defaultTouchable() {
  return navigator.maxTouchPoints || ("ontouchstart" in this);
}

function drag() {
  var filter = defaultFilter,
      container = defaultContainer,
      subject = defaultSubject,
      touchable = defaultTouchable,
      gestures = {},
      listeners = dispatch("start", "drag", "end"),
      active = 0,
      mousedownx,
      mousedowny,
      mousemoving,
      touchending,
      clickDistance2 = 0;

  function drag(selection) {
    selection
        .on("mousedown.drag", mousedowned)
      .filter(touchable)
        .on("touchstart.drag", touchstarted)
        .on("touchmove.drag", touchmoved)
        .on("touchend.drag touchcancel.drag", touchended)
        .style("touch-action", "none")
        .style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
  }

  function mousedowned() {
    if (touchending || !filter.apply(this, arguments)) return;
    var gesture = beforestart("mouse", container.apply(this, arguments), mouse, this, arguments);
    if (!gesture) return;
    select(event.view).on("mousemove.drag", mousemoved, true).on("mouseup.drag", mouseupped, true);
    dragDisable(event.view);
    nopropagation();
    mousemoving = false;
    mousedownx = event.clientX;
    mousedowny = event.clientY;
    gesture("start");
  }

  function mousemoved() {
    noevent();
    if (!mousemoving) {
      var dx = event.clientX - mousedownx, dy = event.clientY - mousedowny;
      mousemoving = dx * dx + dy * dy > clickDistance2;
    }
    gestures.mouse("drag");
  }

  function mouseupped() {
    select(event.view).on("mousemove.drag mouseup.drag", null);
    yesdrag(event.view, mousemoving);
    noevent();
    gestures.mouse("end");
  }

  function touchstarted() {
    if (!filter.apply(this, arguments)) return;
    var touches = event.changedTouches,
        c = container.apply(this, arguments),
        n = touches.length, i, gesture;

    for (i = 0; i < n; ++i) {
      if (gesture = beforestart(touches[i].identifier, c, touch, this, arguments)) {
        nopropagation();
        gesture("start");
      }
    }
  }

  function touchmoved() {
    var touches = event.changedTouches,
        n = touches.length, i, gesture;

    for (i = 0; i < n; ++i) {
      if (gesture = gestures[touches[i].identifier]) {
        noevent();
        gesture("drag");
      }
    }
  }

  function touchended() {
    var touches = event.changedTouches,
        n = touches.length, i, gesture;

    if (touchending) clearTimeout(touchending);
    touchending = setTimeout(function() { touchending = null; }, 500); // Ghost clicks are delayed!
    for (i = 0; i < n; ++i) {
      if (gesture = gestures[touches[i].identifier]) {
        nopropagation();
        gesture("end");
      }
    }
  }

  function beforestart(id, container, point, that, args) {
    var p = point(container, id), s, dx, dy,
        sublisteners = listeners.copy();

    if (!customEvent(new DragEvent(drag, "beforestart", s, id, active, p[0], p[1], 0, 0, sublisteners), function() {
      if ((event.subject = s = subject.apply(that, args)) == null) return false;
      dx = s.x - p[0] || 0;
      dy = s.y - p[1] || 0;
      return true;
    })) return;

    return function gesture(type) {
      var p0 = p, n;
      switch (type) {
        case "start": gestures[id] = gesture, n = active++; break;
        case "end": delete gestures[id], --active; // nobreak
        case "drag": p = point(container, id), n = active; break;
      }
      customEvent(new DragEvent(drag, type, s, id, n, p[0] + dx, p[1] + dy, p[0] - p0[0], p[1] - p0[1], sublisteners), sublisteners.apply, sublisteners, [type, that, args]);
    };
  }

  drag.filter = function(_) {
    return arguments.length ? (filter = typeof _ === "function" ? _ : constant$4(!!_), drag) : filter;
  };

  drag.container = function(_) {
    return arguments.length ? (container = typeof _ === "function" ? _ : constant$4(_), drag) : container;
  };

  drag.subject = function(_) {
    return arguments.length ? (subject = typeof _ === "function" ? _ : constant$4(_), drag) : subject;
  };

  drag.touchable = function(_) {
    return arguments.length ? (touchable = typeof _ === "function" ? _ : constant$4(!!_), drag) : touchable;
  };

  drag.on = function() {
    var value = listeners.on.apply(listeners, arguments);
    return value === listeners ? drag : value;
  };

  drag.clickDistance = function(_) {
    return arguments.length ? (clickDistance2 = (_ = +_) * _, drag) : Math.sqrt(clickDistance2);
  };

  return drag;
}

function define$2(constructor, factory, prototype) {
  constructor.prototype = factory.prototype = prototype;
  prototype.constructor = constructor;
}

function extend$2(parent, definition) {
  var prototype = Object.create(parent.prototype);
  for (var key in definition) prototype[key] = definition[key];
  return prototype;
}

function Color$2() {}

var darker$2 = 0.7;
var brighter$2 = 1 / darker$2;

var reI$2 = "\\s*([+-]?\\d+)\\s*",
    reN$2 = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\s*",
    reP$2 = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)%\\s*",
    reHex$2 = /^#([0-9a-f]{3,8})$/,
    reRgbInteger$2 = new RegExp("^rgb\\(" + [reI$2, reI$2, reI$2] + "\\)$"),
    reRgbPercent$2 = new RegExp("^rgb\\(" + [reP$2, reP$2, reP$2] + "\\)$"),
    reRgbaInteger$2 = new RegExp("^rgba\\(" + [reI$2, reI$2, reI$2, reN$2] + "\\)$"),
    reRgbaPercent$2 = new RegExp("^rgba\\(" + [reP$2, reP$2, reP$2, reN$2] + "\\)$"),
    reHslPercent$2 = new RegExp("^hsl\\(" + [reN$2, reP$2, reP$2] + "\\)$"),
    reHslaPercent$2 = new RegExp("^hsla\\(" + [reN$2, reP$2, reP$2, reN$2] + "\\)$");

var named$2 = {
  aliceblue: 0xf0f8ff,
  antiquewhite: 0xfaebd7,
  aqua: 0x00ffff,
  aquamarine: 0x7fffd4,
  azure: 0xf0ffff,
  beige: 0xf5f5dc,
  bisque: 0xffe4c4,
  black: 0x000000,
  blanchedalmond: 0xffebcd,
  blue: 0x0000ff,
  blueviolet: 0x8a2be2,
  brown: 0xa52a2a,
  burlywood: 0xdeb887,
  cadetblue: 0x5f9ea0,
  chartreuse: 0x7fff00,
  chocolate: 0xd2691e,
  coral: 0xff7f50,
  cornflowerblue: 0x6495ed,
  cornsilk: 0xfff8dc,
  crimson: 0xdc143c,
  cyan: 0x00ffff,
  darkblue: 0x00008b,
  darkcyan: 0x008b8b,
  darkgoldenrod: 0xb8860b,
  darkgray: 0xa9a9a9,
  darkgreen: 0x006400,
  darkgrey: 0xa9a9a9,
  darkkhaki: 0xbdb76b,
  darkmagenta: 0x8b008b,
  darkolivegreen: 0x556b2f,
  darkorange: 0xff8c00,
  darkorchid: 0x9932cc,
  darkred: 0x8b0000,
  darksalmon: 0xe9967a,
  darkseagreen: 0x8fbc8f,
  darkslateblue: 0x483d8b,
  darkslategray: 0x2f4f4f,
  darkslategrey: 0x2f4f4f,
  darkturquoise: 0x00ced1,
  darkviolet: 0x9400d3,
  deeppink: 0xff1493,
  deepskyblue: 0x00bfff,
  dimgray: 0x696969,
  dimgrey: 0x696969,
  dodgerblue: 0x1e90ff,
  firebrick: 0xb22222,
  floralwhite: 0xfffaf0,
  forestgreen: 0x228b22,
  fuchsia: 0xff00ff,
  gainsboro: 0xdcdcdc,
  ghostwhite: 0xf8f8ff,
  gold: 0xffd700,
  goldenrod: 0xdaa520,
  gray: 0x808080,
  green: 0x008000,
  greenyellow: 0xadff2f,
  grey: 0x808080,
  honeydew: 0xf0fff0,
  hotpink: 0xff69b4,
  indianred: 0xcd5c5c,
  indigo: 0x4b0082,
  ivory: 0xfffff0,
  khaki: 0xf0e68c,
  lavender: 0xe6e6fa,
  lavenderblush: 0xfff0f5,
  lawngreen: 0x7cfc00,
  lemonchiffon: 0xfffacd,
  lightblue: 0xadd8e6,
  lightcoral: 0xf08080,
  lightcyan: 0xe0ffff,
  lightgoldenrodyellow: 0xfafad2,
  lightgray: 0xd3d3d3,
  lightgreen: 0x90ee90,
  lightgrey: 0xd3d3d3,
  lightpink: 0xffb6c1,
  lightsalmon: 0xffa07a,
  lightseagreen: 0x20b2aa,
  lightskyblue: 0x87cefa,
  lightslategray: 0x778899,
  lightslategrey: 0x778899,
  lightsteelblue: 0xb0c4de,
  lightyellow: 0xffffe0,
  lime: 0x00ff00,
  limegreen: 0x32cd32,
  linen: 0xfaf0e6,
  magenta: 0xff00ff,
  maroon: 0x800000,
  mediumaquamarine: 0x66cdaa,
  mediumblue: 0x0000cd,
  mediumorchid: 0xba55d3,
  mediumpurple: 0x9370db,
  mediumseagreen: 0x3cb371,
  mediumslateblue: 0x7b68ee,
  mediumspringgreen: 0x00fa9a,
  mediumturquoise: 0x48d1cc,
  mediumvioletred: 0xc71585,
  midnightblue: 0x191970,
  mintcream: 0xf5fffa,
  mistyrose: 0xffe4e1,
  moccasin: 0xffe4b5,
  navajowhite: 0xffdead,
  navy: 0x000080,
  oldlace: 0xfdf5e6,
  olive: 0x808000,
  olivedrab: 0x6b8e23,
  orange: 0xffa500,
  orangered: 0xff4500,
  orchid: 0xda70d6,
  palegoldenrod: 0xeee8aa,
  palegreen: 0x98fb98,
  paleturquoise: 0xafeeee,
  palevioletred: 0xdb7093,
  papayawhip: 0xffefd5,
  peachpuff: 0xffdab9,
  peru: 0xcd853f,
  pink: 0xffc0cb,
  plum: 0xdda0dd,
  powderblue: 0xb0e0e6,
  purple: 0x800080,
  rebeccapurple: 0x663399,
  red: 0xff0000,
  rosybrown: 0xbc8f8f,
  royalblue: 0x4169e1,
  saddlebrown: 0x8b4513,
  salmon: 0xfa8072,
  sandybrown: 0xf4a460,
  seagreen: 0x2e8b57,
  seashell: 0xfff5ee,
  sienna: 0xa0522d,
  silver: 0xc0c0c0,
  skyblue: 0x87ceeb,
  slateblue: 0x6a5acd,
  slategray: 0x708090,
  slategrey: 0x708090,
  snow: 0xfffafa,
  springgreen: 0x00ff7f,
  steelblue: 0x4682b4,
  tan: 0xd2b48c,
  teal: 0x008080,
  thistle: 0xd8bfd8,
  tomato: 0xff6347,
  turquoise: 0x40e0d0,
  violet: 0xee82ee,
  wheat: 0xf5deb3,
  white: 0xffffff,
  whitesmoke: 0xf5f5f5,
  yellow: 0xffff00,
  yellowgreen: 0x9acd32
};

define$2(Color$2, color$2, {
  copy: function(channels) {
    return Object.assign(new this.constructor, this, channels);
  },
  displayable: function() {
    return this.rgb().displayable();
  },
  hex: color_formatHex$2, // Deprecated! Use color.formatHex.
  formatHex: color_formatHex$2,
  formatHsl: color_formatHsl$2,
  formatRgb: color_formatRgb$2,
  toString: color_formatRgb$2
});

function color_formatHex$2() {
  return this.rgb().formatHex();
}

function color_formatHsl$2() {
  return hslConvert$2(this).formatHsl();
}

function color_formatRgb$2() {
  return this.rgb().formatRgb();
}

function color$2(format) {
  var m, l;
  format = (format + "").trim().toLowerCase();
  return (m = reHex$2.exec(format)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn$2(m) // #ff0000
      : l === 3 ? new Rgb$2((m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1) // #f00
      : l === 8 ? rgba$2(m >> 24 & 0xff, m >> 16 & 0xff, m >> 8 & 0xff, (m & 0xff) / 0xff) // #ff000000
      : l === 4 ? rgba$2((m >> 12 & 0xf) | (m >> 8 & 0xf0), (m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), (((m & 0xf) << 4) | (m & 0xf)) / 0xff) // #f000
      : null) // invalid hex
      : (m = reRgbInteger$2.exec(format)) ? new Rgb$2(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
      : (m = reRgbPercent$2.exec(format)) ? new Rgb$2(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
      : (m = reRgbaInteger$2.exec(format)) ? rgba$2(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
      : (m = reRgbaPercent$2.exec(format)) ? rgba$2(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
      : (m = reHslPercent$2.exec(format)) ? hsla$2(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
      : (m = reHslaPercent$2.exec(format)) ? hsla$2(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
      : named$2.hasOwnProperty(format) ? rgbn$2(named$2[format]) // eslint-disable-line no-prototype-builtins
      : format === "transparent" ? new Rgb$2(NaN, NaN, NaN, 0)
      : null;
}

function rgbn$2(n) {
  return new Rgb$2(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
}

function rgba$2(r, g, b, a) {
  if (a <= 0) r = g = b = NaN;
  return new Rgb$2(r, g, b, a);
}

function rgbConvert$2(o) {
  if (!(o instanceof Color$2)) o = color$2(o);
  if (!o) return new Rgb$2;
  o = o.rgb();
  return new Rgb$2(o.r, o.g, o.b, o.opacity);
}

function rgb$2(r, g, b, opacity) {
  return arguments.length === 1 ? rgbConvert$2(r) : new Rgb$2(r, g, b, opacity == null ? 1 : opacity);
}

function Rgb$2(r, g, b, opacity) {
  this.r = +r;
  this.g = +g;
  this.b = +b;
  this.opacity = +opacity;
}

define$2(Rgb$2, rgb$2, extend$2(Color$2, {
  brighter: function(k) {
    k = k == null ? brighter$2 : Math.pow(brighter$2, k);
    return new Rgb$2(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  darker: function(k) {
    k = k == null ? darker$2 : Math.pow(darker$2, k);
    return new Rgb$2(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  rgb: function() {
    return this;
  },
  displayable: function() {
    return (-0.5 <= this.r && this.r < 255.5)
        && (-0.5 <= this.g && this.g < 255.5)
        && (-0.5 <= this.b && this.b < 255.5)
        && (0 <= this.opacity && this.opacity <= 1);
  },
  hex: rgb_formatHex$2, // Deprecated! Use color.formatHex.
  formatHex: rgb_formatHex$2,
  formatRgb: rgb_formatRgb$2,
  toString: rgb_formatRgb$2
}));

function rgb_formatHex$2() {
  return "#" + hex$2(this.r) + hex$2(this.g) + hex$2(this.b);
}

function rgb_formatRgb$2() {
  var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
  return (a === 1 ? "rgb(" : "rgba(")
      + Math.max(0, Math.min(255, Math.round(this.r) || 0)) + ", "
      + Math.max(0, Math.min(255, Math.round(this.g) || 0)) + ", "
      + Math.max(0, Math.min(255, Math.round(this.b) || 0))
      + (a === 1 ? ")" : ", " + a + ")");
}

function hex$2(value) {
  value = Math.max(0, Math.min(255, Math.round(value) || 0));
  return (value < 16 ? "0" : "") + value.toString(16);
}

function hsla$2(h, s, l, a) {
  if (a <= 0) h = s = l = NaN;
  else if (l <= 0 || l >= 1) h = s = NaN;
  else if (s <= 0) h = NaN;
  return new Hsl$2(h, s, l, a);
}

function hslConvert$2(o) {
  if (o instanceof Hsl$2) return new Hsl$2(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Color$2)) o = color$2(o);
  if (!o) return new Hsl$2;
  if (o instanceof Hsl$2) return o;
  o = o.rgb();
  var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      min = Math.min(r, g, b),
      max = Math.max(r, g, b),
      h = NaN,
      s = max - min,
      l = (max + min) / 2;
  if (s) {
    if (r === max) h = (g - b) / s + (g < b) * 6;
    else if (g === max) h = (b - r) / s + 2;
    else h = (r - g) / s + 4;
    s /= l < 0.5 ? max + min : 2 - max - min;
    h *= 60;
  } else {
    s = l > 0 && l < 1 ? 0 : h;
  }
  return new Hsl$2(h, s, l, o.opacity);
}

function hsl$2(h, s, l, opacity) {
  return arguments.length === 1 ? hslConvert$2(h) : new Hsl$2(h, s, l, opacity == null ? 1 : opacity);
}

function Hsl$2(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}

define$2(Hsl$2, hsl$2, extend$2(Color$2, {
  brighter: function(k) {
    k = k == null ? brighter$2 : Math.pow(brighter$2, k);
    return new Hsl$2(this.h, this.s, this.l * k, this.opacity);
  },
  darker: function(k) {
    k = k == null ? darker$2 : Math.pow(darker$2, k);
    return new Hsl$2(this.h, this.s, this.l * k, this.opacity);
  },
  rgb: function() {
    var h = this.h % 360 + (this.h < 0) * 360,
        s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
        l = this.l,
        m2 = l + (l < 0.5 ? l : 1 - l) * s,
        m1 = 2 * l - m2;
    return new Rgb$2(
      hsl2rgb$2(h >= 240 ? h - 240 : h + 120, m1, m2),
      hsl2rgb$2(h, m1, m2),
      hsl2rgb$2(h < 120 ? h + 240 : h - 120, m1, m2),
      this.opacity
    );
  },
  displayable: function() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s))
        && (0 <= this.l && this.l <= 1)
        && (0 <= this.opacity && this.opacity <= 1);
  },
  formatHsl: function() {
    var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
    return (a === 1 ? "hsl(" : "hsla(")
        + (this.h || 0) + ", "
        + (this.s || 0) * 100 + "%, "
        + (this.l || 0) * 100 + "%"
        + (a === 1 ? ")" : ", " + a + ")");
  }
}));

/* From FvD 13.37, CSS Color Module Level 3 */
function hsl2rgb$2(h, m1, m2) {
  return (h < 60 ? m1 + (m2 - m1) * h / 60
      : h < 180 ? m2
      : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
      : m1) * 255;
}

function constant$3(x) {
  return function() {
    return x;
  };
}

function linear$1(a, d) {
  return function(t) {
    return a + t * d;
  };
}

function exponential(a, b, y) {
  return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
    return Math.pow(a + t * b, y);
  };
}

function gamma(y) {
  return (y = +y) === 1 ? nogamma : function(a, b) {
    return b - a ? exponential(a, b, y) : constant$3(isNaN(a) ? b : a);
  };
}

function nogamma(a, b) {
  var d = b - a;
  return d ? linear$1(a, d) : constant$3(isNaN(a) ? b : a);
}

var interpolateRgb = (function rgbGamma(y) {
  var color = gamma(y);

  function rgb(start, end) {
    var r = color((start = rgb$2(start)).r, (end = rgb$2(end)).r),
        g = color(start.g, end.g),
        b = color(start.b, end.b),
        opacity = nogamma(start.opacity, end.opacity);
    return function(t) {
      start.r = r(t);
      start.g = g(t);
      start.b = b(t);
      start.opacity = opacity(t);
      return start + "";
    };
  }

  rgb.gamma = rgbGamma;

  return rgb;
})(1);

function numberArray(a, b) {
  if (!b) b = [];
  var n = a ? Math.min(b.length, a.length) : 0,
      c = b.slice(),
      i;
  return function(t) {
    for (i = 0; i < n; ++i) c[i] = a[i] * (1 - t) + b[i] * t;
    return c;
  };
}

function isNumberArray(x) {
  return ArrayBuffer.isView(x) && !(x instanceof DataView);
}

function genericArray(a, b) {
  var nb = b ? b.length : 0,
      na = a ? Math.min(nb, a.length) : 0,
      x = new Array(na),
      c = new Array(nb),
      i;

  for (i = 0; i < na; ++i) x[i] = interpolateValue(a[i], b[i]);
  for (; i < nb; ++i) c[i] = b[i];

  return function(t) {
    for (i = 0; i < na; ++i) c[i] = x[i](t);
    return c;
  };
}

function date(a, b) {
  var d = new Date;
  return a = +a, b = +b, function(t) {
    return d.setTime(a * (1 - t) + b * t), d;
  };
}

function interpolateNumber(a, b) {
  return a = +a, b = +b, function(t) {
    return a * (1 - t) + b * t;
  };
}

function object(a, b) {
  var i = {},
      c = {},
      k;

  if (a === null || typeof a !== "object") a = {};
  if (b === null || typeof b !== "object") b = {};

  for (k in b) {
    if (k in a) {
      i[k] = interpolateValue(a[k], b[k]);
    } else {
      c[k] = b[k];
    }
  }

  return function(t) {
    for (k in i) c[k] = i[k](t);
    return c;
  };
}

var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,
    reB = new RegExp(reA.source, "g");

function zero(b) {
  return function() {
    return b;
  };
}

function one(b) {
  return function(t) {
    return b(t) + "";
  };
}

function interpolateString(a, b) {
  var bi = reA.lastIndex = reB.lastIndex = 0, // scan index for next number in b
      am, // current match in a
      bm, // current match in b
      bs, // string preceding current number in b, if any
      i = -1, // index in s
      s = [], // string constants and placeholders
      q = []; // number interpolators

  // Coerce inputs to strings.
  a = a + "", b = b + "";

  // Interpolate pairs of numbers in a & b.
  while ((am = reA.exec(a))
      && (bm = reB.exec(b))) {
    if ((bs = bm.index) > bi) { // a string precedes the next number in b
      bs = b.slice(bi, bs);
      if (s[i]) s[i] += bs; // coalesce with previous string
      else s[++i] = bs;
    }
    if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
      if (s[i]) s[i] += bm; // coalesce with previous string
      else s[++i] = bm;
    } else { // interpolate non-matching numbers
      s[++i] = null;
      q.push({i: i, x: interpolateNumber(am, bm)});
    }
    bi = reB.lastIndex;
  }

  // Add remains of b.
  if (bi < b.length) {
    bs = b.slice(bi);
    if (s[i]) s[i] += bs; // coalesce with previous string
    else s[++i] = bs;
  }

  // Special optimization for only a single match.
  // Otherwise, interpolate each of the numbers and rejoin the string.
  return s.length < 2 ? (q[0]
      ? one(q[0].x)
      : zero(b))
      : (b = q.length, function(t) {
          for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
          return s.join("");
        });
}

function interpolateValue(a, b) {
  var t = typeof b, c;
  return b == null || t === "boolean" ? constant$3(b)
      : (t === "number" ? interpolateNumber
      : t === "string" ? ((c = color$2(b)) ? (b = c, interpolateRgb) : interpolateString)
      : b instanceof color$2 ? interpolateRgb
      : b instanceof Date ? date
      : isNumberArray(b) ? numberArray
      : Array.isArray(b) ? genericArray
      : typeof b.valueOf !== "function" && typeof b.toString !== "function" || isNaN(b) ? object
      : interpolateNumber)(a, b);
}

function interpolateRound(a, b) {
  return a = +a, b = +b, function(t) {
    return Math.round(a * (1 - t) + b * t);
  };
}

var degrees = 180 / Math.PI;

var identity$2 = {
  translateX: 0,
  translateY: 0,
  rotate: 0,
  skewX: 0,
  scaleX: 1,
  scaleY: 1
};

function decompose(a, b, c, d, e, f) {
  var scaleX, scaleY, skewX;
  if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
  if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
  if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
  if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
  return {
    translateX: e,
    translateY: f,
    rotate: Math.atan2(b, a) * degrees,
    skewX: Math.atan(skewX) * degrees,
    scaleX: scaleX,
    scaleY: scaleY
  };
}

var cssNode,
    cssRoot,
    cssView,
    svgNode;

function parseCss(value) {
  if (value === "none") return identity$2;
  if (!cssNode) cssNode = document.createElement("DIV"), cssRoot = document.documentElement, cssView = document.defaultView;
  cssNode.style.transform = value;
  value = cssView.getComputedStyle(cssRoot.appendChild(cssNode), null).getPropertyValue("transform");
  cssRoot.removeChild(cssNode);
  value = value.slice(7, -1).split(",");
  return decompose(+value[0], +value[1], +value[2], +value[3], +value[4], +value[5]);
}

function parseSvg(value) {
  if (value == null) return identity$2;
  if (!svgNode) svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
  svgNode.setAttribute("transform", value);
  if (!(value = svgNode.transform.baseVal.consolidate())) return identity$2;
  value = value.matrix;
  return decompose(value.a, value.b, value.c, value.d, value.e, value.f);
}

function interpolateTransform(parse, pxComma, pxParen, degParen) {

  function pop(s) {
    return s.length ? s.pop() + " " : "";
  }

  function translate(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push("translate(", null, pxComma, null, pxParen);
      q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
    } else if (xb || yb) {
      s.push("translate(" + xb + pxComma + yb + pxParen);
    }
  }

  function rotate(a, b, s, q) {
    if (a !== b) {
      if (a - b > 180) b += 360; else if (b - a > 180) a += 360; // shortest path
      q.push({i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: interpolateNumber(a, b)});
    } else if (b) {
      s.push(pop(s) + "rotate(" + b + degParen);
    }
  }

  function skewX(a, b, s, q) {
    if (a !== b) {
      q.push({i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: interpolateNumber(a, b)});
    } else if (b) {
      s.push(pop(s) + "skewX(" + b + degParen);
    }
  }

  function scale(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push(pop(s) + "scale(", null, ",", null, ")");
      q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
    } else if (xb !== 1 || yb !== 1) {
      s.push(pop(s) + "scale(" + xb + "," + yb + ")");
    }
  }

  return function(a, b) {
    var s = [], // string constants and placeholders
        q = []; // number interpolators
    a = parse(a), b = parse(b);
    translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q);
    rotate(a.rotate, b.rotate, s, q);
    skewX(a.skewX, b.skewX, s, q);
    scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q);
    a = b = null; // gc
    return function(t) {
      var i = -1, n = q.length, o;
      while (++i < n) s[(o = q[i]).i] = o.x(t);
      return s.join("");
    };
  };
}

var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");

var frame = 0, // is an animation frame pending?
    timeout$1 = 0, // is a timeout pending?
    interval = 0, // are any timers active?
    pokeDelay = 1000, // how frequently we check for clock skew
    taskHead,
    taskTail,
    clockLast = 0,
    clockNow = 0,
    clockSkew = 0,
    clock = typeof performance === "object" && performance.now ? performance : Date,
    setFrame = typeof window === "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(f) { setTimeout(f, 17); };

function now() {
  return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
}

function clearNow() {
  clockNow = 0;
}

function Timer() {
  this._call =
  this._time =
  this._next = null;
}

Timer.prototype = timer.prototype = {
  constructor: Timer,
  restart: function(callback, delay, time) {
    if (typeof callback !== "function") throw new TypeError("callback is not a function");
    time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
    if (!this._next && taskTail !== this) {
      if (taskTail) taskTail._next = this;
      else taskHead = this;
      taskTail = this;
    }
    this._call = callback;
    this._time = time;
    sleep();
  },
  stop: function() {
    if (this._call) {
      this._call = null;
      this._time = Infinity;
      sleep();
    }
  }
};

function timer(callback, delay, time) {
  var t = new Timer;
  t.restart(callback, delay, time);
  return t;
}

function timerFlush() {
  now(); // Get the current time, if not already set.
  ++frame; // Pretend we’ve set an alarm, if we haven’t already.
  var t = taskHead, e;
  while (t) {
    if ((e = clockNow - t._time) >= 0) t._call.call(null, e);
    t = t._next;
  }
  --frame;
}

function wake() {
  clockNow = (clockLast = clock.now()) + clockSkew;
  frame = timeout$1 = 0;
  try {
    timerFlush();
  } finally {
    frame = 0;
    nap();
    clockNow = 0;
  }
}

function poke() {
  var now = clock.now(), delay = now - clockLast;
  if (delay > pokeDelay) clockSkew -= delay, clockLast = now;
}

function nap() {
  var t0, t1 = taskHead, t2, time = Infinity;
  while (t1) {
    if (t1._call) {
      if (time > t1._time) time = t1._time;
      t0 = t1, t1 = t1._next;
    } else {
      t2 = t1._next, t1._next = null;
      t1 = t0 ? t0._next = t2 : taskHead = t2;
    }
  }
  taskTail = t0;
  sleep(time);
}

function sleep(time) {
  if (frame) return; // Soonest alarm already set, or will be.
  if (timeout$1) timeout$1 = clearTimeout(timeout$1);
  var delay = time - clockNow; // Strictly less than if we recomputed clockNow.
  if (delay > 24) {
    if (time < Infinity) timeout$1 = setTimeout(wake, time - clock.now() - clockSkew);
    if (interval) interval = clearInterval(interval);
  } else {
    if (!interval) clockLast = clock.now(), interval = setInterval(poke, pokeDelay);
    frame = 1, setFrame(wake);
  }
}

function timeout(callback, delay, time) {
  var t = new Timer;
  delay = delay == null ? 0 : +delay;
  t.restart(function(elapsed) {
    t.stop();
    callback(elapsed + delay);
  }, delay, time);
  return t;
}

var emptyOn = dispatch("start", "end", "cancel", "interrupt");
var emptyTween = [];

var CREATED = 0;
var SCHEDULED = 1;
var STARTING = 2;
var STARTED = 3;
var RUNNING = 4;
var ENDING = 5;
var ENDED = 6;

function schedule(node, name, id, index, group, timing) {
  var schedules = node.__transition;
  if (!schedules) node.__transition = {};
  else if (id in schedules) return;
  create(node, id, {
    name: name,
    index: index, // For context during callback.
    group: group, // For context during callback.
    on: emptyOn,
    tween: emptyTween,
    time: timing.time,
    delay: timing.delay,
    duration: timing.duration,
    ease: timing.ease,
    timer: null,
    state: CREATED
  });
}

function init(node, id) {
  var schedule = get(node, id);
  if (schedule.state > CREATED) throw new Error("too late; already scheduled");
  return schedule;
}

function set(node, id) {
  var schedule = get(node, id);
  if (schedule.state > STARTED) throw new Error("too late; already running");
  return schedule;
}

function get(node, id) {
  var schedule = node.__transition;
  if (!schedule || !(schedule = schedule[id])) throw new Error("transition not found");
  return schedule;
}

function create(node, id, self) {
  var schedules = node.__transition,
      tween;

  // Initialize the self timer when the transition is created.
  // Note the actual delay is not known until the first callback!
  schedules[id] = self;
  self.timer = timer(schedule, 0, self.time);

  function schedule(elapsed) {
    self.state = SCHEDULED;
    self.timer.restart(start, self.delay, self.time);

    // If the elapsed delay is less than our first sleep, start immediately.
    if (self.delay <= elapsed) start(elapsed - self.delay);
  }

  function start(elapsed) {
    var i, j, n, o;

    // If the state is not SCHEDULED, then we previously errored on start.
    if (self.state !== SCHEDULED) return stop();

    for (i in schedules) {
      o = schedules[i];
      if (o.name !== self.name) continue;

      // While this element already has a starting transition during this frame,
      // defer starting an interrupting transition until that transition has a
      // chance to tick (and possibly end); see d3/d3-transition#54!
      if (o.state === STARTED) return timeout(start);

      // Interrupt the active transition, if any.
      if (o.state === RUNNING) {
        o.state = ENDED;
        o.timer.stop();
        o.on.call("interrupt", node, node.__data__, o.index, o.group);
        delete schedules[i];
      }

      // Cancel any pre-empted transitions.
      else if (+i < id) {
        o.state = ENDED;
        o.timer.stop();
        o.on.call("cancel", node, node.__data__, o.index, o.group);
        delete schedules[i];
      }
    }

    // Defer the first tick to end of the current frame; see d3/d3#1576.
    // Note the transition may be canceled after start and before the first tick!
    // Note this must be scheduled before the start event; see d3/d3-transition#16!
    // Assuming this is successful, subsequent callbacks go straight to tick.
    timeout(function() {
      if (self.state === STARTED) {
        self.state = RUNNING;
        self.timer.restart(tick, self.delay, self.time);
        tick(elapsed);
      }
    });

    // Dispatch the start event.
    // Note this must be done before the tween are initialized.
    self.state = STARTING;
    self.on.call("start", node, node.__data__, self.index, self.group);
    if (self.state !== STARTING) return; // interrupted
    self.state = STARTED;

    // Initialize the tween, deleting null tween.
    tween = new Array(n = self.tween.length);
    for (i = 0, j = -1; i < n; ++i) {
      if (o = self.tween[i].value.call(node, node.__data__, self.index, self.group)) {
        tween[++j] = o;
      }
    }
    tween.length = j + 1;
  }

  function tick(elapsed) {
    var t = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.timer.restart(stop), self.state = ENDING, 1),
        i = -1,
        n = tween.length;

    while (++i < n) {
      tween[i].call(node, t);
    }

    // Dispatch the end event.
    if (self.state === ENDING) {
      self.on.call("end", node, node.__data__, self.index, self.group);
      stop();
    }
  }

  function stop() {
    self.state = ENDED;
    self.timer.stop();
    delete schedules[id];
    for (var i in schedules) return; // eslint-disable-line no-unused-vars
    delete node.__transition;
  }
}

function interrupt(node, name) {
  var schedules = node.__transition,
      schedule,
      active,
      empty = true,
      i;

  if (!schedules) return;

  name = name == null ? null : name + "";

  for (i in schedules) {
    if ((schedule = schedules[i]).name !== name) { empty = false; continue; }
    active = schedule.state > STARTING && schedule.state < ENDING;
    schedule.state = ENDED;
    schedule.timer.stop();
    schedule.on.call(active ? "interrupt" : "cancel", node, node.__data__, schedule.index, schedule.group);
    delete schedules[i];
  }

  if (empty) delete node.__transition;
}

function selection_interrupt(name) {
  return this.each(function() {
    interrupt(this, name);
  });
}

function tweenRemove(id, name) {
  var tween0, tween1;
  return function() {
    var schedule = set(this, id),
        tween = schedule.tween;

    // If this node shared tween with the previous node,
    // just assign the updated shared tween and we’re done!
    // Otherwise, copy-on-write.
    if (tween !== tween0) {
      tween1 = tween0 = tween;
      for (var i = 0, n = tween1.length; i < n; ++i) {
        if (tween1[i].name === name) {
          tween1 = tween1.slice();
          tween1.splice(i, 1);
          break;
        }
      }
    }

    schedule.tween = tween1;
  };
}

function tweenFunction(id, name, value) {
  var tween0, tween1;
  if (typeof value !== "function") throw new Error;
  return function() {
    var schedule = set(this, id),
        tween = schedule.tween;

    // If this node shared tween with the previous node,
    // just assign the updated shared tween and we’re done!
    // Otherwise, copy-on-write.
    if (tween !== tween0) {
      tween1 = (tween0 = tween).slice();
      for (var t = {name: name, value: value}, i = 0, n = tween1.length; i < n; ++i) {
        if (tween1[i].name === name) {
          tween1[i] = t;
          break;
        }
      }
      if (i === n) tween1.push(t);
    }

    schedule.tween = tween1;
  };
}

function transition_tween(name, value) {
  var id = this._id;

  name += "";

  if (arguments.length < 2) {
    var tween = get(this.node(), id).tween;
    for (var i = 0, n = tween.length, t; i < n; ++i) {
      if ((t = tween[i]).name === name) {
        return t.value;
      }
    }
    return null;
  }

  return this.each((value == null ? tweenRemove : tweenFunction)(id, name, value));
}

function tweenValue(transition, name, value) {
  var id = transition._id;

  transition.each(function() {
    var schedule = set(this, id);
    (schedule.value || (schedule.value = {}))[name] = value.apply(this, arguments);
  });

  return function(node) {
    return get(node, id).value[name];
  };
}

function define$1(constructor, factory, prototype) {
  constructor.prototype = factory.prototype = prototype;
  prototype.constructor = constructor;
}

function extend$1(parent, definition) {
  var prototype = Object.create(parent.prototype);
  for (var key in definition) prototype[key] = definition[key];
  return prototype;
}

function Color$1() {}

var darker$1 = 0.7;
var brighter$1 = 1 / darker$1;

var reI$1 = "\\s*([+-]?\\d+)\\s*",
    reN$1 = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\s*",
    reP$1 = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)%\\s*",
    reHex$1 = /^#([0-9a-f]{3,8})$/,
    reRgbInteger$1 = new RegExp("^rgb\\(" + [reI$1, reI$1, reI$1] + "\\)$"),
    reRgbPercent$1 = new RegExp("^rgb\\(" + [reP$1, reP$1, reP$1] + "\\)$"),
    reRgbaInteger$1 = new RegExp("^rgba\\(" + [reI$1, reI$1, reI$1, reN$1] + "\\)$"),
    reRgbaPercent$1 = new RegExp("^rgba\\(" + [reP$1, reP$1, reP$1, reN$1] + "\\)$"),
    reHslPercent$1 = new RegExp("^hsl\\(" + [reN$1, reP$1, reP$1] + "\\)$"),
    reHslaPercent$1 = new RegExp("^hsla\\(" + [reN$1, reP$1, reP$1, reN$1] + "\\)$");

var named$1 = {
  aliceblue: 0xf0f8ff,
  antiquewhite: 0xfaebd7,
  aqua: 0x00ffff,
  aquamarine: 0x7fffd4,
  azure: 0xf0ffff,
  beige: 0xf5f5dc,
  bisque: 0xffe4c4,
  black: 0x000000,
  blanchedalmond: 0xffebcd,
  blue: 0x0000ff,
  blueviolet: 0x8a2be2,
  brown: 0xa52a2a,
  burlywood: 0xdeb887,
  cadetblue: 0x5f9ea0,
  chartreuse: 0x7fff00,
  chocolate: 0xd2691e,
  coral: 0xff7f50,
  cornflowerblue: 0x6495ed,
  cornsilk: 0xfff8dc,
  crimson: 0xdc143c,
  cyan: 0x00ffff,
  darkblue: 0x00008b,
  darkcyan: 0x008b8b,
  darkgoldenrod: 0xb8860b,
  darkgray: 0xa9a9a9,
  darkgreen: 0x006400,
  darkgrey: 0xa9a9a9,
  darkkhaki: 0xbdb76b,
  darkmagenta: 0x8b008b,
  darkolivegreen: 0x556b2f,
  darkorange: 0xff8c00,
  darkorchid: 0x9932cc,
  darkred: 0x8b0000,
  darksalmon: 0xe9967a,
  darkseagreen: 0x8fbc8f,
  darkslateblue: 0x483d8b,
  darkslategray: 0x2f4f4f,
  darkslategrey: 0x2f4f4f,
  darkturquoise: 0x00ced1,
  darkviolet: 0x9400d3,
  deeppink: 0xff1493,
  deepskyblue: 0x00bfff,
  dimgray: 0x696969,
  dimgrey: 0x696969,
  dodgerblue: 0x1e90ff,
  firebrick: 0xb22222,
  floralwhite: 0xfffaf0,
  forestgreen: 0x228b22,
  fuchsia: 0xff00ff,
  gainsboro: 0xdcdcdc,
  ghostwhite: 0xf8f8ff,
  gold: 0xffd700,
  goldenrod: 0xdaa520,
  gray: 0x808080,
  green: 0x008000,
  greenyellow: 0xadff2f,
  grey: 0x808080,
  honeydew: 0xf0fff0,
  hotpink: 0xff69b4,
  indianred: 0xcd5c5c,
  indigo: 0x4b0082,
  ivory: 0xfffff0,
  khaki: 0xf0e68c,
  lavender: 0xe6e6fa,
  lavenderblush: 0xfff0f5,
  lawngreen: 0x7cfc00,
  lemonchiffon: 0xfffacd,
  lightblue: 0xadd8e6,
  lightcoral: 0xf08080,
  lightcyan: 0xe0ffff,
  lightgoldenrodyellow: 0xfafad2,
  lightgray: 0xd3d3d3,
  lightgreen: 0x90ee90,
  lightgrey: 0xd3d3d3,
  lightpink: 0xffb6c1,
  lightsalmon: 0xffa07a,
  lightseagreen: 0x20b2aa,
  lightskyblue: 0x87cefa,
  lightslategray: 0x778899,
  lightslategrey: 0x778899,
  lightsteelblue: 0xb0c4de,
  lightyellow: 0xffffe0,
  lime: 0x00ff00,
  limegreen: 0x32cd32,
  linen: 0xfaf0e6,
  magenta: 0xff00ff,
  maroon: 0x800000,
  mediumaquamarine: 0x66cdaa,
  mediumblue: 0x0000cd,
  mediumorchid: 0xba55d3,
  mediumpurple: 0x9370db,
  mediumseagreen: 0x3cb371,
  mediumslateblue: 0x7b68ee,
  mediumspringgreen: 0x00fa9a,
  mediumturquoise: 0x48d1cc,
  mediumvioletred: 0xc71585,
  midnightblue: 0x191970,
  mintcream: 0xf5fffa,
  mistyrose: 0xffe4e1,
  moccasin: 0xffe4b5,
  navajowhite: 0xffdead,
  navy: 0x000080,
  oldlace: 0xfdf5e6,
  olive: 0x808000,
  olivedrab: 0x6b8e23,
  orange: 0xffa500,
  orangered: 0xff4500,
  orchid: 0xda70d6,
  palegoldenrod: 0xeee8aa,
  palegreen: 0x98fb98,
  paleturquoise: 0xafeeee,
  palevioletred: 0xdb7093,
  papayawhip: 0xffefd5,
  peachpuff: 0xffdab9,
  peru: 0xcd853f,
  pink: 0xffc0cb,
  plum: 0xdda0dd,
  powderblue: 0xb0e0e6,
  purple: 0x800080,
  rebeccapurple: 0x663399,
  red: 0xff0000,
  rosybrown: 0xbc8f8f,
  royalblue: 0x4169e1,
  saddlebrown: 0x8b4513,
  salmon: 0xfa8072,
  sandybrown: 0xf4a460,
  seagreen: 0x2e8b57,
  seashell: 0xfff5ee,
  sienna: 0xa0522d,
  silver: 0xc0c0c0,
  skyblue: 0x87ceeb,
  slateblue: 0x6a5acd,
  slategray: 0x708090,
  slategrey: 0x708090,
  snow: 0xfffafa,
  springgreen: 0x00ff7f,
  steelblue: 0x4682b4,
  tan: 0xd2b48c,
  teal: 0x008080,
  thistle: 0xd8bfd8,
  tomato: 0xff6347,
  turquoise: 0x40e0d0,
  violet: 0xee82ee,
  wheat: 0xf5deb3,
  white: 0xffffff,
  whitesmoke: 0xf5f5f5,
  yellow: 0xffff00,
  yellowgreen: 0x9acd32
};

define$1(Color$1, color$1, {
  copy: function(channels) {
    return Object.assign(new this.constructor, this, channels);
  },
  displayable: function() {
    return this.rgb().displayable();
  },
  hex: color_formatHex$1, // Deprecated! Use color.formatHex.
  formatHex: color_formatHex$1,
  formatHsl: color_formatHsl$1,
  formatRgb: color_formatRgb$1,
  toString: color_formatRgb$1
});

function color_formatHex$1() {
  return this.rgb().formatHex();
}

function color_formatHsl$1() {
  return hslConvert$1(this).formatHsl();
}

function color_formatRgb$1() {
  return this.rgb().formatRgb();
}

function color$1(format) {
  var m, l;
  format = (format + "").trim().toLowerCase();
  return (m = reHex$1.exec(format)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn$1(m) // #ff0000
      : l === 3 ? new Rgb$1((m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1) // #f00
      : l === 8 ? rgba$1(m >> 24 & 0xff, m >> 16 & 0xff, m >> 8 & 0xff, (m & 0xff) / 0xff) // #ff000000
      : l === 4 ? rgba$1((m >> 12 & 0xf) | (m >> 8 & 0xf0), (m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), (((m & 0xf) << 4) | (m & 0xf)) / 0xff) // #f000
      : null) // invalid hex
      : (m = reRgbInteger$1.exec(format)) ? new Rgb$1(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
      : (m = reRgbPercent$1.exec(format)) ? new Rgb$1(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
      : (m = reRgbaInteger$1.exec(format)) ? rgba$1(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
      : (m = reRgbaPercent$1.exec(format)) ? rgba$1(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
      : (m = reHslPercent$1.exec(format)) ? hsla$1(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
      : (m = reHslaPercent$1.exec(format)) ? hsla$1(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
      : named$1.hasOwnProperty(format) ? rgbn$1(named$1[format]) // eslint-disable-line no-prototype-builtins
      : format === "transparent" ? new Rgb$1(NaN, NaN, NaN, 0)
      : null;
}

function rgbn$1(n) {
  return new Rgb$1(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
}

function rgba$1(r, g, b, a) {
  if (a <= 0) r = g = b = NaN;
  return new Rgb$1(r, g, b, a);
}

function rgbConvert$1(o) {
  if (!(o instanceof Color$1)) o = color$1(o);
  if (!o) return new Rgb$1;
  o = o.rgb();
  return new Rgb$1(o.r, o.g, o.b, o.opacity);
}

function rgb$1(r, g, b, opacity) {
  return arguments.length === 1 ? rgbConvert$1(r) : new Rgb$1(r, g, b, opacity == null ? 1 : opacity);
}

function Rgb$1(r, g, b, opacity) {
  this.r = +r;
  this.g = +g;
  this.b = +b;
  this.opacity = +opacity;
}

define$1(Rgb$1, rgb$1, extend$1(Color$1, {
  brighter: function(k) {
    k = k == null ? brighter$1 : Math.pow(brighter$1, k);
    return new Rgb$1(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  darker: function(k) {
    k = k == null ? darker$1 : Math.pow(darker$1, k);
    return new Rgb$1(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  rgb: function() {
    return this;
  },
  displayable: function() {
    return (-0.5 <= this.r && this.r < 255.5)
        && (-0.5 <= this.g && this.g < 255.5)
        && (-0.5 <= this.b && this.b < 255.5)
        && (0 <= this.opacity && this.opacity <= 1);
  },
  hex: rgb_formatHex$1, // Deprecated! Use color.formatHex.
  formatHex: rgb_formatHex$1,
  formatRgb: rgb_formatRgb$1,
  toString: rgb_formatRgb$1
}));

function rgb_formatHex$1() {
  return "#" + hex$1(this.r) + hex$1(this.g) + hex$1(this.b);
}

function rgb_formatRgb$1() {
  var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
  return (a === 1 ? "rgb(" : "rgba(")
      + Math.max(0, Math.min(255, Math.round(this.r) || 0)) + ", "
      + Math.max(0, Math.min(255, Math.round(this.g) || 0)) + ", "
      + Math.max(0, Math.min(255, Math.round(this.b) || 0))
      + (a === 1 ? ")" : ", " + a + ")");
}

function hex$1(value) {
  value = Math.max(0, Math.min(255, Math.round(value) || 0));
  return (value < 16 ? "0" : "") + value.toString(16);
}

function hsla$1(h, s, l, a) {
  if (a <= 0) h = s = l = NaN;
  else if (l <= 0 || l >= 1) h = s = NaN;
  else if (s <= 0) h = NaN;
  return new Hsl$1(h, s, l, a);
}

function hslConvert$1(o) {
  if (o instanceof Hsl$1) return new Hsl$1(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Color$1)) o = color$1(o);
  if (!o) return new Hsl$1;
  if (o instanceof Hsl$1) return o;
  o = o.rgb();
  var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      min = Math.min(r, g, b),
      max = Math.max(r, g, b),
      h = NaN,
      s = max - min,
      l = (max + min) / 2;
  if (s) {
    if (r === max) h = (g - b) / s + (g < b) * 6;
    else if (g === max) h = (b - r) / s + 2;
    else h = (r - g) / s + 4;
    s /= l < 0.5 ? max + min : 2 - max - min;
    h *= 60;
  } else {
    s = l > 0 && l < 1 ? 0 : h;
  }
  return new Hsl$1(h, s, l, o.opacity);
}

function hsl$1(h, s, l, opacity) {
  return arguments.length === 1 ? hslConvert$1(h) : new Hsl$1(h, s, l, opacity == null ? 1 : opacity);
}

function Hsl$1(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}

define$1(Hsl$1, hsl$1, extend$1(Color$1, {
  brighter: function(k) {
    k = k == null ? brighter$1 : Math.pow(brighter$1, k);
    return new Hsl$1(this.h, this.s, this.l * k, this.opacity);
  },
  darker: function(k) {
    k = k == null ? darker$1 : Math.pow(darker$1, k);
    return new Hsl$1(this.h, this.s, this.l * k, this.opacity);
  },
  rgb: function() {
    var h = this.h % 360 + (this.h < 0) * 360,
        s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
        l = this.l,
        m2 = l + (l < 0.5 ? l : 1 - l) * s,
        m1 = 2 * l - m2;
    return new Rgb$1(
      hsl2rgb$1(h >= 240 ? h - 240 : h + 120, m1, m2),
      hsl2rgb$1(h, m1, m2),
      hsl2rgb$1(h < 120 ? h + 240 : h - 120, m1, m2),
      this.opacity
    );
  },
  displayable: function() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s))
        && (0 <= this.l && this.l <= 1)
        && (0 <= this.opacity && this.opacity <= 1);
  },
  formatHsl: function() {
    var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
    return (a === 1 ? "hsl(" : "hsla(")
        + (this.h || 0) + ", "
        + (this.s || 0) * 100 + "%, "
        + (this.l || 0) * 100 + "%"
        + (a === 1 ? ")" : ", " + a + ")");
  }
}));

/* From FvD 13.37, CSS Color Module Level 3 */
function hsl2rgb$1(h, m1, m2) {
  return (h < 60 ? m1 + (m2 - m1) * h / 60
      : h < 180 ? m2
      : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
      : m1) * 255;
}

function interpolate(a, b) {
  var c;
  return (typeof b === "number" ? interpolateNumber
      : b instanceof color$1 ? interpolateRgb
      : (c = color$1(b)) ? (b = c, interpolateRgb)
      : interpolateString)(a, b);
}

function attrRemove(name) {
  return function() {
    this.removeAttribute(name);
  };
}

function attrRemoveNS(fullname) {
  return function() {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}

function attrConstant(name, interpolate, value1) {
  var string00,
      string1 = value1 + "",
      interpolate0;
  return function() {
    var string0 = this.getAttribute(name);
    return string0 === string1 ? null
        : string0 === string00 ? interpolate0
        : interpolate0 = interpolate(string00 = string0, value1);
  };
}

function attrConstantNS(fullname, interpolate, value1) {
  var string00,
      string1 = value1 + "",
      interpolate0;
  return function() {
    var string0 = this.getAttributeNS(fullname.space, fullname.local);
    return string0 === string1 ? null
        : string0 === string00 ? interpolate0
        : interpolate0 = interpolate(string00 = string0, value1);
  };
}

function attrFunction(name, interpolate, value) {
  var string00,
      string10,
      interpolate0;
  return function() {
    var string0, value1 = value(this), string1;
    if (value1 == null) return void this.removeAttribute(name);
    string0 = this.getAttribute(name);
    string1 = value1 + "";
    return string0 === string1 ? null
        : string0 === string00 && string1 === string10 ? interpolate0
        : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
  };
}

function attrFunctionNS(fullname, interpolate, value) {
  var string00,
      string10,
      interpolate0;
  return function() {
    var string0, value1 = value(this), string1;
    if (value1 == null) return void this.removeAttributeNS(fullname.space, fullname.local);
    string0 = this.getAttributeNS(fullname.space, fullname.local);
    string1 = value1 + "";
    return string0 === string1 ? null
        : string0 === string00 && string1 === string10 ? interpolate0
        : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
  };
}

function transition_attr(name, value) {
  var fullname = namespace(name), i = fullname === "transform" ? interpolateTransformSvg : interpolate;
  return this.attrTween(name, typeof value === "function"
      ? (fullname.local ? attrFunctionNS : attrFunction)(fullname, i, tweenValue(this, "attr." + name, value))
      : value == null ? (fullname.local ? attrRemoveNS : attrRemove)(fullname)
      : (fullname.local ? attrConstantNS : attrConstant)(fullname, i, value));
}

function attrInterpolate(name, i) {
  return function(t) {
    this.setAttribute(name, i.call(this, t));
  };
}

function attrInterpolateNS(fullname, i) {
  return function(t) {
    this.setAttributeNS(fullname.space, fullname.local, i.call(this, t));
  };
}

function attrTweenNS(fullname, value) {
  var t0, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0) t0 = (i0 = i) && attrInterpolateNS(fullname, i);
    return t0;
  }
  tween._value = value;
  return tween;
}

function attrTween(name, value) {
  var t0, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0) t0 = (i0 = i) && attrInterpolate(name, i);
    return t0;
  }
  tween._value = value;
  return tween;
}

function transition_attrTween(name, value) {
  var key = "attr." + name;
  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error;
  var fullname = namespace(name);
  return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value));
}

function delayFunction(id, value) {
  return function() {
    init(this, id).delay = +value.apply(this, arguments);
  };
}

function delayConstant(id, value) {
  return value = +value, function() {
    init(this, id).delay = value;
  };
}

function transition_delay(value) {
  var id = this._id;

  return arguments.length
      ? this.each((typeof value === "function"
          ? delayFunction
          : delayConstant)(id, value))
      : get(this.node(), id).delay;
}

function durationFunction(id, value) {
  return function() {
    set(this, id).duration = +value.apply(this, arguments);
  };
}

function durationConstant(id, value) {
  return value = +value, function() {
    set(this, id).duration = value;
  };
}

function transition_duration(value) {
  var id = this._id;

  return arguments.length
      ? this.each((typeof value === "function"
          ? durationFunction
          : durationConstant)(id, value))
      : get(this.node(), id).duration;
}

function easeConstant(id, value) {
  if (typeof value !== "function") throw new Error;
  return function() {
    set(this, id).ease = value;
  };
}

function transition_ease(value) {
  var id = this._id;

  return arguments.length
      ? this.each(easeConstant(id, value))
      : get(this.node(), id).ease;
}

function transition_filter(match) {
  if (typeof match !== "function") match = matcher(match);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }

  return new Transition(subgroups, this._parents, this._name, this._id);
}

function transition_merge(transition) {
  if (transition._id !== this._id) throw new Error;

  for (var groups0 = this._groups, groups1 = transition._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge[i] = node;
      }
    }
  }

  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }

  return new Transition(merges, this._parents, this._name, this._id);
}

function start(name) {
  return (name + "").trim().split(/^|\s+/).every(function(t) {
    var i = t.indexOf(".");
    if (i >= 0) t = t.slice(0, i);
    return !t || t === "start";
  });
}

function onFunction(id, name, listener) {
  var on0, on1, sit = start(name) ? init : set;
  return function() {
    var schedule = sit(this, id),
        on = schedule.on;

    // If this node shared a dispatch with the previous node,
    // just assign the updated shared dispatch and we’re done!
    // Otherwise, copy-on-write.
    if (on !== on0) (on1 = (on0 = on).copy()).on(name, listener);

    schedule.on = on1;
  };
}

function transition_on(name, listener) {
  var id = this._id;

  return arguments.length < 2
      ? get(this.node(), id).on.on(name)
      : this.each(onFunction(id, name, listener));
}

function removeFunction(id) {
  return function() {
    var parent = this.parentNode;
    for (var i in this.__transition) if (+i !== id) return;
    if (parent) parent.removeChild(this);
  };
}

function transition_remove() {
  return this.on("end.remove", removeFunction(this._id));
}

function transition_select(select) {
  var name = this._name,
      id = this._id;

  if (typeof select !== "function") select = selector(select);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
        schedule(subgroup[i], name, id, i, subgroup, get(node, id));
      }
    }
  }

  return new Transition(subgroups, this._parents, name, id);
}

function transition_selectAll(select) {
  var name = this._name,
      id = this._id;

  if (typeof select !== "function") select = selectorAll(select);

  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        for (var children = select.call(node, node.__data__, i, group), child, inherit = get(node, id), k = 0, l = children.length; k < l; ++k) {
          if (child = children[k]) {
            schedule(child, name, id, k, children, inherit);
          }
        }
        subgroups.push(children);
        parents.push(node);
      }
    }
  }

  return new Transition(subgroups, parents, name, id);
}

var Selection = selection.prototype.constructor;

function transition_selection() {
  return new Selection(this._groups, this._parents);
}

function styleNull(name, interpolate) {
  var string00,
      string10,
      interpolate0;
  return function() {
    var string0 = styleValue(this, name),
        string1 = (this.style.removeProperty(name), styleValue(this, name));
    return string0 === string1 ? null
        : string0 === string00 && string1 === string10 ? interpolate0
        : interpolate0 = interpolate(string00 = string0, string10 = string1);
  };
}

function styleRemove(name) {
  return function() {
    this.style.removeProperty(name);
  };
}

function styleConstant(name, interpolate, value1) {
  var string00,
      string1 = value1 + "",
      interpolate0;
  return function() {
    var string0 = styleValue(this, name);
    return string0 === string1 ? null
        : string0 === string00 ? interpolate0
        : interpolate0 = interpolate(string00 = string0, value1);
  };
}

function styleFunction(name, interpolate, value) {
  var string00,
      string10,
      interpolate0;
  return function() {
    var string0 = styleValue(this, name),
        value1 = value(this),
        string1 = value1 + "";
    if (value1 == null) string1 = value1 = (this.style.removeProperty(name), styleValue(this, name));
    return string0 === string1 ? null
        : string0 === string00 && string1 === string10 ? interpolate0
        : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
  };
}

function styleMaybeRemove(id, name) {
  var on0, on1, listener0, key = "style." + name, event = "end." + key, remove;
  return function() {
    var schedule = set(this, id),
        on = schedule.on,
        listener = schedule.value[key] == null ? remove || (remove = styleRemove(name)) : undefined;

    // If this node shared a dispatch with the previous node,
    // just assign the updated shared dispatch and we’re done!
    // Otherwise, copy-on-write.
    if (on !== on0 || listener0 !== listener) (on1 = (on0 = on).copy()).on(event, listener0 = listener);

    schedule.on = on1;
  };
}

function transition_style(name, value, priority) {
  var i = (name += "") === "transform" ? interpolateTransformCss : interpolate;
  return value == null ? this
      .styleTween(name, styleNull(name, i))
      .on("end.style." + name, styleRemove(name))
    : typeof value === "function" ? this
      .styleTween(name, styleFunction(name, i, tweenValue(this, "style." + name, value)))
      .each(styleMaybeRemove(this._id, name))
    : this
      .styleTween(name, styleConstant(name, i, value), priority)
      .on("end.style." + name, null);
}

function styleInterpolate(name, i, priority) {
  return function(t) {
    this.style.setProperty(name, i.call(this, t), priority);
  };
}

function styleTween(name, value, priority) {
  var t, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0) t = (i0 = i) && styleInterpolate(name, i, priority);
    return t;
  }
  tween._value = value;
  return tween;
}

function transition_styleTween(name, value, priority) {
  var key = "style." + (name += "");
  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error;
  return this.tween(key, styleTween(name, value, priority == null ? "" : priority));
}

function textConstant(value) {
  return function() {
    this.textContent = value;
  };
}

function textFunction(value) {
  return function() {
    var value1 = value(this);
    this.textContent = value1 == null ? "" : value1;
  };
}

function transition_text(value) {
  return this.tween("text", typeof value === "function"
      ? textFunction(tweenValue(this, "text", value))
      : textConstant(value == null ? "" : value + ""));
}

function textInterpolate(i) {
  return function(t) {
    this.textContent = i.call(this, t);
  };
}

function textTween(value) {
  var t0, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0) t0 = (i0 = i) && textInterpolate(i);
    return t0;
  }
  tween._value = value;
  return tween;
}

function transition_textTween(value) {
  var key = "text";
  if (arguments.length < 1) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error;
  return this.tween(key, textTween(value));
}

function transition_transition() {
  var name = this._name,
      id0 = this._id,
      id1 = newId();

  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        var inherit = get(node, id0);
        schedule(node, name, id1, i, group, {
          time: inherit.time + inherit.delay + inherit.duration,
          delay: 0,
          duration: inherit.duration,
          ease: inherit.ease
        });
      }
    }
  }

  return new Transition(groups, this._parents, name, id1);
}

function transition_end() {
  var on0, on1, that = this, id = that._id, size = that.size();
  return new Promise(function(resolve, reject) {
    var cancel = {value: reject},
        end = {value: function() { if (--size === 0) resolve(); }};

    that.each(function() {
      var schedule = set(this, id),
          on = schedule.on;

      // If this node shared a dispatch with the previous node,
      // just assign the updated shared dispatch and we’re done!
      // Otherwise, copy-on-write.
      if (on !== on0) {
        on1 = (on0 = on).copy();
        on1._.cancel.push(cancel);
        on1._.interrupt.push(cancel);
        on1._.end.push(end);
      }

      schedule.on = on1;
    });
  });
}

var id = 0;

function Transition(groups, parents, name, id) {
  this._groups = groups;
  this._parents = parents;
  this._name = name;
  this._id = id;
}

function transition(name) {
  return selection().transition(name);
}

function newId() {
  return ++id;
}

var selection_prototype = selection.prototype;

Transition.prototype = transition.prototype = {
  constructor: Transition,
  select: transition_select,
  selectAll: transition_selectAll,
  filter: transition_filter,
  merge: transition_merge,
  selection: transition_selection,
  transition: transition_transition,
  call: selection_prototype.call,
  nodes: selection_prototype.nodes,
  node: selection_prototype.node,
  size: selection_prototype.size,
  empty: selection_prototype.empty,
  each: selection_prototype.each,
  on: transition_on,
  attr: transition_attr,
  attrTween: transition_attrTween,
  style: transition_style,
  styleTween: transition_styleTween,
  text: transition_text,
  textTween: transition_textTween,
  remove: transition_remove,
  tween: transition_tween,
  delay: transition_delay,
  duration: transition_duration,
  ease: transition_ease,
  end: transition_end
};

function cubicInOut(t) {
  return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
}

var defaultTiming = {
  time: null, // Set on use.
  delay: 0,
  duration: 250,
  ease: cubicInOut
};

function inherit(node, id) {
  var timing;
  while (!(timing = node.__transition) || !(timing = timing[id])) {
    if (!(node = node.parentNode)) {
      return defaultTiming.time = now(), defaultTiming;
    }
  }
  return timing;
}

function selection_transition(name) {
  var id,
      timing;

  if (name instanceof Transition) {
    id = name._id, name = name._name;
  } else {
    id = newId(), (timing = defaultTiming).time = now(), name = name == null ? null : name + "";
  }

  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        schedule(node, name, id, i, group, timing || inherit(node, id));
      }
    }
  }

  return new Transition(groups, this._parents, name, id);
}

selection.prototype.interrupt = selection_interrupt;
selection.prototype.transition = selection_transition;

function ascending$2(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

function bisector$2(compare) {
  if (compare.length === 1) compare = ascendingComparator$2(compare);
  return {
    left: function(a, x, lo, hi) {
      if (lo == null) lo = 0;
      if (hi == null) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (compare(a[mid], x) < 0) lo = mid + 1;
        else hi = mid;
      }
      return lo;
    },
    right: function(a, x, lo, hi) {
      if (lo == null) lo = 0;
      if (hi == null) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (compare(a[mid], x) > 0) hi = mid;
        else lo = mid + 1;
      }
      return lo;
    }
  };
}

function ascendingComparator$2(f) {
  return function(d, x) {
    return ascending$2(f(d), x);
  };
}

bisector$2(ascending$2);

var pi = Math.PI,
    tau = 2 * pi,
    epsilon$1 = 1e-6,
    tauEpsilon = tau - epsilon$1;

function Path() {
  this._x0 = this._y0 = // start of current subpath
  this._x1 = this._y1 = null; // end of current subpath
  this._ = "";
}

function path() {
  return new Path;
}

Path.prototype = path.prototype = {
  constructor: Path,
  moveTo: function(x, y) {
    this._ += "M" + (this._x0 = this._x1 = +x) + "," + (this._y0 = this._y1 = +y);
  },
  closePath: function() {
    if (this._x1 !== null) {
      this._x1 = this._x0, this._y1 = this._y0;
      this._ += "Z";
    }
  },
  lineTo: function(x, y) {
    this._ += "L" + (this._x1 = +x) + "," + (this._y1 = +y);
  },
  quadraticCurveTo: function(x1, y1, x, y) {
    this._ += "Q" + (+x1) + "," + (+y1) + "," + (this._x1 = +x) + "," + (this._y1 = +y);
  },
  bezierCurveTo: function(x1, y1, x2, y2, x, y) {
    this._ += "C" + (+x1) + "," + (+y1) + "," + (+x2) + "," + (+y2) + "," + (this._x1 = +x) + "," + (this._y1 = +y);
  },
  arcTo: function(x1, y1, x2, y2, r) {
    x1 = +x1, y1 = +y1, x2 = +x2, y2 = +y2, r = +r;
    var x0 = this._x1,
        y0 = this._y1,
        x21 = x2 - x1,
        y21 = y2 - y1,
        x01 = x0 - x1,
        y01 = y0 - y1,
        l01_2 = x01 * x01 + y01 * y01;

    // Is the radius negative? Error.
    if (r < 0) throw new Error("negative radius: " + r);

    // Is this path empty? Move to (x1,y1).
    if (this._x1 === null) {
      this._ += "M" + (this._x1 = x1) + "," + (this._y1 = y1);
    }

    // Or, is (x1,y1) coincident with (x0,y0)? Do nothing.
    else if (!(l01_2 > epsilon$1));

    // Or, are (x0,y0), (x1,y1) and (x2,y2) collinear?
    // Equivalently, is (x1,y1) coincident with (x2,y2)?
    // Or, is the radius zero? Line to (x1,y1).
    else if (!(Math.abs(y01 * x21 - y21 * x01) > epsilon$1) || !r) {
      this._ += "L" + (this._x1 = x1) + "," + (this._y1 = y1);
    }

    // Otherwise, draw an arc!
    else {
      var x20 = x2 - x0,
          y20 = y2 - y0,
          l21_2 = x21 * x21 + y21 * y21,
          l20_2 = x20 * x20 + y20 * y20,
          l21 = Math.sqrt(l21_2),
          l01 = Math.sqrt(l01_2),
          l = r * Math.tan((pi - Math.acos((l21_2 + l01_2 - l20_2) / (2 * l21 * l01))) / 2),
          t01 = l / l01,
          t21 = l / l21;

      // If the start tangent is not coincident with (x0,y0), line to.
      if (Math.abs(t01 - 1) > epsilon$1) {
        this._ += "L" + (x1 + t01 * x01) + "," + (y1 + t01 * y01);
      }

      this._ += "A" + r + "," + r + ",0,0," + (+(y01 * x20 > x01 * y20)) + "," + (this._x1 = x1 + t21 * x21) + "," + (this._y1 = y1 + t21 * y21);
    }
  },
  arc: function(x, y, r, a0, a1, ccw) {
    x = +x, y = +y, r = +r, ccw = !!ccw;
    var dx = r * Math.cos(a0),
        dy = r * Math.sin(a0),
        x0 = x + dx,
        y0 = y + dy,
        cw = 1 ^ ccw,
        da = ccw ? a0 - a1 : a1 - a0;

    // Is the radius negative? Error.
    if (r < 0) throw new Error("negative radius: " + r);

    // Is this path empty? Move to (x0,y0).
    if (this._x1 === null) {
      this._ += "M" + x0 + "," + y0;
    }

    // Or, is (x0,y0) not coincident with the previous point? Line to (x0,y0).
    else if (Math.abs(this._x1 - x0) > epsilon$1 || Math.abs(this._y1 - y0) > epsilon$1) {
      this._ += "L" + x0 + "," + y0;
    }

    // Is this arc empty? We’re done.
    if (!r) return;

    // Does the angle go the wrong way? Flip the direction.
    if (da < 0) da = da % tau + tau;

    // Is this a complete circle? Draw two arcs to complete the circle.
    if (da > tauEpsilon) {
      this._ += "A" + r + "," + r + ",0,1," + cw + "," + (x - dx) + "," + (y - dy) + "A" + r + "," + r + ",0,1," + cw + "," + (this._x1 = x0) + "," + (this._y1 = y0);
    }

    // Is this arc non-empty? Draw an arc!
    else if (da > epsilon$1) {
      this._ += "A" + r + "," + r + ",0," + (+(da >= pi)) + "," + cw + "," + (this._x1 = x + r * Math.cos(a1)) + "," + (this._y1 = y + r * Math.sin(a1));
    }
  },
  rect: function(x, y, w, h) {
    this._ += "M" + (this._x0 = this._x1 = +x) + "," + (this._y0 = this._y1 = +y) + "h" + (+w) + "v" + (+h) + "h" + (-w) + "Z";
  },
  toString: function() {
    return this._;
  }
};

var prefix = "$";

function Map() {}

Map.prototype = map$2.prototype = {
  constructor: Map,
  has: function(key) {
    return (prefix + key) in this;
  },
  get: function(key) {
    return this[prefix + key];
  },
  set: function(key, value) {
    this[prefix + key] = value;
    return this;
  },
  remove: function(key) {
    var property = prefix + key;
    return property in this && delete this[property];
  },
  clear: function() {
    for (var property in this) if (property[0] === prefix) delete this[property];
  },
  keys: function() {
    var keys = [];
    for (var property in this) if (property[0] === prefix) keys.push(property.slice(1));
    return keys;
  },
  values: function() {
    var values = [];
    for (var property in this) if (property[0] === prefix) values.push(this[property]);
    return values;
  },
  entries: function() {
    var entries = [];
    for (var property in this) if (property[0] === prefix) entries.push({key: property.slice(1), value: this[property]});
    return entries;
  },
  size: function() {
    var size = 0;
    for (var property in this) if (property[0] === prefix) ++size;
    return size;
  },
  empty: function() {
    for (var property in this) if (property[0] === prefix) return false;
    return true;
  },
  each: function(f) {
    for (var property in this) if (property[0] === prefix) f(this[property], property.slice(1), this);
  }
};

function map$2(object, f) {
  var map = new Map;

  // Copy constructor.
  if (object instanceof Map) object.each(function(value, key) { map.set(key, value); });

  // Index array by numeric index or specified key function.
  else if (Array.isArray(object)) {
    var i = -1,
        n = object.length,
        o;

    if (f == null) while (++i < n) map.set(i, object[i]);
    else while (++i < n) map.set(f(o = object[i], i, object), o);
  }

  // Convert object to map.
  else if (object) for (var key in object) map.set(key, object[key]);

  return map;
}

function nest() {
  var keys = [],
      sortKeys = [],
      sortValues,
      rollup,
      nest;

  function apply(array, depth, createResult, setResult) {
    if (depth >= keys.length) {
      if (sortValues != null) array.sort(sortValues);
      return rollup != null ? rollup(array) : array;
    }

    var i = -1,
        n = array.length,
        key = keys[depth++],
        keyValue,
        value,
        valuesByKey = map$2(),
        values,
        result = createResult();

    while (++i < n) {
      if (values = valuesByKey.get(keyValue = key(value = array[i]) + "")) {
        values.push(value);
      } else {
        valuesByKey.set(keyValue, [value]);
      }
    }

    valuesByKey.each(function(values, key) {
      setResult(result, key, apply(values, depth, createResult, setResult));
    });

    return result;
  }

  function entries(map, depth) {
    if (++depth > keys.length) return map;
    var array, sortKey = sortKeys[depth - 1];
    if (rollup != null && depth >= keys.length) array = map.entries();
    else array = [], map.each(function(v, k) { array.push({key: k, values: entries(v, depth)}); });
    return sortKey != null ? array.sort(function(a, b) { return sortKey(a.key, b.key); }) : array;
  }

  return nest = {
    object: function(array) { return apply(array, 0, createObject, setObject); },
    map: function(array) { return apply(array, 0, createMap, setMap); },
    entries: function(array) { return entries(apply(array, 0, createMap, setMap), 0); },
    key: function(d) { keys.push(d); return nest; },
    sortKeys: function(order) { sortKeys[keys.length - 1] = order; return nest; },
    sortValues: function(order) { sortValues = order; return nest; },
    rollup: function(f) { rollup = f; return nest; }
  };
}

function createObject() {
  return {};
}

function setObject(object, key, value) {
  object[key] = value;
}

function createMap() {
  return map$2();
}

function setMap(map, key, value) {
  map.set(key, value);
}

function Set() {}

var proto = map$2.prototype;

Set.prototype = {
  constructor: Set,
  has: proto.has,
  add: function(value) {
    value += "";
    this[prefix + value] = value;
    return this;
  },
  remove: proto.remove,
  clear: proto.clear,
  values: proto.keys,
  size: proto.size,
  empty: proto.empty,
  each: proto.each
};

function define(constructor, factory, prototype) {
  constructor.prototype = factory.prototype = prototype;
  prototype.constructor = constructor;
}

function extend(parent, definition) {
  var prototype = Object.create(parent.prototype);
  for (var key in definition) prototype[key] = definition[key];
  return prototype;
}

function Color() {}

var darker = 0.7;
var brighter = 1 / darker;

var reI = "\\s*([+-]?\\d+)\\s*",
    reN = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\s*",
    reP = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)%\\s*",
    reHex = /^#([0-9a-f]{3,8})$/,
    reRgbInteger = new RegExp("^rgb\\(" + [reI, reI, reI] + "\\)$"),
    reRgbPercent = new RegExp("^rgb\\(" + [reP, reP, reP] + "\\)$"),
    reRgbaInteger = new RegExp("^rgba\\(" + [reI, reI, reI, reN] + "\\)$"),
    reRgbaPercent = new RegExp("^rgba\\(" + [reP, reP, reP, reN] + "\\)$"),
    reHslPercent = new RegExp("^hsl\\(" + [reN, reP, reP] + "\\)$"),
    reHslaPercent = new RegExp("^hsla\\(" + [reN, reP, reP, reN] + "\\)$");

var named = {
  aliceblue: 0xf0f8ff,
  antiquewhite: 0xfaebd7,
  aqua: 0x00ffff,
  aquamarine: 0x7fffd4,
  azure: 0xf0ffff,
  beige: 0xf5f5dc,
  bisque: 0xffe4c4,
  black: 0x000000,
  blanchedalmond: 0xffebcd,
  blue: 0x0000ff,
  blueviolet: 0x8a2be2,
  brown: 0xa52a2a,
  burlywood: 0xdeb887,
  cadetblue: 0x5f9ea0,
  chartreuse: 0x7fff00,
  chocolate: 0xd2691e,
  coral: 0xff7f50,
  cornflowerblue: 0x6495ed,
  cornsilk: 0xfff8dc,
  crimson: 0xdc143c,
  cyan: 0x00ffff,
  darkblue: 0x00008b,
  darkcyan: 0x008b8b,
  darkgoldenrod: 0xb8860b,
  darkgray: 0xa9a9a9,
  darkgreen: 0x006400,
  darkgrey: 0xa9a9a9,
  darkkhaki: 0xbdb76b,
  darkmagenta: 0x8b008b,
  darkolivegreen: 0x556b2f,
  darkorange: 0xff8c00,
  darkorchid: 0x9932cc,
  darkred: 0x8b0000,
  darksalmon: 0xe9967a,
  darkseagreen: 0x8fbc8f,
  darkslateblue: 0x483d8b,
  darkslategray: 0x2f4f4f,
  darkslategrey: 0x2f4f4f,
  darkturquoise: 0x00ced1,
  darkviolet: 0x9400d3,
  deeppink: 0xff1493,
  deepskyblue: 0x00bfff,
  dimgray: 0x696969,
  dimgrey: 0x696969,
  dodgerblue: 0x1e90ff,
  firebrick: 0xb22222,
  floralwhite: 0xfffaf0,
  forestgreen: 0x228b22,
  fuchsia: 0xff00ff,
  gainsboro: 0xdcdcdc,
  ghostwhite: 0xf8f8ff,
  gold: 0xffd700,
  goldenrod: 0xdaa520,
  gray: 0x808080,
  green: 0x008000,
  greenyellow: 0xadff2f,
  grey: 0x808080,
  honeydew: 0xf0fff0,
  hotpink: 0xff69b4,
  indianred: 0xcd5c5c,
  indigo: 0x4b0082,
  ivory: 0xfffff0,
  khaki: 0xf0e68c,
  lavender: 0xe6e6fa,
  lavenderblush: 0xfff0f5,
  lawngreen: 0x7cfc00,
  lemonchiffon: 0xfffacd,
  lightblue: 0xadd8e6,
  lightcoral: 0xf08080,
  lightcyan: 0xe0ffff,
  lightgoldenrodyellow: 0xfafad2,
  lightgray: 0xd3d3d3,
  lightgreen: 0x90ee90,
  lightgrey: 0xd3d3d3,
  lightpink: 0xffb6c1,
  lightsalmon: 0xffa07a,
  lightseagreen: 0x20b2aa,
  lightskyblue: 0x87cefa,
  lightslategray: 0x778899,
  lightslategrey: 0x778899,
  lightsteelblue: 0xb0c4de,
  lightyellow: 0xffffe0,
  lime: 0x00ff00,
  limegreen: 0x32cd32,
  linen: 0xfaf0e6,
  magenta: 0xff00ff,
  maroon: 0x800000,
  mediumaquamarine: 0x66cdaa,
  mediumblue: 0x0000cd,
  mediumorchid: 0xba55d3,
  mediumpurple: 0x9370db,
  mediumseagreen: 0x3cb371,
  mediumslateblue: 0x7b68ee,
  mediumspringgreen: 0x00fa9a,
  mediumturquoise: 0x48d1cc,
  mediumvioletred: 0xc71585,
  midnightblue: 0x191970,
  mintcream: 0xf5fffa,
  mistyrose: 0xffe4e1,
  moccasin: 0xffe4b5,
  navajowhite: 0xffdead,
  navy: 0x000080,
  oldlace: 0xfdf5e6,
  olive: 0x808000,
  olivedrab: 0x6b8e23,
  orange: 0xffa500,
  orangered: 0xff4500,
  orchid: 0xda70d6,
  palegoldenrod: 0xeee8aa,
  palegreen: 0x98fb98,
  paleturquoise: 0xafeeee,
  palevioletred: 0xdb7093,
  papayawhip: 0xffefd5,
  peachpuff: 0xffdab9,
  peru: 0xcd853f,
  pink: 0xffc0cb,
  plum: 0xdda0dd,
  powderblue: 0xb0e0e6,
  purple: 0x800080,
  rebeccapurple: 0x663399,
  red: 0xff0000,
  rosybrown: 0xbc8f8f,
  royalblue: 0x4169e1,
  saddlebrown: 0x8b4513,
  salmon: 0xfa8072,
  sandybrown: 0xf4a460,
  seagreen: 0x2e8b57,
  seashell: 0xfff5ee,
  sienna: 0xa0522d,
  silver: 0xc0c0c0,
  skyblue: 0x87ceeb,
  slateblue: 0x6a5acd,
  slategray: 0x708090,
  slategrey: 0x708090,
  snow: 0xfffafa,
  springgreen: 0x00ff7f,
  steelblue: 0x4682b4,
  tan: 0xd2b48c,
  teal: 0x008080,
  thistle: 0xd8bfd8,
  tomato: 0xff6347,
  turquoise: 0x40e0d0,
  violet: 0xee82ee,
  wheat: 0xf5deb3,
  white: 0xffffff,
  whitesmoke: 0xf5f5f5,
  yellow: 0xffff00,
  yellowgreen: 0x9acd32
};

define(Color, color, {
  copy: function(channels) {
    return Object.assign(new this.constructor, this, channels);
  },
  displayable: function() {
    return this.rgb().displayable();
  },
  hex: color_formatHex, // Deprecated! Use color.formatHex.
  formatHex: color_formatHex,
  formatHsl: color_formatHsl,
  formatRgb: color_formatRgb,
  toString: color_formatRgb
});

function color_formatHex() {
  return this.rgb().formatHex();
}

function color_formatHsl() {
  return hslConvert(this).formatHsl();
}

function color_formatRgb() {
  return this.rgb().formatRgb();
}

function color(format) {
  var m, l;
  format = (format + "").trim().toLowerCase();
  return (m = reHex.exec(format)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn(m) // #ff0000
      : l === 3 ? new Rgb((m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1) // #f00
      : l === 8 ? rgba(m >> 24 & 0xff, m >> 16 & 0xff, m >> 8 & 0xff, (m & 0xff) / 0xff) // #ff000000
      : l === 4 ? rgba((m >> 12 & 0xf) | (m >> 8 & 0xf0), (m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), (((m & 0xf) << 4) | (m & 0xf)) / 0xff) // #f000
      : null) // invalid hex
      : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
      : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
      : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
      : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
      : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
      : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
      : named.hasOwnProperty(format) ? rgbn(named[format]) // eslint-disable-line no-prototype-builtins
      : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0)
      : null;
}

function rgbn(n) {
  return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
}

function rgba(r, g, b, a) {
  if (a <= 0) r = g = b = NaN;
  return new Rgb(r, g, b, a);
}

function rgbConvert(o) {
  if (!(o instanceof Color)) o = color(o);
  if (!o) return new Rgb;
  o = o.rgb();
  return new Rgb(o.r, o.g, o.b, o.opacity);
}

function rgb(r, g, b, opacity) {
  return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
}

function Rgb(r, g, b, opacity) {
  this.r = +r;
  this.g = +g;
  this.b = +b;
  this.opacity = +opacity;
}

define(Rgb, rgb, extend(Color, {
  brighter: function(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  darker: function(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  rgb: function() {
    return this;
  },
  displayable: function() {
    return (-0.5 <= this.r && this.r < 255.5)
        && (-0.5 <= this.g && this.g < 255.5)
        && (-0.5 <= this.b && this.b < 255.5)
        && (0 <= this.opacity && this.opacity <= 1);
  },
  hex: rgb_formatHex, // Deprecated! Use color.formatHex.
  formatHex: rgb_formatHex,
  formatRgb: rgb_formatRgb,
  toString: rgb_formatRgb
}));

function rgb_formatHex() {
  return "#" + hex(this.r) + hex(this.g) + hex(this.b);
}

function rgb_formatRgb() {
  var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
  return (a === 1 ? "rgb(" : "rgba(")
      + Math.max(0, Math.min(255, Math.round(this.r) || 0)) + ", "
      + Math.max(0, Math.min(255, Math.round(this.g) || 0)) + ", "
      + Math.max(0, Math.min(255, Math.round(this.b) || 0))
      + (a === 1 ? ")" : ", " + a + ")");
}

function hex(value) {
  value = Math.max(0, Math.min(255, Math.round(value) || 0));
  return (value < 16 ? "0" : "") + value.toString(16);
}

function hsla(h, s, l, a) {
  if (a <= 0) h = s = l = NaN;
  else if (l <= 0 || l >= 1) h = s = NaN;
  else if (s <= 0) h = NaN;
  return new Hsl(h, s, l, a);
}

function hslConvert(o) {
  if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Color)) o = color(o);
  if (!o) return new Hsl;
  if (o instanceof Hsl) return o;
  o = o.rgb();
  var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      min = Math.min(r, g, b),
      max = Math.max(r, g, b),
      h = NaN,
      s = max - min,
      l = (max + min) / 2;
  if (s) {
    if (r === max) h = (g - b) / s + (g < b) * 6;
    else if (g === max) h = (b - r) / s + 2;
    else h = (r - g) / s + 4;
    s /= l < 0.5 ? max + min : 2 - max - min;
    h *= 60;
  } else {
    s = l > 0 && l < 1 ? 0 : h;
  }
  return new Hsl(h, s, l, o.opacity);
}

function hsl(h, s, l, opacity) {
  return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
}

function Hsl(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}

define(Hsl, hsl, extend(Color, {
  brighter: function(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  darker: function(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  rgb: function() {
    var h = this.h % 360 + (this.h < 0) * 360,
        s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
        l = this.l,
        m2 = l + (l < 0.5 ? l : 1 - l) * s,
        m1 = 2 * l - m2;
    return new Rgb(
      hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
      hsl2rgb(h, m1, m2),
      hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
      this.opacity
    );
  },
  displayable: function() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s))
        && (0 <= this.l && this.l <= 1)
        && (0 <= this.opacity && this.opacity <= 1);
  },
  formatHsl: function() {
    var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
    return (a === 1 ? "hsl(" : "hsla(")
        + (this.h || 0) + ", "
        + (this.s || 0) * 100 + "%, "
        + (this.l || 0) * 100 + "%"
        + (a === 1 ? ")" : ", " + a + ")");
  }
}));

/* From FvD 13.37, CSS Color Module Level 3 */
function hsl2rgb(h, m1, m2) {
  return (h < 60 ? m1 + (m2 - m1) * h / 60
      : h < 180 ? m2
      : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
      : m1) * 255;
}

function ascending$1(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

function bisector$1(compare) {
  if (compare.length === 1) compare = ascendingComparator$1(compare);
  return {
    left: function(a, x, lo, hi) {
      if (lo == null) lo = 0;
      if (hi == null) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (compare(a[mid], x) < 0) lo = mid + 1;
        else hi = mid;
      }
      return lo;
    },
    right: function(a, x, lo, hi) {
      if (lo == null) lo = 0;
      if (hi == null) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (compare(a[mid], x) > 0) hi = mid;
        else lo = mid + 1;
      }
      return lo;
    }
  };
}

function ascendingComparator$1(f) {
  return function(d, x) {
    return ascending$1(f(d), x);
  };
}

bisector$1(ascending$1);

function constant$2(x) {
  return function() {
    return x;
  };
}

function jiggle() {
  return (Math.random() - 0.5) * 1e-6;
}

function tree_add(d) {
  var x = +this._x.call(null, d),
      y = +this._y.call(null, d);
  return add(this.cover(x, y), x, y, d);
}

function add(tree, x, y, d) {
  if (isNaN(x) || isNaN(y)) return tree; // ignore invalid points

  var parent,
      node = tree._root,
      leaf = {data: d},
      x0 = tree._x0,
      y0 = tree._y0,
      x1 = tree._x1,
      y1 = tree._y1,
      xm,
      ym,
      xp,
      yp,
      right,
      bottom,
      i,
      j;

  // If the tree is empty, initialize the root as a leaf.
  if (!node) return tree._root = leaf, tree;

  // Find the existing leaf for the new point, or add it.
  while (node.length) {
    if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm; else x1 = xm;
    if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym; else y1 = ym;
    if (parent = node, !(node = node[i = bottom << 1 | right])) return parent[i] = leaf, tree;
  }

  // Is the new point is exactly coincident with the existing point?
  xp = +tree._x.call(null, node.data);
  yp = +tree._y.call(null, node.data);
  if (x === xp && y === yp) return leaf.next = node, parent ? parent[i] = leaf : tree._root = leaf, tree;

  // Otherwise, split the leaf node until the old and new point are separated.
  do {
    parent = parent ? parent[i] = new Array(4) : tree._root = new Array(4);
    if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm; else x1 = xm;
    if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym; else y1 = ym;
  } while ((i = bottom << 1 | right) === (j = (yp >= ym) << 1 | (xp >= xm)));
  return parent[j] = node, parent[i] = leaf, tree;
}

function addAll(data) {
  var d, i, n = data.length,
      x,
      y,
      xz = new Array(n),
      yz = new Array(n),
      x0 = Infinity,
      y0 = Infinity,
      x1 = -Infinity,
      y1 = -Infinity;

  // Compute the points and their extent.
  for (i = 0; i < n; ++i) {
    if (isNaN(x = +this._x.call(null, d = data[i])) || isNaN(y = +this._y.call(null, d))) continue;
    xz[i] = x;
    yz[i] = y;
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }

  // If there were no (valid) points, abort.
  if (x0 > x1 || y0 > y1) return this;

  // Expand the tree to cover the new points.
  this.cover(x0, y0).cover(x1, y1);

  // Add the new points.
  for (i = 0; i < n; ++i) {
    add(this, xz[i], yz[i], data[i]);
  }

  return this;
}

function tree_cover(x, y) {
  if (isNaN(x = +x) || isNaN(y = +y)) return this; // ignore invalid points

  var x0 = this._x0,
      y0 = this._y0,
      x1 = this._x1,
      y1 = this._y1;

  // If the quadtree has no extent, initialize them.
  // Integer extent are necessary so that if we later double the extent,
  // the existing quadrant boundaries don’t change due to floating point error!
  if (isNaN(x0)) {
    x1 = (x0 = Math.floor(x)) + 1;
    y1 = (y0 = Math.floor(y)) + 1;
  }

  // Otherwise, double repeatedly to cover.
  else {
    var z = x1 - x0,
        node = this._root,
        parent,
        i;

    while (x0 > x || x >= x1 || y0 > y || y >= y1) {
      i = (y < y0) << 1 | (x < x0);
      parent = new Array(4), parent[i] = node, node = parent, z *= 2;
      switch (i) {
        case 0: x1 = x0 + z, y1 = y0 + z; break;
        case 1: x0 = x1 - z, y1 = y0 + z; break;
        case 2: x1 = x0 + z, y0 = y1 - z; break;
        case 3: x0 = x1 - z, y0 = y1 - z; break;
      }
    }

    if (this._root && this._root.length) this._root = node;
  }

  this._x0 = x0;
  this._y0 = y0;
  this._x1 = x1;
  this._y1 = y1;
  return this;
}

function tree_data() {
  var data = [];
  this.visit(function(node) {
    if (!node.length) do data.push(node.data); while (node = node.next)
  });
  return data;
}

function tree_extent(_) {
  return arguments.length
      ? this.cover(+_[0][0], +_[0][1]).cover(+_[1][0], +_[1][1])
      : isNaN(this._x0) ? undefined : [[this._x0, this._y0], [this._x1, this._y1]];
}

function Quad(node, x0, y0, x1, y1) {
  this.node = node;
  this.x0 = x0;
  this.y0 = y0;
  this.x1 = x1;
  this.y1 = y1;
}

function tree_find(x, y, radius) {
  var data,
      x0 = this._x0,
      y0 = this._y0,
      x1,
      y1,
      x2,
      y2,
      x3 = this._x1,
      y3 = this._y1,
      quads = [],
      node = this._root,
      q,
      i;

  if (node) quads.push(new Quad(node, x0, y0, x3, y3));
  if (radius == null) radius = Infinity;
  else {
    x0 = x - radius, y0 = y - radius;
    x3 = x + radius, y3 = y + radius;
    radius *= radius;
  }

  while (q = quads.pop()) {

    // Stop searching if this quadrant can’t contain a closer node.
    if (!(node = q.node)
        || (x1 = q.x0) > x3
        || (y1 = q.y0) > y3
        || (x2 = q.x1) < x0
        || (y2 = q.y1) < y0) continue;

    // Bisect the current quadrant.
    if (node.length) {
      var xm = (x1 + x2) / 2,
          ym = (y1 + y2) / 2;

      quads.push(
        new Quad(node[3], xm, ym, x2, y2),
        new Quad(node[2], x1, ym, xm, y2),
        new Quad(node[1], xm, y1, x2, ym),
        new Quad(node[0], x1, y1, xm, ym)
      );

      // Visit the closest quadrant first.
      if (i = (y >= ym) << 1 | (x >= xm)) {
        q = quads[quads.length - 1];
        quads[quads.length - 1] = quads[quads.length - 1 - i];
        quads[quads.length - 1 - i] = q;
      }
    }

    // Visit this point. (Visiting coincident points isn’t necessary!)
    else {
      var dx = x - +this._x.call(null, node.data),
          dy = y - +this._y.call(null, node.data),
          d2 = dx * dx + dy * dy;
      if (d2 < radius) {
        var d = Math.sqrt(radius = d2);
        x0 = x - d, y0 = y - d;
        x3 = x + d, y3 = y + d;
        data = node.data;
      }
    }
  }

  return data;
}

function tree_remove(d) {
  if (isNaN(x = +this._x.call(null, d)) || isNaN(y = +this._y.call(null, d))) return this; // ignore invalid points

  var parent,
      node = this._root,
      retainer,
      previous,
      next,
      x0 = this._x0,
      y0 = this._y0,
      x1 = this._x1,
      y1 = this._y1,
      x,
      y,
      xm,
      ym,
      right,
      bottom,
      i,
      j;

  // If the tree is empty, initialize the root as a leaf.
  if (!node) return this;

  // Find the leaf node for the point.
  // While descending, also retain the deepest parent with a non-removed sibling.
  if (node.length) while (true) {
    if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm; else x1 = xm;
    if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym; else y1 = ym;
    if (!(parent = node, node = node[i = bottom << 1 | right])) return this;
    if (!node.length) break;
    if (parent[(i + 1) & 3] || parent[(i + 2) & 3] || parent[(i + 3) & 3]) retainer = parent, j = i;
  }

  // Find the point to remove.
  while (node.data !== d) if (!(previous = node, node = node.next)) return this;
  if (next = node.next) delete node.next;

  // If there are multiple coincident points, remove just the point.
  if (previous) return (next ? previous.next = next : delete previous.next), this;

  // If this is the root point, remove it.
  if (!parent) return this._root = next, this;

  // Remove this leaf.
  next ? parent[i] = next : delete parent[i];

  // If the parent now contains exactly one leaf, collapse superfluous parents.
  if ((node = parent[0] || parent[1] || parent[2] || parent[3])
      && node === (parent[3] || parent[2] || parent[1] || parent[0])
      && !node.length) {
    if (retainer) retainer[j] = node;
    else this._root = node;
  }

  return this;
}

function removeAll(data) {
  for (var i = 0, n = data.length; i < n; ++i) this.remove(data[i]);
  return this;
}

function tree_root() {
  return this._root;
}

function tree_size() {
  var size = 0;
  this.visit(function(node) {
    if (!node.length) do ++size; while (node = node.next)
  });
  return size;
}

function tree_visit(callback) {
  var quads = [], q, node = this._root, child, x0, y0, x1, y1;
  if (node) quads.push(new Quad(node, this._x0, this._y0, this._x1, this._y1));
  while (q = quads.pop()) {
    if (!callback(node = q.node, x0 = q.x0, y0 = q.y0, x1 = q.x1, y1 = q.y1) && node.length) {
      var xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
      if (child = node[3]) quads.push(new Quad(child, xm, ym, x1, y1));
      if (child = node[2]) quads.push(new Quad(child, x0, ym, xm, y1));
      if (child = node[1]) quads.push(new Quad(child, xm, y0, x1, ym));
      if (child = node[0]) quads.push(new Quad(child, x0, y0, xm, ym));
    }
  }
  return this;
}

function tree_visitAfter(callback) {
  var quads = [], next = [], q;
  if (this._root) quads.push(new Quad(this._root, this._x0, this._y0, this._x1, this._y1));
  while (q = quads.pop()) {
    var node = q.node;
    if (node.length) {
      var child, x0 = q.x0, y0 = q.y0, x1 = q.x1, y1 = q.y1, xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
      if (child = node[0]) quads.push(new Quad(child, x0, y0, xm, ym));
      if (child = node[1]) quads.push(new Quad(child, xm, y0, x1, ym));
      if (child = node[2]) quads.push(new Quad(child, x0, ym, xm, y1));
      if (child = node[3]) quads.push(new Quad(child, xm, ym, x1, y1));
    }
    next.push(q);
  }
  while (q = next.pop()) {
    callback(q.node, q.x0, q.y0, q.x1, q.y1);
  }
  return this;
}

function defaultX(d) {
  return d[0];
}

function tree_x(_) {
  return arguments.length ? (this._x = _, this) : this._x;
}

function defaultY(d) {
  return d[1];
}

function tree_y(_) {
  return arguments.length ? (this._y = _, this) : this._y;
}

function quadtree(nodes, x, y) {
  var tree = new Quadtree(x == null ? defaultX : x, y == null ? defaultY : y, NaN, NaN, NaN, NaN);
  return nodes == null ? tree : tree.addAll(nodes);
}

function Quadtree(x, y, x0, y0, x1, y1) {
  this._x = x;
  this._y = y;
  this._x0 = x0;
  this._y0 = y0;
  this._x1 = x1;
  this._y1 = y1;
  this._root = undefined;
}

function leaf_copy(leaf) {
  var copy = {data: leaf.data}, next = copy;
  while (leaf = leaf.next) next = next.next = {data: leaf.data};
  return copy;
}

var treeProto = quadtree.prototype = Quadtree.prototype;

treeProto.copy = function() {
  var copy = new Quadtree(this._x, this._y, this._x0, this._y0, this._x1, this._y1),
      node = this._root,
      nodes,
      child;

  if (!node) return copy;

  if (!node.length) return copy._root = leaf_copy(node), copy;

  nodes = [{source: node, target: copy._root = new Array(4)}];
  while (node = nodes.pop()) {
    for (var i = 0; i < 4; ++i) {
      if (child = node.source[i]) {
        if (child.length) nodes.push({source: child, target: node.target[i] = new Array(4)});
        else node.target[i] = leaf_copy(child);
      }
    }
  }

  return copy;
};

treeProto.add = tree_add;
treeProto.addAll = addAll;
treeProto.cover = tree_cover;
treeProto.data = tree_data;
treeProto.extent = tree_extent;
treeProto.find = tree_find;
treeProto.remove = tree_remove;
treeProto.removeAll = removeAll;
treeProto.root = tree_root;
treeProto.size = tree_size;
treeProto.visit = tree_visit;
treeProto.visitAfter = tree_visitAfter;
treeProto.x = tree_x;
treeProto.y = tree_y;

function x$2(d) {
  return d.x + d.vx;
}

function y$2(d) {
  return d.y + d.vy;
}

function collide(radius) {
  var nodes,
      radii,
      strength = 1,
      iterations = 1;

  if (typeof radius !== "function") radius = constant$2(radius == null ? 1 : +radius);

  function force() {
    var i, n = nodes.length,
        tree,
        node,
        xi,
        yi,
        ri,
        ri2;

    for (var k = 0; k < iterations; ++k) {
      tree = quadtree(nodes, x$2, y$2).visitAfter(prepare);
      for (i = 0; i < n; ++i) {
        node = nodes[i];
        ri = radii[node.index], ri2 = ri * ri;
        xi = node.x + node.vx;
        yi = node.y + node.vy;
        tree.visit(apply);
      }
    }

    function apply(quad, x0, y0, x1, y1) {
      var data = quad.data, rj = quad.r, r = ri + rj;
      if (data) {
        if (data.index > node.index) {
          var x = xi - data.x - data.vx,
              y = yi - data.y - data.vy,
              l = x * x + y * y;
          if (l < r * r) {
            if (x === 0) x = jiggle(), l += x * x;
            if (y === 0) y = jiggle(), l += y * y;
            l = (r - (l = Math.sqrt(l))) / l * strength;
            node.vx += (x *= l) * (r = (rj *= rj) / (ri2 + rj));
            node.vy += (y *= l) * r;
            data.vx -= x * (r = 1 - r);
            data.vy -= y * r;
          }
        }
        return;
      }
      return x0 > xi + r || x1 < xi - r || y0 > yi + r || y1 < yi - r;
    }
  }

  function prepare(quad) {
    if (quad.data) return quad.r = radii[quad.data.index];
    for (var i = quad.r = 0; i < 4; ++i) {
      if (quad[i] && quad[i].r > quad.r) {
        quad.r = quad[i].r;
      }
    }
  }

  function initialize() {
    if (!nodes) return;
    var i, n = nodes.length, node;
    radii = new Array(n);
    for (i = 0; i < n; ++i) node = nodes[i], radii[node.index] = +radius(node, i, nodes);
  }

  force.initialize = function(_) {
    nodes = _;
    initialize();
  };

  force.iterations = function(_) {
    return arguments.length ? (iterations = +_, force) : iterations;
  };

  force.strength = function(_) {
    return arguments.length ? (strength = +_, force) : strength;
  };

  force.radius = function(_) {
    return arguments.length ? (radius = typeof _ === "function" ? _ : constant$2(+_), initialize(), force) : radius;
  };

  return force;
}

var initialRadius = 10,
    initialAngle = Math.PI * (3 - Math.sqrt(5));

function simulation(nodes) {
  var simulation,
      alpha = 1,
      alphaMin = 0.001,
      alphaDecay = 1 - Math.pow(alphaMin, 1 / 300),
      alphaTarget = 0,
      velocityDecay = 0.6,
      forces = map$2(),
      stepper = timer(step),
      event = dispatch("tick", "end");

  if (nodes == null) nodes = [];

  function step() {
    tick();
    event.call("tick", simulation);
    if (alpha < alphaMin) {
      stepper.stop();
      event.call("end", simulation);
    }
  }

  function tick(iterations) {
    var i, n = nodes.length, node;

    if (iterations === undefined) iterations = 1;

    for (var k = 0; k < iterations; ++k) {
      alpha += (alphaTarget - alpha) * alphaDecay;

      forces.each(function (force) {
        force(alpha);
      });

      for (i = 0; i < n; ++i) {
        node = nodes[i];
        if (node.fx == null) node.x += node.vx *= velocityDecay;
        else node.x = node.fx, node.vx = 0;
        if (node.fy == null) node.y += node.vy *= velocityDecay;
        else node.y = node.fy, node.vy = 0;
      }
    }

    return simulation;
  }

  function initializeNodes() {
    for (var i = 0, n = nodes.length, node; i < n; ++i) {
      node = nodes[i], node.index = i;
      if (node.fx != null) node.x = node.fx;
      if (node.fy != null) node.y = node.fy;
      if (isNaN(node.x) || isNaN(node.y)) {
        var radius = initialRadius * Math.sqrt(i), angle = i * initialAngle;
        node.x = radius * Math.cos(angle);
        node.y = radius * Math.sin(angle);
      }
      if (isNaN(node.vx) || isNaN(node.vy)) {
        node.vx = node.vy = 0;
      }
    }
  }

  function initializeForce(force) {
    if (force.initialize) force.initialize(nodes);
    return force;
  }

  initializeNodes();

  return simulation = {
    tick: tick,

    restart: function() {
      return stepper.restart(step), simulation;
    },

    stop: function() {
      return stepper.stop(), simulation;
    },

    nodes: function(_) {
      return arguments.length ? (nodes = _, initializeNodes(), forces.each(initializeForce), simulation) : nodes;
    },

    alpha: function(_) {
      return arguments.length ? (alpha = +_, simulation) : alpha;
    },

    alphaMin: function(_) {
      return arguments.length ? (alphaMin = +_, simulation) : alphaMin;
    },

    alphaDecay: function(_) {
      return arguments.length ? (alphaDecay = +_, simulation) : +alphaDecay;
    },

    alphaTarget: function(_) {
      return arguments.length ? (alphaTarget = +_, simulation) : alphaTarget;
    },

    velocityDecay: function(_) {
      return arguments.length ? (velocityDecay = 1 - _, simulation) : 1 - velocityDecay;
    },

    force: function(name, _) {
      return arguments.length > 1 ? ((_ == null ? forces.remove(name) : forces.set(name, initializeForce(_))), simulation) : forces.get(name);
    },

    find: function(x, y, radius) {
      var i = 0,
          n = nodes.length,
          dx,
          dy,
          d2,
          node,
          closest;

      if (radius == null) radius = Infinity;
      else radius *= radius;

      for (i = 0; i < n; ++i) {
        node = nodes[i];
        dx = x - node.x;
        dy = y - node.y;
        d2 = dx * dx + dy * dy;
        if (d2 < radius) closest = node, radius = d2;
      }

      return closest;
    },

    on: function(name, _) {
      return arguments.length > 1 ? (event.on(name, _), simulation) : event.on(name);
    }
  };
}

function x$1(x) {
  var strength = constant$2(0.1),
      nodes,
      strengths,
      xz;

  if (typeof x !== "function") x = constant$2(x == null ? 0 : +x);

  function force(alpha) {
    for (var i = 0, n = nodes.length, node; i < n; ++i) {
      node = nodes[i], node.vx += (xz[i] - node.x) * strengths[i] * alpha;
    }
  }

  function initialize() {
    if (!nodes) return;
    var i, n = nodes.length;
    strengths = new Array(n);
    xz = new Array(n);
    for (i = 0; i < n; ++i) {
      strengths[i] = isNaN(xz[i] = +x(nodes[i], i, nodes)) ? 0 : +strength(nodes[i], i, nodes);
    }
  }

  force.initialize = function(_) {
    nodes = _;
    initialize();
  };

  force.strength = function(_) {
    return arguments.length ? (strength = typeof _ === "function" ? _ : constant$2(+_), initialize(), force) : strength;
  };

  force.x = function(_) {
    return arguments.length ? (x = typeof _ === "function" ? _ : constant$2(+_), initialize(), force) : x;
  };

  return force;
}

function y$1(y) {
  var strength = constant$2(0.1),
      nodes,
      strengths,
      yz;

  if (typeof y !== "function") y = constant$2(y == null ? 0 : +y);

  function force(alpha) {
    for (var i = 0, n = nodes.length, node; i < n; ++i) {
      node = nodes[i], node.vy += (yz[i] - node.y) * strengths[i] * alpha;
    }
  }

  function initialize() {
    if (!nodes) return;
    var i, n = nodes.length;
    strengths = new Array(n);
    yz = new Array(n);
    for (i = 0; i < n; ++i) {
      strengths[i] = isNaN(yz[i] = +y(nodes[i], i, nodes)) ? 0 : +strength(nodes[i], i, nodes);
    }
  }

  force.initialize = function(_) {
    nodes = _;
    initialize();
  };

  force.strength = function(_) {
    return arguments.length ? (strength = typeof _ === "function" ? _ : constant$2(+_), initialize(), force) : strength;
  };

  force.y = function(_) {
    return arguments.length ? (y = typeof _ === "function" ? _ : constant$2(+_), initialize(), force) : y;
  };

  return force;
}

function formatDecimal(x) {
  return Math.abs(x = Math.round(x)) >= 1e21
      ? x.toLocaleString("en").replace(/,/g, "")
      : x.toString(10);
}

// Computes the decimal coefficient and exponent of the specified number x with
// significant digits p, where x is positive and p is in [1, 21] or undefined.
// For example, formatDecimalParts(1.23) returns ["123", 0].
function formatDecimalParts(x, p) {
  if ((i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e")) < 0) return null; // NaN, ±Infinity
  var i, coefficient = x.slice(0, i);

  // The string returned by toExponential either has the form \d\.\d+e[-+]\d+
  // (e.g., 1.2e+3) or the form \de[-+]\d+ (e.g., 1e+3).
  return [
    coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
    +x.slice(i + 1)
  ];
}

function exponent(x) {
  return x = formatDecimalParts(Math.abs(x)), x ? x[1] : NaN;
}

function formatGroup(grouping, thousands) {
  return function(value, width) {
    var i = value.length,
        t = [],
        j = 0,
        g = grouping[0],
        length = 0;

    while (i > 0 && g > 0) {
      if (length + g + 1 > width) g = Math.max(1, width - length);
      t.push(value.substring(i -= g, i + g));
      if ((length += g + 1) > width) break;
      g = grouping[j = (j + 1) % grouping.length];
    }

    return t.reverse().join(thousands);
  };
}

function formatNumerals(numerals) {
  return function(value) {
    return value.replace(/[0-9]/g, function(i) {
      return numerals[+i];
    });
  };
}

// [[fill]align][sign][symbol][0][width][,][.precision][~][type]
var re = /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;

function formatSpecifier(specifier) {
  if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);
  var match;
  return new FormatSpecifier({
    fill: match[1],
    align: match[2],
    sign: match[3],
    symbol: match[4],
    zero: match[5],
    width: match[6],
    comma: match[7],
    precision: match[8] && match[8].slice(1),
    trim: match[9],
    type: match[10]
  });
}

formatSpecifier.prototype = FormatSpecifier.prototype; // instanceof

function FormatSpecifier(specifier) {
  this.fill = specifier.fill === undefined ? " " : specifier.fill + "";
  this.align = specifier.align === undefined ? ">" : specifier.align + "";
  this.sign = specifier.sign === undefined ? "-" : specifier.sign + "";
  this.symbol = specifier.symbol === undefined ? "" : specifier.symbol + "";
  this.zero = !!specifier.zero;
  this.width = specifier.width === undefined ? undefined : +specifier.width;
  this.comma = !!specifier.comma;
  this.precision = specifier.precision === undefined ? undefined : +specifier.precision;
  this.trim = !!specifier.trim;
  this.type = specifier.type === undefined ? "" : specifier.type + "";
}

FormatSpecifier.prototype.toString = function() {
  return this.fill
      + this.align
      + this.sign
      + this.symbol
      + (this.zero ? "0" : "")
      + (this.width === undefined ? "" : Math.max(1, this.width | 0))
      + (this.comma ? "," : "")
      + (this.precision === undefined ? "" : "." + Math.max(0, this.precision | 0))
      + (this.trim ? "~" : "")
      + this.type;
};

// Trims insignificant zeros, e.g., replaces 1.2000k with 1.2k.
function formatTrim(s) {
  out: for (var n = s.length, i = 1, i0 = -1, i1; i < n; ++i) {
    switch (s[i]) {
      case ".": i0 = i1 = i; break;
      case "0": if (i0 === 0) i0 = i; i1 = i; break;
      default: if (!+s[i]) break out; if (i0 > 0) i0 = 0; break;
    }
  }
  return i0 > 0 ? s.slice(0, i0) + s.slice(i1 + 1) : s;
}

var prefixExponent;

function formatPrefixAuto(x, p) {
  var d = formatDecimalParts(x, p);
  if (!d) return x + "";
  var coefficient = d[0],
      exponent = d[1],
      i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1,
      n = coefficient.length;
  return i === n ? coefficient
      : i > n ? coefficient + new Array(i - n + 1).join("0")
      : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i)
      : "0." + new Array(1 - i).join("0") + formatDecimalParts(x, Math.max(0, p + i - 1))[0]; // less than 1y!
}

function formatRounded(x, p) {
  var d = formatDecimalParts(x, p);
  if (!d) return x + "";
  var coefficient = d[0],
      exponent = d[1];
  return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient
      : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1)
      : coefficient + new Array(exponent - coefficient.length + 2).join("0");
}

var formatTypes = {
  "%": function(x, p) { return (x * 100).toFixed(p); },
  "b": function(x) { return Math.round(x).toString(2); },
  "c": function(x) { return x + ""; },
  "d": formatDecimal,
  "e": function(x, p) { return x.toExponential(p); },
  "f": function(x, p) { return x.toFixed(p); },
  "g": function(x, p) { return x.toPrecision(p); },
  "o": function(x) { return Math.round(x).toString(8); },
  "p": function(x, p) { return formatRounded(x * 100, p); },
  "r": formatRounded,
  "s": formatPrefixAuto,
  "X": function(x) { return Math.round(x).toString(16).toUpperCase(); },
  "x": function(x) { return Math.round(x).toString(16); }
};

function identity$1(x) {
  return x;
}

var map$1 = Array.prototype.map,
    prefixes = ["y","z","a","f","p","n","µ","m","","k","M","G","T","P","E","Z","Y"];

function formatLocale(locale) {
  var group = locale.grouping === undefined || locale.thousands === undefined ? identity$1 : formatGroup(map$1.call(locale.grouping, Number), locale.thousands + ""),
      currencyPrefix = locale.currency === undefined ? "" : locale.currency[0] + "",
      currencySuffix = locale.currency === undefined ? "" : locale.currency[1] + "",
      decimal = locale.decimal === undefined ? "." : locale.decimal + "",
      numerals = locale.numerals === undefined ? identity$1 : formatNumerals(map$1.call(locale.numerals, String)),
      percent = locale.percent === undefined ? "%" : locale.percent + "",
      minus = locale.minus === undefined ? "-" : locale.minus + "",
      nan = locale.nan === undefined ? "NaN" : locale.nan + "";

  function newFormat(specifier) {
    specifier = formatSpecifier(specifier);

    var fill = specifier.fill,
        align = specifier.align,
        sign = specifier.sign,
        symbol = specifier.symbol,
        zero = specifier.zero,
        width = specifier.width,
        comma = specifier.comma,
        precision = specifier.precision,
        trim = specifier.trim,
        type = specifier.type;

    // The "n" type is an alias for ",g".
    if (type === "n") comma = true, type = "g";

    // The "" type, and any invalid type, is an alias for ".12~g".
    else if (!formatTypes[type]) precision === undefined && (precision = 12), trim = true, type = "g";

    // If zero fill is specified, padding goes after sign and before digits.
    if (zero || (fill === "0" && align === "=")) zero = true, fill = "0", align = "=";

    // Compute the prefix and suffix.
    // For SI-prefix, the suffix is lazily computed.
    var prefix = symbol === "$" ? currencyPrefix : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : "",
        suffix = symbol === "$" ? currencySuffix : /[%p]/.test(type) ? percent : "";

    // What format function should we use?
    // Is this an integer type?
    // Can this type generate exponential notation?
    var formatType = formatTypes[type],
        maybeSuffix = /[defgprs%]/.test(type);

    // Set the default precision if not specified,
    // or clamp the specified precision to the supported range.
    // For significant precision, it must be in [1, 21].
    // For fixed precision, it must be in [0, 20].
    precision = precision === undefined ? 6
        : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision))
        : Math.max(0, Math.min(20, precision));

    function format(value) {
      var valuePrefix = prefix,
          valueSuffix = suffix,
          i, n, c;

      if (type === "c") {
        valueSuffix = formatType(value) + valueSuffix;
        value = "";
      } else {
        value = +value;

        // Determine the sign. -0 is not less than 0, but 1 / -0 is!
        var valueNegative = value < 0 || 1 / value < 0;

        // Perform the initial formatting.
        value = isNaN(value) ? nan : formatType(Math.abs(value), precision);

        // Trim insignificant zeros.
        if (trim) value = formatTrim(value);

        // If a negative value rounds to zero after formatting, and no explicit positive sign is requested, hide the sign.
        if (valueNegative && +value === 0 && sign !== "+") valueNegative = false;

        // Compute the prefix and suffix.
        valuePrefix = (valueNegative ? (sign === "(" ? sign : minus) : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;
        valueSuffix = (type === "s" ? prefixes[8 + prefixExponent / 3] : "") + valueSuffix + (valueNegative && sign === "(" ? ")" : "");

        // Break the formatted value into the integer “value” part that can be
        // grouped, and fractional or exponential “suffix” part that is not.
        if (maybeSuffix) {
          i = -1, n = value.length;
          while (++i < n) {
            if (c = value.charCodeAt(i), 48 > c || c > 57) {
              valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
              value = value.slice(0, i);
              break;
            }
          }
        }
      }

      // If the fill character is not "0", grouping is applied before padding.
      if (comma && !zero) value = group(value, Infinity);

      // Compute the padding.
      var length = valuePrefix.length + value.length + valueSuffix.length,
          padding = length < width ? new Array(width - length + 1).join(fill) : "";

      // If the fill character is "0", grouping is applied after padding.
      if (comma && zero) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";

      // Reconstruct the final output based on the desired alignment.
      switch (align) {
        case "<": value = valuePrefix + value + valueSuffix + padding; break;
        case "=": value = valuePrefix + padding + value + valueSuffix; break;
        case "^": value = padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length); break;
        default: value = padding + valuePrefix + value + valueSuffix; break;
      }

      return numerals(value);
    }

    format.toString = function() {
      return specifier + "";
    };

    return format;
  }

  function formatPrefix(specifier, value) {
    var f = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier)),
        e = Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3,
        k = Math.pow(10, -e),
        prefix = prefixes[8 + e / 3];
    return function(value) {
      return f(k * value) + prefix;
    };
  }

  return {
    format: newFormat,
    formatPrefix: formatPrefix
  };
}

var locale;
var format;
var formatPrefix;

defaultLocale({
  decimal: ".",
  thousands: ",",
  grouping: [3],
  currency: ["$", ""],
  minus: "-"
});

function defaultLocale(definition) {
  locale = formatLocale(definition);
  format = locale.format;
  formatPrefix = locale.formatPrefix;
  return locale;
}

function precisionFixed(step) {
  return Math.max(0, -exponent(Math.abs(step)));
}

function precisionPrefix(step, value) {
  return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3 - exponent(Math.abs(step)));
}

function precisionRound(step, max) {
  step = Math.abs(step), max = Math.abs(max) - step;
  return Math.max(0, exponent(max) - exponent(step)) + 1;
}

function defaultSource() {
  return Math.random();
}

((function sourceRandomUniform(source) {
  function randomUniform(min, max) {
    min = min == null ? 0 : +min;
    max = max == null ? 1 : +max;
    if (arguments.length === 1) max = min, min = 0;
    else max -= min;
    return function() {
      return source() * max + min;
    };
  }

  randomUniform.source = sourceRandomUniform;

  return randomUniform;
}))(defaultSource);

var normal = (function sourceRandomNormal(source) {
  function randomNormal(mu, sigma) {
    var x, r;
    mu = mu == null ? 0 : +mu;
    sigma = sigma == null ? 1 : +sigma;
    return function() {
      var y;

      // If available, use the second previously-generated uniform random.
      if (x != null) y = x, x = null;

      // Otherwise, generate a new x and y.
      else do {
        x = source() * 2 - 1;
        y = source() * 2 - 1;
        r = x * x + y * y;
      } while (!r || r > 1);

      return mu + sigma * y * Math.sqrt(-2 * Math.log(r) / r);
    };
  }

  randomNormal.source = sourceRandomNormal;

  return randomNormal;
})(defaultSource);

((function sourceRandomLogNormal(source) {
  function randomLogNormal() {
    var randomNormal = normal.source(source).apply(this, arguments);
    return function() {
      return Math.exp(randomNormal());
    };
  }

  randomLogNormal.source = sourceRandomLogNormal;

  return randomLogNormal;
}))(defaultSource);

var irwinHall = (function sourceRandomIrwinHall(source) {
  function randomIrwinHall(n) {
    return function() {
      for (var sum = 0, i = 0; i < n; ++i) sum += source();
      return sum;
    };
  }

  randomIrwinHall.source = sourceRandomIrwinHall;

  return randomIrwinHall;
})(defaultSource);

((function sourceRandomBates(source) {
  function randomBates(n) {
    var randomIrwinHall = irwinHall.source(source)(n);
    return function() {
      return randomIrwinHall() / n;
    };
  }

  randomBates.source = sourceRandomBates;

  return randomBates;
}))(defaultSource);

((function sourceRandomExponential(source) {
  function randomExponential(lambda) {
    return function() {
      return -Math.log(1 - source()) / lambda;
    };
  }

  randomExponential.source = sourceRandomExponential;

  return randomExponential;
}))(defaultSource);

function ascending(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

function bisector(compare) {
  if (compare.length === 1) compare = ascendingComparator(compare);
  return {
    left: function(a, x, lo, hi) {
      if (lo == null) lo = 0;
      if (hi == null) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (compare(a[mid], x) < 0) lo = mid + 1;
        else hi = mid;
      }
      return lo;
    },
    right: function(a, x, lo, hi) {
      if (lo == null) lo = 0;
      if (hi == null) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (compare(a[mid], x) > 0) hi = mid;
        else lo = mid + 1;
      }
      return lo;
    }
  };
}

function ascendingComparator(f) {
  return function(d, x) {
    return ascending(f(d), x);
  };
}

var ascendingBisect = bisector(ascending);
var bisectRight = ascendingBisect.right;

function sequence(start, stop, step) {
  start = +start, stop = +stop, step = (n = arguments.length) < 2 ? (stop = start, start = 0, 1) : n < 3 ? 1 : +step;

  var i = -1,
      n = Math.max(0, Math.ceil((stop - start) / step)) | 0,
      range = new Array(n);

  while (++i < n) {
    range[i] = start + i * step;
  }

  return range;
}

var e10 = Math.sqrt(50),
    e5 = Math.sqrt(10),
    e2 = Math.sqrt(2);

function ticks(start, stop, count) {
  var reverse,
      i = -1,
      n,
      ticks,
      step;

  stop = +stop, start = +start, count = +count;
  if (start === stop && count > 0) return [start];
  if (reverse = stop < start) n = start, start = stop, stop = n;
  if ((step = tickIncrement(start, stop, count)) === 0 || !isFinite(step)) return [];

  if (step > 0) {
    start = Math.ceil(start / step);
    stop = Math.floor(stop / step);
    ticks = new Array(n = Math.ceil(stop - start + 1));
    while (++i < n) ticks[i] = (start + i) * step;
  } else {
    start = Math.floor(start * step);
    stop = Math.ceil(stop * step);
    ticks = new Array(n = Math.ceil(start - stop + 1));
    while (++i < n) ticks[i] = (start - i) / step;
  }

  if (reverse) ticks.reverse();

  return ticks;
}

function tickIncrement(start, stop, count) {
  var step = (stop - start) / Math.max(0, count),
      power = Math.floor(Math.log(step) / Math.LN10),
      error = step / Math.pow(10, power);
  return power >= 0
      ? (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1) * Math.pow(10, power)
      : -Math.pow(10, -power) / (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1);
}

function tickStep(start, stop, count) {
  var step0 = Math.abs(stop - start) / Math.max(0, count),
      step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10)),
      error = step0 / step1;
  if (error >= e10) step1 *= 10;
  else if (error >= e5) step1 *= 5;
  else if (error >= e2) step1 *= 2;
  return stop < start ? -step1 : step1;
}

function initRange(domain, range) {
  switch (arguments.length) {
    case 0: break;
    case 1: this.range(domain); break;
    default: this.range(range).domain(domain); break;
  }
  return this;
}

var array = Array.prototype;

var map = array.map;
var slice$1 = array.slice;

var implicit = {name: "implicit"};

function ordinal() {
  var index = map$2(),
      domain = [],
      range = [],
      unknown = implicit;

  function scale(d) {
    var key = d + "", i = index.get(key);
    if (!i) {
      if (unknown !== implicit) return unknown;
      index.set(key, i = domain.push(d));
    }
    return range[(i - 1) % range.length];
  }

  scale.domain = function(_) {
    if (!arguments.length) return domain.slice();
    domain = [], index = map$2();
    var i = -1, n = _.length, d, key;
    while (++i < n) if (!index.has(key = (d = _[i]) + "")) index.set(key, domain.push(d));
    return scale;
  };

  scale.range = function(_) {
    return arguments.length ? (range = slice$1.call(_), scale) : range.slice();
  };

  scale.unknown = function(_) {
    return arguments.length ? (unknown = _, scale) : unknown;
  };

  scale.copy = function() {
    return ordinal(domain, range).unknown(unknown);
  };

  initRange.apply(scale, arguments);

  return scale;
}

function band() {
  var scale = ordinal().unknown(undefined),
      domain = scale.domain,
      ordinalRange = scale.range,
      range = [0, 1],
      step,
      bandwidth,
      round = false,
      paddingInner = 0,
      paddingOuter = 0,
      align = 0.5;

  delete scale.unknown;

  function rescale() {
    var n = domain().length,
        reverse = range[1] < range[0],
        start = range[reverse - 0],
        stop = range[1 - reverse];
    step = (stop - start) / Math.max(1, n - paddingInner + paddingOuter * 2);
    if (round) step = Math.floor(step);
    start += (stop - start - step * (n - paddingInner)) * align;
    bandwidth = step * (1 - paddingInner);
    if (round) start = Math.round(start), bandwidth = Math.round(bandwidth);
    var values = sequence(n).map(function(i) { return start + step * i; });
    return ordinalRange(reverse ? values.reverse() : values);
  }

  scale.domain = function(_) {
    return arguments.length ? (domain(_), rescale()) : domain();
  };

  scale.range = function(_) {
    return arguments.length ? (range = [+_[0], +_[1]], rescale()) : range.slice();
  };

  scale.rangeRound = function(_) {
    return range = [+_[0], +_[1]], round = true, rescale();
  };

  scale.bandwidth = function() {
    return bandwidth;
  };

  scale.step = function() {
    return step;
  };

  scale.round = function(_) {
    return arguments.length ? (round = !!_, rescale()) : round;
  };

  scale.padding = function(_) {
    return arguments.length ? (paddingInner = Math.min(1, paddingOuter = +_), rescale()) : paddingInner;
  };

  scale.paddingInner = function(_) {
    return arguments.length ? (paddingInner = Math.min(1, _), rescale()) : paddingInner;
  };

  scale.paddingOuter = function(_) {
    return arguments.length ? (paddingOuter = +_, rescale()) : paddingOuter;
  };

  scale.align = function(_) {
    return arguments.length ? (align = Math.max(0, Math.min(1, _)), rescale()) : align;
  };

  scale.copy = function() {
    return band(domain(), range)
        .round(round)
        .paddingInner(paddingInner)
        .paddingOuter(paddingOuter)
        .align(align);
  };

  return initRange.apply(rescale(), arguments);
}

function pointish(scale) {
  var copy = scale.copy;

  scale.padding = scale.paddingOuter;
  delete scale.paddingInner;
  delete scale.paddingOuter;

  scale.copy = function() {
    return pointish(copy());
  };

  return scale;
}

function point$1() {
  return pointish(band.apply(null, arguments).paddingInner(1));
}

function constant$1(x) {
  return function() {
    return x;
  };
}

function number(x) {
  return +x;
}

var unit = [0, 1];

function identity(x) {
  return x;
}

function normalize(a, b) {
  return (b -= (a = +a))
      ? function(x) { return (x - a) / b; }
      : constant$1(isNaN(b) ? NaN : 0.5);
}

function clamper(domain) {
  var a = domain[0], b = domain[domain.length - 1], t;
  if (a > b) t = a, a = b, b = t;
  return function(x) { return Math.max(a, Math.min(b, x)); };
}

// normalize(a, b)(x) takes a domain value x in [a,b] and returns the corresponding parameter t in [0,1].
// interpolate(a, b)(t) takes a parameter t in [0,1] and returns the corresponding range value x in [a,b].
function bimap(domain, range, interpolate) {
  var d0 = domain[0], d1 = domain[1], r0 = range[0], r1 = range[1];
  if (d1 < d0) d0 = normalize(d1, d0), r0 = interpolate(r1, r0);
  else d0 = normalize(d0, d1), r0 = interpolate(r0, r1);
  return function(x) { return r0(d0(x)); };
}

function polymap(domain, range, interpolate) {
  var j = Math.min(domain.length, range.length) - 1,
      d = new Array(j),
      r = new Array(j),
      i = -1;

  // Reverse descending domains.
  if (domain[j] < domain[0]) {
    domain = domain.slice().reverse();
    range = range.slice().reverse();
  }

  while (++i < j) {
    d[i] = normalize(domain[i], domain[i + 1]);
    r[i] = interpolate(range[i], range[i + 1]);
  }

  return function(x) {
    var i = bisectRight(domain, x, 1, j) - 1;
    return r[i](d[i](x));
  };
}

function copy(source, target) {
  return target
      .domain(source.domain())
      .range(source.range())
      .interpolate(source.interpolate())
      .clamp(source.clamp())
      .unknown(source.unknown());
}

function transformer() {
  var domain = unit,
      range = unit,
      interpolate = interpolateValue,
      transform,
      untransform,
      unknown,
      clamp = identity,
      piecewise,
      output,
      input;

  function rescale() {
    piecewise = Math.min(domain.length, range.length) > 2 ? polymap : bimap;
    output = input = null;
    return scale;
  }

  function scale(x) {
    return isNaN(x = +x) ? unknown : (output || (output = piecewise(domain.map(transform), range, interpolate)))(transform(clamp(x)));
  }

  scale.invert = function(y) {
    return clamp(untransform((input || (input = piecewise(range, domain.map(transform), interpolateNumber)))(y)));
  };

  scale.domain = function(_) {
    return arguments.length ? (domain = map.call(_, number), clamp === identity || (clamp = clamper(domain)), rescale()) : domain.slice();
  };

  scale.range = function(_) {
    return arguments.length ? (range = slice$1.call(_), rescale()) : range.slice();
  };

  scale.rangeRound = function(_) {
    return range = slice$1.call(_), interpolate = interpolateRound, rescale();
  };

  scale.clamp = function(_) {
    return arguments.length ? (clamp = _ ? clamper(domain) : identity, scale) : clamp !== identity;
  };

  scale.interpolate = function(_) {
    return arguments.length ? (interpolate = _, rescale()) : interpolate;
  };

  scale.unknown = function(_) {
    return arguments.length ? (unknown = _, scale) : unknown;
  };

  return function(t, u) {
    transform = t, untransform = u;
    return rescale();
  };
}

function continuous(transform, untransform) {
  return transformer()(transform, untransform);
}

function tickFormat(start, stop, count, specifier) {
  var step = tickStep(start, stop, count),
      precision;
  specifier = formatSpecifier(specifier == null ? ",f" : specifier);
  switch (specifier.type) {
    case "s": {
      var value = Math.max(Math.abs(start), Math.abs(stop));
      if (specifier.precision == null && !isNaN(precision = precisionPrefix(step, value))) specifier.precision = precision;
      return formatPrefix(specifier, value);
    }
    case "":
    case "e":
    case "g":
    case "p":
    case "r": {
      if (specifier.precision == null && !isNaN(precision = precisionRound(step, Math.max(Math.abs(start), Math.abs(stop))))) specifier.precision = precision - (specifier.type === "e");
      break;
    }
    case "f":
    case "%": {
      if (specifier.precision == null && !isNaN(precision = precisionFixed(step))) specifier.precision = precision - (specifier.type === "%") * 2;
      break;
    }
  }
  return format(specifier);
}

function linearish(scale) {
  var domain = scale.domain;

  scale.ticks = function(count) {
    var d = domain();
    return ticks(d[0], d[d.length - 1], count == null ? 10 : count);
  };

  scale.tickFormat = function(count, specifier) {
    var d = domain();
    return tickFormat(d[0], d[d.length - 1], count == null ? 10 : count, specifier);
  };

  scale.nice = function(count) {
    if (count == null) count = 10;

    var d = domain(),
        i0 = 0,
        i1 = d.length - 1,
        start = d[i0],
        stop = d[i1],
        step;

    if (stop < start) {
      step = start, start = stop, stop = step;
      step = i0, i0 = i1, i1 = step;
    }

    step = tickIncrement(start, stop, count);

    if (step > 0) {
      start = Math.floor(start / step) * step;
      stop = Math.ceil(stop / step) * step;
      step = tickIncrement(start, stop, count);
    } else if (step < 0) {
      start = Math.ceil(start * step) / step;
      stop = Math.floor(stop * step) / step;
      step = tickIncrement(start, stop, count);
    }

    if (step > 0) {
      d[i0] = Math.floor(start / step) * step;
      d[i1] = Math.ceil(stop / step) * step;
      domain(d);
    } else if (step < 0) {
      d[i0] = Math.ceil(start * step) / step;
      d[i1] = Math.floor(stop * step) / step;
      domain(d);
    }

    return scale;
  };

  return scale;
}

function linear() {
  var scale = continuous(identity, identity);

  scale.copy = function() {
    return copy(scale, linear());
  };

  initRange.apply(scale, arguments);

  return linearish(scale);
}

function nice(domain, interval) {
  domain = domain.slice();

  var i0 = 0,
      i1 = domain.length - 1,
      x0 = domain[i0],
      x1 = domain[i1],
      t;

  if (x1 < x0) {
    t = i0, i0 = i1, i1 = t;
    t = x0, x0 = x1, x1 = t;
  }

  domain[i0] = interval.floor(x0);
  domain[i1] = interval.ceil(x1);
  return domain;
}

function transformLog(x) {
  return Math.log(x);
}

function transformExp(x) {
  return Math.exp(x);
}

function transformLogn(x) {
  return -Math.log(-x);
}

function transformExpn(x) {
  return -Math.exp(-x);
}

function pow10(x) {
  return isFinite(x) ? +("1e" + x) : x < 0 ? 0 : x;
}

function powp(base) {
  return base === 10 ? pow10
      : base === Math.E ? Math.exp
      : function(x) { return Math.pow(base, x); };
}

function logp(base) {
  return base === Math.E ? Math.log
      : base === 10 && Math.log10
      || base === 2 && Math.log2
      || (base = Math.log(base), function(x) { return Math.log(x) / base; });
}

function reflect(f) {
  return function(x) {
    return -f(-x);
  };
}

function loggish(transform) {
  var scale = transform(transformLog, transformExp),
      domain = scale.domain,
      base = 10,
      logs,
      pows;

  function rescale() {
    logs = logp(base), pows = powp(base);
    if (domain()[0] < 0) {
      logs = reflect(logs), pows = reflect(pows);
      transform(transformLogn, transformExpn);
    } else {
      transform(transformLog, transformExp);
    }
    return scale;
  }

  scale.base = function(_) {
    return arguments.length ? (base = +_, rescale()) : base;
  };

  scale.domain = function(_) {
    return arguments.length ? (domain(_), rescale()) : domain();
  };

  scale.ticks = function(count) {
    var d = domain(),
        u = d[0],
        v = d[d.length - 1],
        r;

    if (r = v < u) i = u, u = v, v = i;

    var i = logs(u),
        j = logs(v),
        p,
        k,
        t,
        n = count == null ? 10 : +count,
        z = [];

    if (!(base % 1) && j - i < n) {
      i = Math.round(i) - 1, j = Math.round(j) + 1;
      if (u > 0) for (; i < j; ++i) {
        for (k = 1, p = pows(i); k < base; ++k) {
          t = p * k;
          if (t < u) continue;
          if (t > v) break;
          z.push(t);
        }
      } else for (; i < j; ++i) {
        for (k = base - 1, p = pows(i); k >= 1; --k) {
          t = p * k;
          if (t < u) continue;
          if (t > v) break;
          z.push(t);
        }
      }
    } else {
      z = ticks(i, j, Math.min(j - i, n)).map(pows);
    }

    return r ? z.reverse() : z;
  };

  scale.tickFormat = function(count, specifier) {
    if (specifier == null) specifier = base === 10 ? ".0e" : ",";
    if (typeof specifier !== "function") specifier = format(specifier);
    if (count === Infinity) return specifier;
    if (count == null) count = 10;
    var k = Math.max(1, base * count / scale.ticks().length); // TODO fast estimate?
    return function(d) {
      var i = d / pows(Math.round(logs(d)));
      if (i * base < base - 0.5) i *= base;
      return i <= k ? specifier(d) : "";
    };
  };

  scale.nice = function() {
    return domain(nice(domain(), {
      floor: function(x) { return pows(Math.floor(logs(x))); },
      ceil: function(x) { return pows(Math.ceil(logs(x))); }
    }));
  };

  return scale;
}

function log() {
  var scale = loggish(transformer()).domain([1, 10]);

  scale.copy = function() {
    return copy(scale, log()).base(scale.base());
  };

  initRange.apply(scale, arguments);

  return scale;
}

function colors(specifier) {
  var n = specifier.length / 6 | 0, colors = new Array(n), i = 0;
  while (i < n) colors[i] = "#" + specifier.slice(i * 6, ++i * 6);
  return colors;
}

var Set2 = colors("66c2a5fc8d628da0cbe78ac3a6d854ffd92fe5c494b3b3b3");

function constant(x) {
  return function constant() {
    return x;
  };
}

function Linear(context) {
  this._context = context;
}

Linear.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._point = 0;
  },
  lineEnd: function() {
    if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
      case 1: this._point = 2; // proceed
      default: this._context.lineTo(x, y); break;
    }
  }
};

function curveLinear(context) {
  return new Linear(context);
}

function x(p) {
  return p[0];
}

function y(p) {
  return p[1];
}

function line() {
  var x$1 = x,
      y$1 = y,
      defined = constant(true),
      context = null,
      curve = curveLinear,
      output = null;

  function line(data) {
    var i,
        n = data.length,
        d,
        defined0 = false,
        buffer;

    if (context == null) output = curve(buffer = path());

    for (i = 0; i <= n; ++i) {
      if (!(i < n && defined(d = data[i], i, data)) === defined0) {
        if (defined0 = !defined0) output.lineStart();
        else output.lineEnd();
      }
      if (defined0) output.point(+x$1(d, i, data), +y$1(d, i, data));
    }

    if (buffer) return output = null, buffer + "" || null;
  }

  line.x = function(_) {
    return arguments.length ? (x$1 = typeof _ === "function" ? _ : constant(+_), line) : x$1;
  };

  line.y = function(_) {
    return arguments.length ? (y$1 = typeof _ === "function" ? _ : constant(+_), line) : y$1;
  };

  line.defined = function(_) {
    return arguments.length ? (defined = typeof _ === "function" ? _ : constant(!!_), line) : defined;
  };

  line.curve = function(_) {
    return arguments.length ? (curve = _, context != null && (output = curve(context)), line) : curve;
  };

  line.context = function(_) {
    return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), line) : context;
  };

  return line;
}

function area() {
  var x0 = x,
      x1 = null,
      y0 = constant(0),
      y1 = y,
      defined = constant(true),
      context = null,
      curve = curveLinear,
      output = null;

  function area(data) {
    var i,
        j,
        k,
        n = data.length,
        d,
        defined0 = false,
        buffer,
        x0z = new Array(n),
        y0z = new Array(n);

    if (context == null) output = curve(buffer = path());

    for (i = 0; i <= n; ++i) {
      if (!(i < n && defined(d = data[i], i, data)) === defined0) {
        if (defined0 = !defined0) {
          j = i;
          output.areaStart();
          output.lineStart();
        } else {
          output.lineEnd();
          output.lineStart();
          for (k = i - 1; k >= j; --k) {
            output.point(x0z[k], y0z[k]);
          }
          output.lineEnd();
          output.areaEnd();
        }
      }
      if (defined0) {
        x0z[i] = +x0(d, i, data), y0z[i] = +y0(d, i, data);
        output.point(x1 ? +x1(d, i, data) : x0z[i], y1 ? +y1(d, i, data) : y0z[i]);
      }
    }

    if (buffer) return output = null, buffer + "" || null;
  }

  function arealine() {
    return line().defined(defined).curve(curve).context(context);
  }

  area.x = function(_) {
    return arguments.length ? (x0 = typeof _ === "function" ? _ : constant(+_), x1 = null, area) : x0;
  };

  area.x0 = function(_) {
    return arguments.length ? (x0 = typeof _ === "function" ? _ : constant(+_), area) : x0;
  };

  area.x1 = function(_) {
    return arguments.length ? (x1 = _ == null ? null : typeof _ === "function" ? _ : constant(+_), area) : x1;
  };

  area.y = function(_) {
    return arguments.length ? (y0 = typeof _ === "function" ? _ : constant(+_), y1 = null, area) : y0;
  };

  area.y0 = function(_) {
    return arguments.length ? (y0 = typeof _ === "function" ? _ : constant(+_), area) : y0;
  };

  area.y1 = function(_) {
    return arguments.length ? (y1 = _ == null ? null : typeof _ === "function" ? _ : constant(+_), area) : y1;
  };

  area.lineX0 =
  area.lineY0 = function() {
    return arealine().x(x0).y(y0);
  };

  area.lineY1 = function() {
    return arealine().x(x0).y(y1);
  };

  area.lineX1 = function() {
    return arealine().x(x1).y(y0);
  };

  area.defined = function(_) {
    return arguments.length ? (defined = typeof _ === "function" ? _ : constant(!!_), area) : defined;
  };

  area.curve = function(_) {
    return arguments.length ? (curve = _, context != null && (output = curve(context)), area) : curve;
  };

  area.context = function(_) {
    return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), area) : context;
  };

  return area;
}

var slice = Array.prototype.slice;

function linkSource(d) {
  return d.source;
}

function linkTarget(d) {
  return d.target;
}

function link(curve) {
  var source = linkSource,
      target = linkTarget,
      x$1 = x,
      y$1 = y,
      context = null;

  function link() {
    var buffer, argv = slice.call(arguments), s = source.apply(this, argv), t = target.apply(this, argv);
    if (!context) context = buffer = path();
    curve(context, +x$1.apply(this, (argv[0] = s, argv)), +y$1.apply(this, argv), +x$1.apply(this, (argv[0] = t, argv)), +y$1.apply(this, argv));
    if (buffer) return context = null, buffer + "" || null;
  }

  link.source = function(_) {
    return arguments.length ? (source = _, link) : source;
  };

  link.target = function(_) {
    return arguments.length ? (target = _, link) : target;
  };

  link.x = function(_) {
    return arguments.length ? (x$1 = typeof _ === "function" ? _ : constant(+_), link) : x$1;
  };

  link.y = function(_) {
    return arguments.length ? (y$1 = typeof _ === "function" ? _ : constant(+_), link) : y$1;
  };

  link.context = function(_) {
    return arguments.length ? ((context = _ == null ? null : _), link) : context;
  };

  return link;
}

function curveVertical(context, x0, y0, x1, y1) {
  context.moveTo(x0, y0);
  context.bezierCurveTo(x0, y0 = (y0 + y1) / 2, x1, y0, x1, y1);
}

function linkVertical() {
  return link(curveVertical);
}

function point(that, x, y) {
  that._context.bezierCurveTo(
    (2 * that._x0 + that._x1) / 3,
    (2 * that._y0 + that._y1) / 3,
    (that._x0 + 2 * that._x1) / 3,
    (that._y0 + 2 * that._y1) / 3,
    (that._x0 + 4 * that._x1 + x) / 6,
    (that._y0 + 4 * that._y1 + y) / 6
  );
}

function Basis(context) {
  this._context = context;
}

Basis.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 =
    this._y0 = this._y1 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 3: point(this, this._x1, this._y1); // proceed
      case 2: this._context.lineTo(this._x1, this._y1); break;
    }
    if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
      case 1: this._point = 2; break;
      case 2: this._point = 3; this._context.lineTo((5 * this._x0 + this._x1) / 6, (5 * this._y0 + this._y1) / 6); // proceed
      default: point(this, x, y); break;
    }
    this._x0 = this._x1, this._x1 = x;
    this._y0 = this._y1, this._y1 = y;
  }
};

function basis(context) {
  return new Basis(context);
}

function none$1(series, order) {
  if (!((n = series.length) > 1)) return;
  for (var i = 1, j, s0, s1 = series[order[0]], n, m = s1.length; i < n; ++i) {
    s0 = s1, s1 = series[order[i]];
    for (j = 0; j < m; ++j) {
      s1[j][1] += s1[j][0] = isNaN(s0[j][1]) ? s0[j][0] : s0[j][1];
    }
  }
}

function none(series) {
  var n = series.length, o = new Array(n);
  while (--n >= 0) o[n] = n;
  return o;
}

function stackValue(d, key) {
  return d[key];
}

function stack() {
  var keys = constant([]),
      order = none,
      offset = none$1,
      value = stackValue;

  function stack(data) {
    var kz = keys.apply(this, arguments),
        i,
        m = data.length,
        n = kz.length,
        sz = new Array(n),
        oz;

    for (i = 0; i < n; ++i) {
      for (var ki = kz[i], si = sz[i] = new Array(m), j = 0, sij; j < m; ++j) {
        si[j] = sij = [0, +value(data[j], ki, j, data)];
        sij.data = data[j];
      }
      si.key = ki;
    }

    for (i = 0, oz = order(sz); i < n; ++i) {
      sz[oz[i]].index = i;
    }

    offset(sz, oz);
    return sz;
  }

  stack.keys = function(_) {
    return arguments.length ? (keys = typeof _ === "function" ? _ : constant(slice.call(_)), stack) : keys;
  };

  stack.value = function(_) {
    return arguments.length ? (value = typeof _ === "function" ? _ : constant(+_), stack) : value;
  };

  stack.order = function(_) {
    return arguments.length ? (order = _ == null ? none : typeof _ === "function" ? _ : constant(slice.call(_)), stack) : order;
  };

  stack.offset = function(_) {
    return arguments.length ? (offset = _ == null ? none$1 : _, stack) : offset;
  };

  return stack;
}

function silhouette(series, order) {
  if (!((n = series.length) > 0)) return;
  for (var j = 0, s0 = series[order[0]], n, m = s0.length; j < m; ++j) {
    for (var i = 0, y = 0; i < n; ++i) y += series[i][j][1] || 0;
    s0[j][1] += s0[j][0] = -y / 2;
  }
  none$1(series, order);
}

function RedBlackTree() {
  this._ = null; // root node
}

function RedBlackNode(node) {
  node.U = // parent node
  node.C = // color - true for red, false for black
  node.L = // left node
  node.R = // right node
  node.P = // previous node
  node.N = null; // next node
}

RedBlackTree.prototype = {
  constructor: RedBlackTree,

  insert: function(after, node) {
    var parent, grandpa, uncle;

    if (after) {
      node.P = after;
      node.N = after.N;
      if (after.N) after.N.P = node;
      after.N = node;
      if (after.R) {
        after = after.R;
        while (after.L) after = after.L;
        after.L = node;
      } else {
        after.R = node;
      }
      parent = after;
    } else if (this._) {
      after = RedBlackFirst(this._);
      node.P = null;
      node.N = after;
      after.P = after.L = node;
      parent = after;
    } else {
      node.P = node.N = null;
      this._ = node;
      parent = null;
    }
    node.L = node.R = null;
    node.U = parent;
    node.C = true;

    after = node;
    while (parent && parent.C) {
      grandpa = parent.U;
      if (parent === grandpa.L) {
        uncle = grandpa.R;
        if (uncle && uncle.C) {
          parent.C = uncle.C = false;
          grandpa.C = true;
          after = grandpa;
        } else {
          if (after === parent.R) {
            RedBlackRotateLeft(this, parent);
            after = parent;
            parent = after.U;
          }
          parent.C = false;
          grandpa.C = true;
          RedBlackRotateRight(this, grandpa);
        }
      } else {
        uncle = grandpa.L;
        if (uncle && uncle.C) {
          parent.C = uncle.C = false;
          grandpa.C = true;
          after = grandpa;
        } else {
          if (after === parent.L) {
            RedBlackRotateRight(this, parent);
            after = parent;
            parent = after.U;
          }
          parent.C = false;
          grandpa.C = true;
          RedBlackRotateLeft(this, grandpa);
        }
      }
      parent = after.U;
    }
    this._.C = false;
  },

  remove: function(node) {
    if (node.N) node.N.P = node.P;
    if (node.P) node.P.N = node.N;
    node.N = node.P = null;

    var parent = node.U,
        sibling,
        left = node.L,
        right = node.R,
        next,
        red;

    if (!left) next = right;
    else if (!right) next = left;
    else next = RedBlackFirst(right);

    if (parent) {
      if (parent.L === node) parent.L = next;
      else parent.R = next;
    } else {
      this._ = next;
    }

    if (left && right) {
      red = next.C;
      next.C = node.C;
      next.L = left;
      left.U = next;
      if (next !== right) {
        parent = next.U;
        next.U = node.U;
        node = next.R;
        parent.L = node;
        next.R = right;
        right.U = next;
      } else {
        next.U = parent;
        parent = next;
        node = next.R;
      }
    } else {
      red = node.C;
      node = next;
    }

    if (node) node.U = parent;
    if (red) return;
    if (node && node.C) { node.C = false; return; }

    do {
      if (node === this._) break;
      if (node === parent.L) {
        sibling = parent.R;
        if (sibling.C) {
          sibling.C = false;
          parent.C = true;
          RedBlackRotateLeft(this, parent);
          sibling = parent.R;
        }
        if ((sibling.L && sibling.L.C)
            || (sibling.R && sibling.R.C)) {
          if (!sibling.R || !sibling.R.C) {
            sibling.L.C = false;
            sibling.C = true;
            RedBlackRotateRight(this, sibling);
            sibling = parent.R;
          }
          sibling.C = parent.C;
          parent.C = sibling.R.C = false;
          RedBlackRotateLeft(this, parent);
          node = this._;
          break;
        }
      } else {
        sibling = parent.L;
        if (sibling.C) {
          sibling.C = false;
          parent.C = true;
          RedBlackRotateRight(this, parent);
          sibling = parent.L;
        }
        if ((sibling.L && sibling.L.C)
          || (sibling.R && sibling.R.C)) {
          if (!sibling.L || !sibling.L.C) {
            sibling.R.C = false;
            sibling.C = true;
            RedBlackRotateLeft(this, sibling);
            sibling = parent.L;
          }
          sibling.C = parent.C;
          parent.C = sibling.L.C = false;
          RedBlackRotateRight(this, parent);
          node = this._;
          break;
        }
      }
      sibling.C = true;
      node = parent;
      parent = parent.U;
    } while (!node.C);

    if (node) node.C = false;
  }
};

function RedBlackRotateLeft(tree, node) {
  var p = node,
      q = node.R,
      parent = p.U;

  if (parent) {
    if (parent.L === p) parent.L = q;
    else parent.R = q;
  } else {
    tree._ = q;
  }

  q.U = parent;
  p.U = q;
  p.R = q.L;
  if (p.R) p.R.U = p;
  q.L = p;
}

function RedBlackRotateRight(tree, node) {
  var p = node,
      q = node.L,
      parent = p.U;

  if (parent) {
    if (parent.L === p) parent.L = q;
    else parent.R = q;
  } else {
    tree._ = q;
  }

  q.U = parent;
  p.U = q;
  p.L = q.R;
  if (p.L) p.L.U = p;
  q.R = p;
}

function RedBlackFirst(node) {
  while (node.L) node = node.L;
  return node;
}

function createEdge(left, right, v0, v1) {
  var edge = [null, null],
      index = edges.push(edge) - 1;
  edge.left = left;
  edge.right = right;
  if (v0) setEdgeEnd(edge, left, right, v0);
  if (v1) setEdgeEnd(edge, right, left, v1);
  cells[left.index].halfedges.push(index);
  cells[right.index].halfedges.push(index);
  return edge;
}

function createBorderEdge(left, v0, v1) {
  var edge = [v0, v1];
  edge.left = left;
  return edge;
}

function setEdgeEnd(edge, left, right, vertex) {
  if (!edge[0] && !edge[1]) {
    edge[0] = vertex;
    edge.left = left;
    edge.right = right;
  } else if (edge.left === right) {
    edge[1] = vertex;
  } else {
    edge[0] = vertex;
  }
}

// Liang–Barsky line clipping.
function clipEdge(edge, x0, y0, x1, y1) {
  var a = edge[0],
      b = edge[1],
      ax = a[0],
      ay = a[1],
      bx = b[0],
      by = b[1],
      t0 = 0,
      t1 = 1,
      dx = bx - ax,
      dy = by - ay,
      r;

  r = x0 - ax;
  if (!dx && r > 0) return;
  r /= dx;
  if (dx < 0) {
    if (r < t0) return;
    if (r < t1) t1 = r;
  } else if (dx > 0) {
    if (r > t1) return;
    if (r > t0) t0 = r;
  }

  r = x1 - ax;
  if (!dx && r < 0) return;
  r /= dx;
  if (dx < 0) {
    if (r > t1) return;
    if (r > t0) t0 = r;
  } else if (dx > 0) {
    if (r < t0) return;
    if (r < t1) t1 = r;
  }

  r = y0 - ay;
  if (!dy && r > 0) return;
  r /= dy;
  if (dy < 0) {
    if (r < t0) return;
    if (r < t1) t1 = r;
  } else if (dy > 0) {
    if (r > t1) return;
    if (r > t0) t0 = r;
  }

  r = y1 - ay;
  if (!dy && r < 0) return;
  r /= dy;
  if (dy < 0) {
    if (r > t1) return;
    if (r > t0) t0 = r;
  } else if (dy > 0) {
    if (r < t0) return;
    if (r < t1) t1 = r;
  }

  if (!(t0 > 0) && !(t1 < 1)) return true; // TODO Better check?

  if (t0 > 0) edge[0] = [ax + t0 * dx, ay + t0 * dy];
  if (t1 < 1) edge[1] = [ax + t1 * dx, ay + t1 * dy];
  return true;
}

function connectEdge(edge, x0, y0, x1, y1) {
  var v1 = edge[1];
  if (v1) return true;

  var v0 = edge[0],
      left = edge.left,
      right = edge.right,
      lx = left[0],
      ly = left[1],
      rx = right[0],
      ry = right[1],
      fx = (lx + rx) / 2,
      fy = (ly + ry) / 2,
      fm,
      fb;

  if (ry === ly) {
    if (fx < x0 || fx >= x1) return;
    if (lx > rx) {
      if (!v0) v0 = [fx, y0];
      else if (v0[1] >= y1) return;
      v1 = [fx, y1];
    } else {
      if (!v0) v0 = [fx, y1];
      else if (v0[1] < y0) return;
      v1 = [fx, y0];
    }
  } else {
    fm = (lx - rx) / (ry - ly);
    fb = fy - fm * fx;
    if (fm < -1 || fm > 1) {
      if (lx > rx) {
        if (!v0) v0 = [(y0 - fb) / fm, y0];
        else if (v0[1] >= y1) return;
        v1 = [(y1 - fb) / fm, y1];
      } else {
        if (!v0) v0 = [(y1 - fb) / fm, y1];
        else if (v0[1] < y0) return;
        v1 = [(y0 - fb) / fm, y0];
      }
    } else {
      if (ly < ry) {
        if (!v0) v0 = [x0, fm * x0 + fb];
        else if (v0[0] >= x1) return;
        v1 = [x1, fm * x1 + fb];
      } else {
        if (!v0) v0 = [x1, fm * x1 + fb];
        else if (v0[0] < x0) return;
        v1 = [x0, fm * x0 + fb];
      }
    }
  }

  edge[0] = v0;
  edge[1] = v1;
  return true;
}

function clipEdges(x0, y0, x1, y1) {
  var i = edges.length,
      edge;

  while (i--) {
    if (!connectEdge(edge = edges[i], x0, y0, x1, y1)
        || !clipEdge(edge, x0, y0, x1, y1)
        || !(Math.abs(edge[0][0] - edge[1][0]) > epsilon
            || Math.abs(edge[0][1] - edge[1][1]) > epsilon)) {
      delete edges[i];
    }
  }
}

function createCell(site) {
  return cells[site.index] = {
    site: site,
    halfedges: []
  };
}

function cellHalfedgeAngle(cell, edge) {
  var site = cell.site,
      va = edge.left,
      vb = edge.right;
  if (site === vb) vb = va, va = site;
  if (vb) return Math.atan2(vb[1] - va[1], vb[0] - va[0]);
  if (site === va) va = edge[1], vb = edge[0];
  else va = edge[0], vb = edge[1];
  return Math.atan2(va[0] - vb[0], vb[1] - va[1]);
}

function cellHalfedgeStart(cell, edge) {
  return edge[+(edge.left !== cell.site)];
}

function cellHalfedgeEnd(cell, edge) {
  return edge[+(edge.left === cell.site)];
}

function sortCellHalfedges() {
  for (var i = 0, n = cells.length, cell, halfedges, j, m; i < n; ++i) {
    if ((cell = cells[i]) && (m = (halfedges = cell.halfedges).length)) {
      var index = new Array(m),
          array = new Array(m);
      for (j = 0; j < m; ++j) index[j] = j, array[j] = cellHalfedgeAngle(cell, edges[halfedges[j]]);
      index.sort(function(i, j) { return array[j] - array[i]; });
      for (j = 0; j < m; ++j) array[j] = halfedges[index[j]];
      for (j = 0; j < m; ++j) halfedges[j] = array[j];
    }
  }
}

function clipCells(x0, y0, x1, y1) {
  var nCells = cells.length,
      iCell,
      cell,
      site,
      iHalfedge,
      halfedges,
      nHalfedges,
      start,
      startX,
      startY,
      end,
      endX,
      endY,
      cover = true;

  for (iCell = 0; iCell < nCells; ++iCell) {
    if (cell = cells[iCell]) {
      site = cell.site;
      halfedges = cell.halfedges;
      iHalfedge = halfedges.length;

      // Remove any dangling clipped edges.
      while (iHalfedge--) {
        if (!edges[halfedges[iHalfedge]]) {
          halfedges.splice(iHalfedge, 1);
        }
      }

      // Insert any border edges as necessary.
      iHalfedge = 0, nHalfedges = halfedges.length;
      while (iHalfedge < nHalfedges) {
        end = cellHalfedgeEnd(cell, edges[halfedges[iHalfedge]]), endX = end[0], endY = end[1];
        start = cellHalfedgeStart(cell, edges[halfedges[++iHalfedge % nHalfedges]]), startX = start[0], startY = start[1];
        if (Math.abs(endX - startX) > epsilon || Math.abs(endY - startY) > epsilon) {
          halfedges.splice(iHalfedge, 0, edges.push(createBorderEdge(site, end,
              Math.abs(endX - x0) < epsilon && y1 - endY > epsilon ? [x0, Math.abs(startX - x0) < epsilon ? startY : y1]
              : Math.abs(endY - y1) < epsilon && x1 - endX > epsilon ? [Math.abs(startY - y1) < epsilon ? startX : x1, y1]
              : Math.abs(endX - x1) < epsilon && endY - y0 > epsilon ? [x1, Math.abs(startX - x1) < epsilon ? startY : y0]
              : Math.abs(endY - y0) < epsilon && endX - x0 > epsilon ? [Math.abs(startY - y0) < epsilon ? startX : x0, y0]
              : null)) - 1);
          ++nHalfedges;
        }
      }

      if (nHalfedges) cover = false;
    }
  }

  // If there weren’t any edges, have the closest site cover the extent.
  // It doesn’t matter which corner of the extent we measure!
  if (cover) {
    var dx, dy, d2, dc = Infinity;

    for (iCell = 0, cover = null; iCell < nCells; ++iCell) {
      if (cell = cells[iCell]) {
        site = cell.site;
        dx = site[0] - x0;
        dy = site[1] - y0;
        d2 = dx * dx + dy * dy;
        if (d2 < dc) dc = d2, cover = cell;
      }
    }

    if (cover) {
      var v00 = [x0, y0], v01 = [x0, y1], v11 = [x1, y1], v10 = [x1, y0];
      cover.halfedges.push(
        edges.push(createBorderEdge(site = cover.site, v00, v01)) - 1,
        edges.push(createBorderEdge(site, v01, v11)) - 1,
        edges.push(createBorderEdge(site, v11, v10)) - 1,
        edges.push(createBorderEdge(site, v10, v00)) - 1
      );
    }
  }

  // Lastly delete any cells with no edges; these were entirely clipped.
  for (iCell = 0; iCell < nCells; ++iCell) {
    if (cell = cells[iCell]) {
      if (!cell.halfedges.length) {
        delete cells[iCell];
      }
    }
  }
}

var circlePool = [];

var firstCircle;

function Circle() {
  RedBlackNode(this);
  this.x =
  this.y =
  this.arc =
  this.site =
  this.cy = null;
}

function attachCircle(arc) {
  var lArc = arc.P,
      rArc = arc.N;

  if (!lArc || !rArc) return;

  var lSite = lArc.site,
      cSite = arc.site,
      rSite = rArc.site;

  if (lSite === rSite) return;

  var bx = cSite[0],
      by = cSite[1],
      ax = lSite[0] - bx,
      ay = lSite[1] - by,
      cx = rSite[0] - bx,
      cy = rSite[1] - by;

  var d = 2 * (ax * cy - ay * cx);
  if (d >= -epsilon2) return;

  var ha = ax * ax + ay * ay,
      hc = cx * cx + cy * cy,
      x = (cy * ha - ay * hc) / d,
      y = (ax * hc - cx * ha) / d;

  var circle = circlePool.pop() || new Circle;
  circle.arc = arc;
  circle.site = cSite;
  circle.x = x + bx;
  circle.y = (circle.cy = y + by) + Math.sqrt(x * x + y * y); // y bottom

  arc.circle = circle;

  var before = null,
      node = circles._;

  while (node) {
    if (circle.y < node.y || (circle.y === node.y && circle.x <= node.x)) {
      if (node.L) node = node.L;
      else { before = node.P; break; }
    } else {
      if (node.R) node = node.R;
      else { before = node; break; }
    }
  }

  circles.insert(before, circle);
  if (!before) firstCircle = circle;
}

function detachCircle(arc) {
  var circle = arc.circle;
  if (circle) {
    if (!circle.P) firstCircle = circle.N;
    circles.remove(circle);
    circlePool.push(circle);
    RedBlackNode(circle);
    arc.circle = null;
  }
}

var beachPool = [];

function Beach() {
  RedBlackNode(this);
  this.edge =
  this.site =
  this.circle = null;
}

function createBeach(site) {
  var beach = beachPool.pop() || new Beach;
  beach.site = site;
  return beach;
}

function detachBeach(beach) {
  detachCircle(beach);
  beaches.remove(beach);
  beachPool.push(beach);
  RedBlackNode(beach);
}

function removeBeach(beach) {
  var circle = beach.circle,
      x = circle.x,
      y = circle.cy,
      vertex = [x, y],
      previous = beach.P,
      next = beach.N,
      disappearing = [beach];

  detachBeach(beach);

  var lArc = previous;
  while (lArc.circle
      && Math.abs(x - lArc.circle.x) < epsilon
      && Math.abs(y - lArc.circle.cy) < epsilon) {
    previous = lArc.P;
    disappearing.unshift(lArc);
    detachBeach(lArc);
    lArc = previous;
  }

  disappearing.unshift(lArc);
  detachCircle(lArc);

  var rArc = next;
  while (rArc.circle
      && Math.abs(x - rArc.circle.x) < epsilon
      && Math.abs(y - rArc.circle.cy) < epsilon) {
    next = rArc.N;
    disappearing.push(rArc);
    detachBeach(rArc);
    rArc = next;
  }

  disappearing.push(rArc);
  detachCircle(rArc);

  var nArcs = disappearing.length,
      iArc;
  for (iArc = 1; iArc < nArcs; ++iArc) {
    rArc = disappearing[iArc];
    lArc = disappearing[iArc - 1];
    setEdgeEnd(rArc.edge, lArc.site, rArc.site, vertex);
  }

  lArc = disappearing[0];
  rArc = disappearing[nArcs - 1];
  rArc.edge = createEdge(lArc.site, rArc.site, null, vertex);

  attachCircle(lArc);
  attachCircle(rArc);
}

function addBeach(site) {
  var x = site[0],
      directrix = site[1],
      lArc,
      rArc,
      dxl,
      dxr,
      node = beaches._;

  while (node) {
    dxl = leftBreakPoint(node, directrix) - x;
    if (dxl > epsilon) node = node.L; else {
      dxr = x - rightBreakPoint(node, directrix);
      if (dxr > epsilon) {
        if (!node.R) {
          lArc = node;
          break;
        }
        node = node.R;
      } else {
        if (dxl > -epsilon) {
          lArc = node.P;
          rArc = node;
        } else if (dxr > -epsilon) {
          lArc = node;
          rArc = node.N;
        } else {
          lArc = rArc = node;
        }
        break;
      }
    }
  }

  createCell(site);
  var newArc = createBeach(site);
  beaches.insert(lArc, newArc);

  if (!lArc && !rArc) return;

  if (lArc === rArc) {
    detachCircle(lArc);
    rArc = createBeach(lArc.site);
    beaches.insert(newArc, rArc);
    newArc.edge = rArc.edge = createEdge(lArc.site, newArc.site);
    attachCircle(lArc);
    attachCircle(rArc);
    return;
  }

  if (!rArc) { // && lArc
    newArc.edge = createEdge(lArc.site, newArc.site);
    return;
  }

  // else lArc !== rArc
  detachCircle(lArc);
  detachCircle(rArc);

  var lSite = lArc.site,
      ax = lSite[0],
      ay = lSite[1],
      bx = site[0] - ax,
      by = site[1] - ay,
      rSite = rArc.site,
      cx = rSite[0] - ax,
      cy = rSite[1] - ay,
      d = 2 * (bx * cy - by * cx),
      hb = bx * bx + by * by,
      hc = cx * cx + cy * cy,
      vertex = [(cy * hb - by * hc) / d + ax, (bx * hc - cx * hb) / d + ay];

  setEdgeEnd(rArc.edge, lSite, rSite, vertex);
  newArc.edge = createEdge(lSite, site, null, vertex);
  rArc.edge = createEdge(site, rSite, null, vertex);
  attachCircle(lArc);
  attachCircle(rArc);
}

function leftBreakPoint(arc, directrix) {
  var site = arc.site,
      rfocx = site[0],
      rfocy = site[1],
      pby2 = rfocy - directrix;

  if (!pby2) return rfocx;

  var lArc = arc.P;
  if (!lArc) return -Infinity;

  site = lArc.site;
  var lfocx = site[0],
      lfocy = site[1],
      plby2 = lfocy - directrix;

  if (!plby2) return lfocx;

  var hl = lfocx - rfocx,
      aby2 = 1 / pby2 - 1 / plby2,
      b = hl / plby2;

  if (aby2) return (-b + Math.sqrt(b * b - 2 * aby2 * (hl * hl / (-2 * plby2) - lfocy + plby2 / 2 + rfocy - pby2 / 2))) / aby2 + rfocx;

  return (rfocx + lfocx) / 2;
}

function rightBreakPoint(arc, directrix) {
  var rArc = arc.N;
  if (rArc) return leftBreakPoint(rArc, directrix);
  var site = arc.site;
  return site[1] === directrix ? site[0] : Infinity;
}

var epsilon = 1e-6;
var epsilon2 = 1e-12;
var beaches;
var cells;
var circles;
var edges;

function triangleArea(a, b, c) {
  return (a[0] - c[0]) * (b[1] - a[1]) - (a[0] - b[0]) * (c[1] - a[1]);
}

function lexicographic(a, b) {
  return b[1] - a[1]
      || b[0] - a[0];
}

function Diagram(sites, extent) {
  var site = sites.sort(lexicographic).pop(),
      x,
      y,
      circle;

  edges = [];
  cells = new Array(sites.length);
  beaches = new RedBlackTree;
  circles = new RedBlackTree;

  while (true) {
    circle = firstCircle;
    if (site && (!circle || site[1] < circle.y || (site[1] === circle.y && site[0] < circle.x))) {
      if (site[0] !== x || site[1] !== y) {
        addBeach(site);
        x = site[0], y = site[1];
      }
      site = sites.pop();
    } else if (circle) {
      removeBeach(circle.arc);
    } else {
      break;
    }
  }

  sortCellHalfedges();

  if (extent) {
    var x0 = +extent[0][0],
        y0 = +extent[0][1],
        x1 = +extent[1][0],
        y1 = +extent[1][1];
    clipEdges(x0, y0, x1, y1);
    clipCells(x0, y0, x1, y1);
  }

  this.edges = edges;
  this.cells = cells;

  beaches =
  circles =
  edges =
  cells = null;
}

Diagram.prototype = {
  constructor: Diagram,

  polygons: function() {
    var edges = this.edges;

    return this.cells.map(function(cell) {
      var polygon = cell.halfedges.map(function(i) { return cellHalfedgeStart(cell, edges[i]); });
      polygon.data = cell.site.data;
      return polygon;
    });
  },

  triangles: function() {
    var triangles = [],
        edges = this.edges;

    this.cells.forEach(function(cell, i) {
      if (!(m = (halfedges = cell.halfedges).length)) return;
      var site = cell.site,
          halfedges,
          j = -1,
          m,
          s0,
          e1 = edges[halfedges[m - 1]],
          s1 = e1.left === site ? e1.right : e1.left;

      while (++j < m) {
        s0 = s1;
        e1 = edges[halfedges[j]];
        s1 = e1.left === site ? e1.right : e1.left;
        if (s0 && s1 && i < s0.index && i < s1.index && triangleArea(site, s0, s1) < 0) {
          triangles.push([site.data, s0.data, s1.data]);
        }
      }
    });

    return triangles;
  },

  links: function() {
    return this.edges.filter(function(edge) {
      return edge.right;
    }).map(function(edge) {
      return {
        source: edge.left.data,
        target: edge.right.data
      };
    });
  },

  find: function(x, y, radius) {
    var that = this, i0, i1 = that._found || 0, n = that.cells.length, cell;

    // Use the previously-found cell, or start with an arbitrary one.
    while (!(cell = that.cells[i1])) if (++i1 >= n) return null;
    var dx = x - cell.site[0], dy = y - cell.site[1], d2 = dx * dx + dy * dy;

    // Traverse the half-edges to find a closer cell, if any.
    do {
      cell = that.cells[i0 = i1], i1 = null;
      cell.halfedges.forEach(function(e) {
        var edge = that.edges[e], v = edge.left;
        if ((v === cell.site || !v) && !(v = edge.right)) return;
        var vx = x - v[0], vy = y - v[1], v2 = vx * vx + vy * vy;
        if (v2 < d2) d2 = v2, i1 = v.index;
      });
    } while (i1 !== null);

    that._found = i0;

    return radius == null || d2 <= radius * radius ? cell.site : null;
  }
};

function Transform(k, x, y) {
  this.k = k;
  this.x = x;
  this.y = y;
}

Transform.prototype = {
  constructor: Transform,
  scale: function(k) {
    return k === 1 ? this : new Transform(this.k * k, this.x, this.y);
  },
  translate: function(x, y) {
    return x === 0 & y === 0 ? this : new Transform(this.k, this.x + this.k * x, this.y + this.k * y);
  },
  apply: function(point) {
    return [point[0] * this.k + this.x, point[1] * this.k + this.y];
  },
  applyX: function(x) {
    return x * this.k + this.x;
  },
  applyY: function(y) {
    return y * this.k + this.y;
  },
  invert: function(location) {
    return [(location[0] - this.x) / this.k, (location[1] - this.y) / this.k];
  },
  invertX: function(x) {
    return (x - this.x) / this.k;
  },
  invertY: function(y) {
    return (y - this.y) / this.k;
  },
  rescaleX: function(x) {
    return x.copy().domain(x.range().map(this.invertX, this).map(x.invert, x));
  },
  rescaleY: function(y) {
    return y.copy().domain(y.range().map(this.invertY, this).map(y.invert, y));
  },
  toString: function() {
    return "translate(" + this.x + "," + this.y + ") scale(" + this.k + ")";
  }
};

new Transform(1, 0, 0);

Transform.prototype;

function attrsFunction$1(selection, map) {
  return selection.each(function() {
    var x = map.apply(this, arguments), s = select(this);
    for (var name in x) s.attr(name, x[name]);
  });
}

function attrsObject$1(selection, map) {
  for (var name in map) selection.attr(name, map[name]);
  return selection;
}

function selection_attrs(map) {
  return (typeof map === "function" ? attrsFunction$1 : attrsObject$1)(this, map);
}

function stylesFunction$1(selection, map, priority) {
  return selection.each(function() {
    var x = map.apply(this, arguments), s = select(this);
    for (var name in x) s.style(name, x[name], priority);
  });
}

function stylesObject$1(selection, map, priority) {
  for (var name in map) selection.style(name, map[name], priority);
  return selection;
}

function selection_styles(map, priority) {
  return (typeof map === "function" ? stylesFunction$1 : stylesObject$1)(this, map, priority == null ? "" : priority);
}

function propertiesFunction(selection, map) {
  return selection.each(function() {
    var x = map.apply(this, arguments), s = select(this);
    for (var name in x) s.property(name, x[name]);
  });
}

function propertiesObject(selection, map) {
  for (var name in map) selection.property(name, map[name]);
  return selection;
}

function selection_properties(map) {
  return (typeof map === "function" ? propertiesFunction : propertiesObject)(this, map);
}

function attrsFunction(transition, map) {
  return transition.each(function() {
    var x = map.apply(this, arguments), t = select(this).transition(transition);
    for (var name in x) t.attr(name, x[name]);
  });
}

function attrsObject(transition, map) {
  for (var name in map) transition.attr(name, map[name]);
  return transition;
}

function transition_attrs(map) {
  return (typeof map === "function" ? attrsFunction : attrsObject)(this, map);
}

function stylesFunction(transition, map, priority) {
  return transition.each(function() {
    var x = map.apply(this, arguments), t = select(this).transition(transition);
    for (var name in x) t.style(name, x[name], priority);
  });
}

function stylesObject(transition, map, priority) {
  for (var name in map) transition.style(name, map[name], priority);
  return transition;
}

function transition_styles(map, priority) {
  return (typeof map === "function" ? stylesFunction : stylesObject)(this, map, priority == null ? "" : priority);
}

selection.prototype.attrs = selection_attrs;
selection.prototype.styles = selection_styles;
selection.prototype.properties = selection_properties;
transition.prototype.attrs = transition_attrs;
transition.prototype.styles = transition_styles;

var loadingIcon = "loading8b4fd23788e66472.svg";

var closeIcon = "closeae9a994387c3232e.svg";

const template = document.createElement("template");

template.innerHTML = `
<div class='d3-context-menu'></div>
<div class='loading' id='div-loading'></div>
<div class='tooltip' id='cluster-tooltip'></div>
<div class='tooltip' id='item-tooltip'></div>
<div class='tooltip' id='node-tooltip'></div>
<div class='tooltip' id='profile-tooltip'></div>


<div class="vis">

    <div class="toolbar">
        <!-- Tab Buttons -->
        <div class="tab-buttons">
            <button data-tab="legend" class="active">Legend</button>
            <button data-tab="filters">Filters</button>
            <button data-tab="search">Search</button>
            <button data-tab="view">View</button>
            <button data-tab="info">Info</button>
        </div>

        <!-- Tab Content Area -->
        <div class="tab-content-area">

            <!-- Legend Tab -->
            <div id="legend" class="tab-content active">
                <div class='legend'></div>
            </div>

            <!-- Filters Tab -->
            <div id="filters" class="tab-content">
                <div class='timePeriod'>
                    <label>Time</label>
                    <label class='time-info' id='from-label'>0</label>

                    <div class="slider-wrapper">
                        <div class="multi-range">
                            <input type="range" min="0" max="50" value="5" id="lower">
                            <input type="range" min="0" max="50" value="45" id="upper">
                        </div>

                        <span id="lower-value" class="slider-value">5</span>
                        <span id="upper-value" class="slider-value">45</span>
                    </div>

                    <label class='time-info' id='to-label'>50</label>
                </div>
            </div>

            <!-- Search Tab -->
            <div id="search" class="tab-content">
                <div class="search-row">
                    <label>Search for</label>
                    <datalist id='items-list'></datalist>
                    <input class='search' type='text' id='ul-search' placeholder='Type here...' list='items-list'>
                    <button id='items-input-clear' type='button'>Clear</button>
                </div>
                <ul class='values' id='ul-multi'></ul>
            </div>

            <!-- View Tab -->
            <div id="view" class="tab-content">
                <div class="view-options">
                    <div>
                        <input type="checkbox" id="display-items" style="transform: scale(0.8); margin-left: 10px;">
                        <label id="display-items">Display Items</label>
                    </div>
                </div>
            </div>

            <!-- Info Tab -->
            <div id="info" class="tab-content"></div>
        </div>
    </div>

    <div id="loading">  
        <img width="70px" height="70px" src="../assets/${loadingIcon}"></img>
        <p>Loading data...</p>
    </div>

    <div class='import-form'>
        <div id='topbar'>
            <label id='title'></label>
            <image src="../assets/${closeIcon}"></image>
        </div>
        <div>
            <label>Sort by</label>
            <select class='sort'></select>
        </div>
        <div>
            <label>Search for</label>
            <input class='search' type='text' id='ul-search' placeholder='Enter value here'></input>
        </div>
        <ul class='values' id='ul-multi'></ul>

        <button type='button'>Submit</button>
    </div>

   

    <div class='timeline'>

        <div class='nodes-panel'>
            <svg>
                <g id='labels-group'></g>
            </svg>
        </div>

        <svg id="chart">
            <g id ='chart-group'>
                <g id='top-axis' class='timeaxis' >
                    <line></line>
                </g>
                <g id='bottom-axis' class='timeaxis' >
                    <line></line>
                </g>
                
                <g id="membership-links-group"></g>
                <g id='link-group'></g>
                

                <g id='nodes-group'></g>
                <g id='ticks-group'></g>

                <g id='x-slider'>
                    <rect class='marker move'></rect>
                    <rect id='top-button' class='slider-button move'></rect>
                    <text></text>
                    <rect id='bottom-button' class='slider-button move'></rect>
                </g>
                <g id='y-slider'>
                    <image id="slider-up"  ></image>
                    <image id="slider-down" ></image>
                </g>

                <g id='nodeLinks-group'> </g>

            </g>
        </svg>
    </div>

    
</div>`;

var timelineCSS = "* {\n    font-family: Arial, Helvetica, sans-serif;\n    margin: 0 !important;\n}\n\nbody{\n    margin: 0;\n    overflow: hidden;\n}\n\n.loading {\n    opacity: .8;\n    background-color: whitesmoke;\n    position: fixed;\n    top: 7%;\n    height: 93%;\n    width: 100vw;\n    display: none;\n    z-index: 2;\n    vertical-align: middle;\n    text-align: center;\n}\n\n.context-menu{\n    cursor: pointer;\n    position: absolute;\n    background-color: whitesmoke;\n    border-radius: 5px;\n    z-index: 1000;\n    display: none;\n    border: none;\n    padding: 5px;\n    box-shadow: 10px 5px 5px #dbdbdb;\n}\n\n.timeline {\n    display: flex;\n    width: 100%;\n    position: relative;\n}\n\n\n\n.slider-button {\n    fill: #dbdbdb;\n    stroke: #ccc;\n    cursor: move;\n}\n\n.vis{\n    display:flex; \n    flex-direction: column;\n    overflow-y: hidden;\n    overflow-x: auto;\n    position: relative;\n    top: 50px;\n    width: fit-content;\n    height: fit-content;\n}\n\n.tooltip{\n    min-width: 250px;\n    height: auto;\n    position: absolute;\n    z-index: 10;\n    background-color: #f5f5f5;\n    padding: 5px;\n    font-size: 14px;\n    border-radius: 5px;\n    border: 1px solid #ccc;\n    display: none;\n}\n\n.tooltip:hover{\n    display: block;\n}\n\n.tooltip p {\n    padding: 2px;\n}\n\n#loading{\n    width: 100%;\n    height: 100%;\n    z-index: 1;\n    background-color: white;\n    opacity: 80%;\n    display: none;\n    position: absolute;\n    top: 0;\n}\n\n#loading img{\n    position: relative;\n    left: calc(50% - 35px);\n    top: 50%;\n    text-align: center;\n}\n\n#loading p{\n    position: relative;\n    top: 55%;\n    text-align: center;\n}\n\n.nodes-panel{\n    position: fixed;\n    background-color: white;\n    left: 0;\n}";

var navBarCSS = "@keyframes buttonTransition {\n    from {\n        stroke-width: 1px;\n        stroke: yellow;\n    }\n    to {\n        stroke-width: 3px;\n        stroke: yellow;\n    }\n}\n\n.high-item {\n    animation-duration: 2s;\n    animation-iteration-count: 5;\n    animation-name: buttonTransition;\n    transform-origin: center center;\n    animation-fill-mode: forwards;\n    z-index: 100;\n}\n\n/* Collaborators list */\n.import-form{\n    left: 25%;\n    top: 15%;\n    width: 50%;\n    max-height: 70%;\n    position: absolute;\n    z-index: 1000;\n    display: none;\n    background-color: #f5f5f5;\n    gap: 10px;\n    flex-direction: column;\n    box-shadow: 5px 5px 5px #ccc;\n}\n\n.import-form button {\n    height: 35px;\n    position: relative;\n    border: none;\n    background-color: #007bff;\n    width: fit-content;\n    left: 90%;\n    padding: 10px;\n    bottom: 10px;\n    border-radius: 5px;\n    font-size: 16px;\n    color: white;\n    cursor: pointer;\n}\n\n#topbar{\n    top: 0px;\n    left: 0px;\n    height: 40px;\n    width: calc(100% - 10px);\n    background-color: rgb(44, 62, 80);\n    display: flex;\n    justify-content: space-between;\n    color: white;\n    vertical-align: middle;\n    padding: 5px;\n}\n\n#topbar label{\n    text-anchor: middle;\n    width: 85%;\n    padding: 10px;\n}\n\n#topbar img{\n    width: 20px;\n    height: 20px;\n    position: relative;\n    top: 25%;\n    cursor:pointer; \n    filter:brightness(0) invert(1);\n}\n\n.import-form select,\n.import-form input {\n    padding: 2px;\n    width: 400px;\n}\n\n.import-form div{\n    padding: 5px;\n}\n\n.import-form ul{\n    width: auto; /* changed from 100% to acomodate multiple columns */\n\tcolumns: 3; /* multiple columns to reduce sub-menu height */\n    overflow: scroll;\n    list-style-type: none;\n}\n\n.import-form ul li:hover{\n    background-color: #ccc;\n}\n\n/* tab system */\n\n/* Container toolbar box */\n.toolbar {\n    height: 10%;\n    width: 100%;\n    background-color: #f8f9fa;\n    border-bottom: 1px solid #ccc;\n    box-shadow: 0 2px 5px rgba(0,0,0,0.1);\n    display: flex;\n    flex-direction: column;\n    font-family: sans-serif;\n}\n\n/* Tab header buttons */\n.tab-buttons {\n    display: flex;\n    flex: 1;\n}\n\n.tab-buttons button {\n    flex: 1;\n    border: none;\n    background: #e9ecef;\n    padding: 8px;\n    font-weight: bold;\n    cursor: pointer;\n    border-right: 1px solid #ccc;\n    transition: background 0.2s;\n}\n\n.tab-buttons button:last-child {\n    border-right: none;\n}\n\n.tab-buttons button:hover {\n    background: #dee2e6;\n}\n\n.tab-buttons button.active {\n    background: #ffffff;\n    border-bottom: 2px solid #007acc;\n}\n\n/* Tab content area (small, inside toolbar) */\n.tab-content-area {\n    flex: 2;\n    overflow-x: auto;\n    overflow-y: hidden;\n    display: flex;\n    padding: 5px 10px;\n}\n\n.tab-content {\n    display: none;\n    width: 100%;\n    font-size: 0.85em;\n    height: 70px;\n    overflow-y: scroll;\n}\n\n.tab-content.active {\n    display: block;\n}\n\n.tab-content label {\n    margin-right: 5px;\n}\n\n.tab-content input[type=\"text\"],\n.tab-content select {\n    max-width: 150px;\n    margin-right: 10px;\n}\n\n.tab-content .legend,\n.tab-content .timePeriod {\n    display: flex;\n    align-items: center;\n    gap: 10px;\n}\n\n.tab-content table {\n    border-collapse: collapse;\n    margin: 10px 0;\n  }\n\n.tab-content th, td {\n    padding: 4px 8px;\n    border: 1px solid #ccc;\n    text-align: left;\n  }\n\n/* Legend */\n\n.legend {\n    flex-direction: row;\n    width: 100%;\n    height: 100%;\n}\n\n/* Time filter */\n\n.timePeriod {\n    display: flex;\n    align-items: center;         /* vertically align items */\n    gap: 10px;                   /* space between elements */\n    padding: 5px;\n    font-family: sans-serif;\n}\n\n.timePeriod label {\n    white-space: nowrap;\n    font-size: 0.9em;\n}\n\n.timePeriod .multi-range {\n    display: flex;\n    flex-direction: row;\n    gap: 4px;\n    position: relative;\n}\n\n.timePeriod input[type=\"range\"] {\n    width: 350px;\n}\n\n.timePeriod .slider-wrapper {\n    position: relative;\n    width: 100%; /* or a fixed width if needed */\n}\n  \n.timePeriod .slider-value {\n    position: absolute;\n    top: 40px;\n    font-size: 12px;\n    background: rgba(0, 0, 0, 0.1);\n    padding: 2px 6px;\n    border-radius: 4px;\n    pointer-events: none;\n    white-space: nowrap;\n    transform: translateX(-50%); /* properly centers the label */\n}\n  \n\n/* Search fields */\n\n.search-row {\n    display: flex;\n    align-items: center;\n    gap: 0.5rem; /* spacing between items */\n  }\n  \n  .search-row label {\n    white-space: nowrap;\n  }\n  \n  .search-row input.search {\n    flex: 1;\n    min-width: 150px;\n  }\n  \n  .search-row button {\n    white-space: nowrap;\n  }\n  \n  #search ul.values {\n    margin-top: 1rem;\n    padding-left: 0;\n  }\n  \n/* View options */\n\n.view-options {\n    display: flex;\n    align-items: center;\n    gap: 10px; /* spacing between checkbox, label, and button */\n  }\n  ";

var timesliderCSS = "\n.timePeriod{\n    width: 550px;\n}\n\n.timePeriod label{\n   width: 70px;\n   text-anchor: middle;\n}\n\ninput[type=range] {\n    box-sizing: border-box;\n    appearance: none;\n    width: 300px;\n    margin: 0;\n    padding: 0 2px;\n    /* Add some L/R padding to ensure box shadow of handle is shown */\n    overflow: hidden;\n    border: 0;\n    border-radius: 1px;\n    outline: none;\n    background: linear-gradient(grey, grey) no-repeat center;\n    /* Use a linear gradient to generate only the 2px height background */\n    background-size: 100% 2px;\n    pointer-events: none;\n \n    &:active,\n    &:focus {\n       outline: none;\n    }\n \n    &::-webkit-slider-thumb {\n       height: 28px;\n       width: 28px;\n       border-radius: 28px;\n       background-color: #fff;\n       position: relative;\n       margin: 5px 0;\n       /* Add some margin to ensure box shadow is shown */\n       cursor: pointer;\n       appearance: none;\n       pointer-events: all;\n       box-shadow: 0 1px 4px 0.5px rgba(0, 0, 0, 0.25);\n       &::before {\n             content: ' ';\n             display: block;\n             position: absolute;\n             top: 13px;\n             left: 100%;\n             width: 2000px;\n             height: 2px;\n       }\n    }\n }\n \n .multi-range {\n    position: relative;\n    height: 50px;\n }\n\n .multi-range input[type=range] {\n    position: absolute;\n    \n    &:nth-child(1) {\n       &::-webkit-slider-thumb::before {\n          background-color: red;\n       }\n    }\n\n    &:nth-child(2) {\n       background: none;\n\n       &::-webkit-slider-thumb::before {\n           background-color: grey; \n       }\n    }\n }";

var contextMenuCSS = "/* Layout\n------------ */\n\n.d3-context-menu {\n\tposition: absolute;\n\tmin-width: 150px;\n\tz-index: 1200;\n}\n\n.d3-context-menu ul,\n.d3-context-menu ul li {\n\tmargin: 0;\n\tpadding: 0;\n}\n\n.d3-context-menu ul {\n\tlist-style-type: none;\n\tcursor: default;\n}\n\n.d3-context-menu ul li {\n\t-webkit-touch-callout: none; /* iOS Safari */\n\t-webkit-user-select: none;   /* Chrome/Safari/Opera */\n\t-khtml-user-select: none;    /* Konqueror */\n\t-moz-user-select: none;      /* Firefox */\n\t-ms-user-select: none;       /* Internet Explorer/Edge */\n\tuser-select: none;\n}\n\n/*\n\tDisabled\n*/\n\n.d3-context-menu ul li.is-disabled,\n.d3-context-menu ul li.is-disabled:hover {\n\tcursor: not-allowed;\n}\n\n/*\n\tDivider\n*/\n\n.d3-context-menu ul li.is-divider {\n\tpadding: 0;\n}\n\n/* Theming\n------------ */\n\n.d3-context-menu-theme {\n\tbackground-color: #f2f2f2;\n\tborder-radius: 4px;\n\n\tfont-family: Arial, sans-serif;\n\tfont-size: 14px;\n\tborder: 1px solid #d4d4d4;\n}\n\n.d3-context-menu-theme ul {\n\tmargin: 4px 0;\n}\n\n.d3-context-menu-theme ul li {\n\tpadding: 4px 16px;\n}\n\n.d3-context-menu-theme ul li:hover {\n\tbackground-color: #4677f8;\n\tcolor: #fefefe;\n}\n\n/*\n\tHeader\n*/\n\n.d3-context-menu-theme ul li.is-header,\n.d3-context-menu-theme ul li.is-header:hover {\n\tbackground-color: #f2f2f2;\n\tcolor: #444;\n\tfont-weight: bold;\n\tfont-style: italic;\n}\n\n/*\n\tDisabled\n*/\n\n.d3-context-menu-theme ul li.is-disabled,\n.d3-context-menu-theme ul li.is-disabled:hover {\n\tbackground-color: #f2f2f2;\n\tcolor: #888;\n}\n\n/*\n\tDivider\n*/\n\n.d3-context-menu-theme ul li.is-divider:hover {\n\tbackground-color: #f2f2f2;\n}\n\n.d3-context-menu-theme ul hr {\n\tborder: 0;\n\theight: 0;\n\tborder-top: 1px solid rgba(0, 0, 0, 0.1);\n\tborder-bottom: 1px solid rgba(255, 255, 255, 0.3);\n}\n\n/*\n\tNested Menu\n*/\n.d3-context-menu-theme ul li.is-parent:after {\n\tborder-left: 7px solid transparent;\n\tborder-top: 7px solid red;\n\tcontent: \"\";\n\theight: 0;\n\tposition: absolute;\n\tright: 8px;\n\ttop: 35%;\n\ttransform: rotate(45deg);\n\twidth: 0;\n}\n\n.d3-context-menu-theme ul li.is-parent {\n\tpadding-right: 20px;\n\tposition: relative;\n}\n\n.d3-context-menu-theme ul.is-children {\n\tbackground-color: #f2f2f2;\n\tborder: 1px solid #d4d4d4;\n\tcolor: black;\n\tdisplay: none;\n\tleft: 100%;\n\tmargin: -5px 0;\n\tpadding: 4px 0;\n\tposition: absolute;\n\ttop: 0;\n\t/* width: 100%; */\n\toverflow: scroll;\n\tmax-height: 500px;\n}\n\nul.is-children li{\n\twidth: 250px;\n}\n\n.d3-context-menu-theme ul.multi-column {\n\twidth: auto !important; /* changed from 100% to acomodate multiple columns */\n\tcolumns: 4; /* multiple columns to reduce sub-menu height */\n\tcolumn-width: auto;\n}\n\n.d3-context-menu-theme input {\n\tmargin-top: 10px;\n\tmargin-bottom: 20px;\n}\n\n.d3-context-menu-theme select, \n.d3-context-menu-theme input, \n.d3-context-menu-theme label {\n\tpadding-top: 5px;\n\tpadding-bottom: 5px;\n    margin-left: 10px;\n    border: none;\n    position: relative;\n\twidth: 100%;\n}\n\n\n.d3-context-menu-theme li.is-parent:hover > ul.is-children {\n\tdisplay: block;\n}\n";

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function getTicksDistance(scale, breaks) {
    let scaleRange = scale.range();
    const spaces = [];

    for(let i = 0; i < breaks.length; i++){
        let curr = scale(breaks[i]), 
            next = i === breaks.length - 1 ? scaleRange[1] : scale(breaks[i + 1]), 
            prev = i === 0 ? scaleRange[0] : scale(breaks[i - 1]),
            prevStep = curr - prev,
            nextStep = next - curr;
        
        if (i > 0) prevStep *= .5;
        if (i < breaks.length - 1) nextStep *= .5;

        let p1 = curr + nextStep;
        let p2 = curr - prevStep;
        spaces.push(p1 - p2);
    }

    return spaces;
}

function getImage$1(image_title, token) {
  let path = "https://crobora.huma-num.fr/crobora-api/login/images/";
  image_title = encodeURIComponent(image_title);
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

const prepareQuery = (query) => {
    const encoded = new URLSearchParams({ query }).toString();
    return encoded.replace(/%20/g, '+'); // optional if you need '+' instead of '%20'
};

async function sendRequest(url) {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/sparql-results+json' },
        });
       
        if (!response.ok) {
            return { message: `Request failed with status: ${response.statusText} (${response.status}). Please try again later.` };
        }
        
        try {
            return await response.json();
        } catch (error) {
            return { message: "Error processing response. Please try again later." };
        }

    } catch (error) {

        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return { message: 'Network error: Failed to fetch the resource. Check your network connection.' };
        }
        return { message: `An unexpected error occurred: ${error.message}` };
    }
}

async function executeQuery(query, endpoint, proxy, withOffset = false) {
    let offset = 0;
    const data = [];

    let url = `${endpoint}?`; // default, if no proxy provided (might result in CORS issues)
    if (proxy)
        url = `${proxy}?endpoint=${endpoint}&`; // proxy url sends the query from server side

    while (true) {
        const pagedQuery = query.replace('$offset', offset);
        const result = await sendRequest(url + prepareQuery(pagedQuery));
       
        if (result.message) {
            return data.length ? data : result;
        }

        const bindings = result?.results?.bindings || [];
        data.push(...bindings);
        
        
        if (!withOffset || bindings.length === 0 || bindings.length < 10000) break;
        
        offset += 10000;
    }

    return data;
}

// import * as crypto from 'crypto';

async function treatRequest(query, endpoint, proxy, value) {
    const expectedKeys = ['uri', 'title', 'date', 'ego', 'alter'];

    function endsWithLimitPattern(str) {
        const regex = /\blimit \d+\b/i;
        return regex.test(str);
    }
    
    let variable = query.split(/[^A-Za-z0-9$]+/).find(v => v.startsWith('$'));
    let regex = new RegExp("\\" + variable, "g");
    let tunedQuery = query.replace(regex, value.trim());

    let withOffset = !endsWithLimitPattern(tunedQuery);
    if (withOffset) tunedQuery += 'limit 10000 offset $offset';

    let result = await executeQuery(tunedQuery, endpoint, proxy, withOffset);
    
    if (result.message) return result;

    if (!result.length)
        return { message: `Value: ${value}\n The query did not return any results.` };

    let keys = Object.keys(result[0]);
    let containAllKeys = expectedKeys.every(d => keys.includes(d));
    if (!containAllKeys) {
        let missingKeys = expectedKeys.filter(d => !keys.includes(d));
        return { message: `Value: ${value}\nThe query is missing the following required variables = ${missingKeys.join(', ')}` };
    }

    return result
}

async function transform(args, data) {
    let items = {};
    let name = (args.name || args.value).trim();

    let egoValues = data.filter(d => d.ego.value === name);

    let nestedValues = nest().key(d => d.uri.value).entries(egoValues);
    
    let node = { name: name, type: args.type, key: await hash(name, args.type?.trim())};

    for (let item of nestedValues) {
        let ref = item.values[0];
        let values = item.values.filter(d => d.link.value !== "UNDEF");

        let year = ref.date.value.split('-')[0];
        if (year === "0000") continue;

        let ego = {...node};

        let alters = values.map(e => ({ name: e.alter?.value || null, type: e.alterNature?.value || null }));
        if (!alters.some(d => d.name === ego.name))
            alters.push(ego);
        
        alters = alters.filter((e, i) => e && alters.findIndex(x => x.name === e.name && x.type === e.type) === i);
        alters = await Promise.all(
            alters.map(async (e) => ({
              ...e,
              key: await hash(e.name, e.type),
            }))
        );

        let types = values.map(e => e.type?.value || null).filter((d, i, arr) => d && arr.indexOf(d) === i);
        ego.contribution = [...types];

        const key = await hash(item.key);
        const link = ref.link?.value;

        items[key] = {
            id: item.key,
            node: ego,
            title: ref.title.value,
            date: ref.date.value,
            year: year,
            type: types,
            contributors: alters,
            contnames: alters.map(d => d.name),
            parent: ref.parentId ? { name: ref.parentName.value, id: ref.parentId.value } : null,
            link: link === "UNDEF" ? null : link
        };
    }

    return {
        node: node,
        items: Object.values(items)
    }
}

async function fetchAndTransform(args) {

    let response = await treatRequest(args.query, args.endpoint, args.proxy, args.value);
    
    if (response.message) return response
  
    const data = await transform({
        name: args.value.trim(),
        type: args.type
    }, response);

    return data
}

async function hash(...args) {
    const string = args.join('--');
    const data = new TextEncoder().encode(string);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);

    const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
    const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""); // convert bytes to hex string
    return hashHex;
}

class DataModel {
    constructor(chart) {
        this.chart = chart;

        this.clusters = [];
        this.items = [];
        this.nodes = {};
        this.links = [];
        this.linkTypes = [];

        this.filters = {
            linkTypes: [],
            timeFrom: null,
            timeTo: null,
            focus: null
        };

        this.colors = { 
            item: '#ccc',
            typeScale: ordinal(Set2)
        };
    }

    async clear() {
        this.clusters = [];
        this.items = [];
        this.nodes = {};
        this.links = [];
        this.linkTypes = [];
    }

    isEmpty() {
        return this.items.length === 0
    }

    async remove(node, focus) {
        
        delete this.nodes[node];
        this.items = this.items.filter(d => d.node.key !== node);

        await this.load(await this.getNodesList());
       
    }

    async reload() {
        let nodes = await this.getNodesList();
       
        await this.clear();
        await this.load(nodes);
    }

    async load(values, body) {    

        this.chart.showLoading();

        let errormessages = [];
        
        for (let node of values) {   
            body.value = node.value || node.name;
            body.type = node.type;
            
            let response = await fetchAndTransform(body);
           
            if (response && response.message) {
                errormessages.push(response.message);
            } else 
                await this.update(response);
        }

        if (errormessages.length)
            alert(errormessages.join('\n'));
       
    }

    // updates

    async update(data) {

        this.nodes[data.node.key] = data.node; 

        await this.updateItems(data.items);

        await this.updateLinks();

        await this.updateCollaborations(data.node.key);

        await this.updateTime();

        await this.updateLinkTypes();

        return
    }

    async updateItems(items) {
        
        if (items) { // if new items
            items.forEach(d => { d.year = +d.year; });
            this.items = this.items.concat(items);
        }

        // sort items according to the order of nodes, to calculate links
        let nodes = Object.keys(this.nodes);
        this.items.sort( (a,b) => nodes.indexOf(a.node.key) - nodes.indexOf(b.node.key) );

        return
    }

    async updateFilters(type, values) {
        this.filters[type] = values;
    }

    getFiltersByType(type){
        return this.filters[type];
    }

    getFocus() {
        return this.filters.focus
    }

    async updateLinkTypes() {
        this.linkTypes = this.items.map(d => d.type).filter(d => d).flat();
        this.linkTypes = this.linkTypes.filter( (d,i) => this.linkTypes.indexOf(d) === i);

        this.colors.typeScale.domain(this.linkTypes);
    }

    async updateTime() {

        let items = await this.getItems();
        this.dates = items.map(d => d.year);
        this.dates = this.dates.filter((d,i) => this.dates.indexOf(d) === i); // keep only unique dates

        if (this.filters.timeFrom && this.filters.timeTo)
            this.dates = this.dates.filter(d => d >= this.filters.timeFrom && d <= this.filters.timeTo);

        this.dates.sort();

        this.filters.timeFrom = this.dates[0];
        this.filters.timeTo = this.dates[this.dates.length - 1];
    }

    async updateCollaborations(key) {
        
        let items = this.items.filter(d => d.node.key === key);
        let collaborators = items.map(d => d.contributors).flat();

        collaborators = collaborators.filter( (d,i) => collaborators.findIndex(e => e.key === d.key) === i && d.key !== key);
        collaborators = collaborators.map(d => { 
            let values = items.filter(e => e.contnames.includes(d.name));
            return { ...d, values: values } 
        });

        this.nodes[key].collaborators = collaborators;
            
        await this.sortCollaborators('decreasing', key); // alpha, decreasing (number of shared items)
    }

    async sortCollaborators(value, key) {
        this.nodes[key].sorting = value;

        switch(value) {
            case 'decreasing':
                this.nodes[key].collaborators.sort( (a, b) => { 
                    if (a.enabled && b.enabled) return b.values.length - a.values.length 
                    if (a.enabled) return -1
                    if (b.enabled) return 1 
                    return b.values.length - a.values.length
                });
                break;
            default:
                this.nodes[key].collaborators.sort( (a, b) => { 
                    if (a.enabled && b.enabled) return a.value.localeCompare(b.value)
                    if (a.enabled) return -1
                    if (b.enabled) return 1 
                    return a.name.localeCompare(b.name)
                }); 
        }

    }

    async updateLinks() {
        this.links = [];

        let nestedValues = nest()
            .key(d => d.id)
            .entries(this.items);

        let jointItems = nestedValues.filter(d => d.values.length > 1);

        if (!jointItems.length) return

        for (let item of jointItems) {
           
            for (let v1 of item.values) {
                for (let v2 of item.values) {
                    if (v1.node.key === v2.node.key) continue

                    for (let type of v1.type) {
                        this.links.push({
                            source: v1.node,
                            target: v2.node,
                            type: type,
                            item: item.key,
                            year: v1.year
                        });    
                    }
                }
            }
        }

        return
    }

    // checkers

    isNodeValid(node) {
        return Object.keys(this.nodes).includes(node.key)
    }

    // getters 

    async getItems() {

        let uniqueKeys = this.items.map(d => d.contributors.map(e => e.key)).flat();
        uniqueKeys = uniqueKeys.filter((d,i) => uniqueKeys.indexOf(d) === i);

        let items = this.items.filter(d => !d.node.contribution.every(e => this.filters.linkTypes.includes(e)) ); // filter out selected link types
        
        if (this.filters.timeFrom && this.filters.timeTo) {
            items = items.filter(d => d.year >= this.filters.timeFrom && d.year <= this.filters.timeTo);
        }
       
        if (this.filters.focus) {
            let nodes = this.getNodesKeys();

            items = items.filter(d => d.contributors.length > 1 // only collaborative items
                && d.contributors.some(e => e.key === this.filters.focus) // include the author on focus
                && d.contributors.some(e => nodes.includes(e.key) && e.key != this.filters.focus) // every author is visible
                ); 
        }

        return items
    }

    getItemById(key) {
        return this.items.find(d => d.id === key)
    } 

    getLinks() {
       
        let links = this.links.filter(d => !this.filters.linkTypes.includes(d.type) );
      
        if (this.filters.timeFrom && this.filters.timeTo) 
            links = links.filter(d => d.year >= this.filters.timeFrom && d.year <= this.filters.timeTo);
       
        if (this.filters.focus) {
            links = links.filter(d => this.getItemById(d.item).contributors.some(e => e.key === this.filters.focus) );
        }    

        return links
    }

    getStats() {
        return {
            nodes: Object.keys(this.nodes).length,
            items: this.items.length,
            links: this.links.length
        }
    }

    getLinkTypes() {
        return this.linkTypes
    }


    /// Getters for nodes
    getNodesKeys() {
        return Object.keys(this.nodes);
    }

    async getNodesList() {
        return Object.values(this.nodes)
    }

    getNodes() {
        return this.nodes;
    }

    getNodeById(d) {
        return this.nodes[d]
    }

    async switchNodes(indexA, indexB) {
        let keys =  Object.keys(this.nodes);
        let temp = keys[indexA];
        keys[indexA] = keys[indexB];
        keys[indexB] = temp;

        let keysOrder = {};
        keys.forEach(key => { keysOrder[key] = null; });

        this.nodes = Object.assign(keysOrder, this.nodes);

        await this.updateItems();
        await this.updateLinks();
    }

    getDates() {
        let dates = this.dates.filter(d => d >= this.filters.timeFrom && d <= this.filters.timeTo);
        dates.sort();
        return dates;
    }

    getAllDates() {
       
        let values = this.items.map(d => +d.year);
        values = values.filter( (d,i) => values.indexOf(d) === i);
        values.sort();
        return values;
    }

    

    
}

class TimeScale {
    constructor() {
        this.map = {};
        this.range = [];
    }

    setDomain(values) {
        this.domain = values;
    }

    getDomain() {
        return this.domain
    }

    setStep(step) {
        this.defaultStep = step;
    }

    setStartingPos(min) {
        this.range[0] = min;
    }

    getFocus() {
        return this.domain ? this.domain.filter(d => this.map[d].distortion) : null
    }

    getRange() {
        return this.range
    }

    async setMapping() {
        this.map = {};
        this.domain.forEach( (d,i) => {
            this.map[d] = {};
            this.map[d].value = d;
            this.map[d].pos = this.range[0] + this.defaultStep * i;
            this.map[d].step = this.defaultStep;
            this.range[1] = this.map[d].pos + this.defaultStep;
        });
    }

    getValue(pos) {
        let values = Object.values(this.map);

        let res;
        if (pos < this.min)
            res = values[0];
        else if (pos > this.range[1])
            res = values[values.length - 1];
        else {
            res = values.find(d => pos >= d.pos && pos < d.pos + d.step);
        }

        return res ? res.value : null
    }

    getStep(value) {
        return this.map[value] ? this.map[value].step : this.defaultStep
    }

    getPos(value) {
        return this.map[value] ? this.map[value].pos : null
    } 

    setFocusLength(length) {
        this.focusLength = length;
    }

    async setDistortion(d) {
        let index = this.domain.indexOf(d);
        
        if (this.map[d].distortion) {
            this.map[d].distortion = false;
            this.map[d].step = this.defaultStep;
            for (let i = index + 1; i < this.domain.length; i++) {
                this.map[this.domain[i]].pos -= this.focusLength;
            }
            this.range[1] -= this.focusLength;

        } else {
            this.map[d].distortion = true;
            this.map[d].step += this.focusLength;
            for (let i = index + 1; i < this.domain.length; i++) {
                this.map[this.domain[i]].pos += this.focusLength;
            }
            this.range[1] += this.focusLength;
        }
    }

    toString() {
        console.log(this.map);
    }
    
}

class TimeAxis{
    constructor(chart) {
        this.chart = chart;

        this.timeScale = new TimeScale();
        this.tickDistances;

        this.slider = select(this.chart.shadowRoot.querySelector('#x-slider'));

        this.focus = [];
    }

    async set() {
      
        this.values = this.chart.data.getDates();
        
        let chartDimensions = this.chart.getDimensions();
        let chartWidth = this.chart.getDefaultWidth();

        let step = (chartWidth - chartDimensions.left) / this.values.length;
        let focusStep = Math.min(step * 5, 700);

        this.timeScale.setDomain(this.values);
        this.timeScale.setStep(step);
        this.timeScale.setFocusLength(focusStep);
        this.timeScale.setStartingPos(chartDimensions.left);
        await this.timeScale.setMapping();

        let onFocus = this.timeScale.getFocus();
        if (onFocus && onFocus.length) {
            onFocus.forEach(d => this.timeScale.setDistortion(d));
        }
    }

    drawLabels() {
        let dimensions = this.chart.getDimensions();
        
        let top = select(this.chart.shadowRoot.querySelector('#top-axis'))
            .style('cursor', 'pointer');
            
        top.selectAll('text')
            .data(this.values)
            .join(
                enter => enter.append('text')
                    .style('text-anchor', 'middle'),
                update => update,
                exit => exit.remove()                            
            )
            .text(d => d)
            .attr('x', d => this.scale(d) + this.step(d) / 2);

        top.select('line')
            .attr('x1', dimensions.left)
            .attr('x2', this.range()[1])
            .attr('y1', 12)
            .attr('y2', 12)
            .attr('stroke', '#000');

        let bottom = select(this.chart.shadowRoot.querySelector('#bottom-axis'))
            .style('cursor', 'pointer');
            
        bottom.selectAll('text')
            .data(this.values)
            .join(
                enter => enter.append('text')
                    .style('text-anchor', 'middle'),
                update => update,
                exit => exit.remove()                            
            )
            .text(d => d)
            .attr('x', d => this.scale(d) + this.step(d) / 2)
            .attr('y', dimensions.height - dimensions.bottom);
            
        bottom.select('line')
            .attr('x1', dimensions.left)
            .attr('x2', this.range()[1])
            .attr('y1', dimensions.height - dimensions.bottom - 20)
            .attr('y2', dimensions.height - dimensions.bottom - 20)
            .attr('stroke', '#000');

        this.chart.group.selectAll('g.timeaxis')
            .selectAll('text')
            .on('click', async (d) => {
                await this.computeDistortion(d);
                this.setDistortion();
            });    
    }

   
    getItemsByTime(value) {
        let itemsPerYear = this.chart.profiles.data.map(e => e.data[0].map(x => x.data)).flat(); // review this !

        itemsPerYear = nest()
            .key(e => e.year)
            .entries(itemsPerYear);

        return itemsPerYear.find(e => +e.key === value)
    }

    hasNoItems(d) {
        let res = this.getItemsByTime(d);
        let values = res ? res.values : [];
        let filteredValues = values.filter(e => this.chart.getNodeSelection() ? this.chart.isSelected(e.node.key) && e.year === d : e.year === d);  
        return sum(filteredValues, e => e.values.length) === 0
    }

    async computeDistortion(d) {
    
        if (this.hasNoItems(d)) return;

        let index = this.focus.indexOf(d);
        if (index !== -1) this.focus.splice(index, 1);
        else this.focus.push(d);
        
        await this.timeScale.setDistortion(d);
    }

    setDistortion() {

        this.chart.sndlinks.hide();        
        
        this.drawLabels();

        this.chart.draw();
    }


    clearFocus() {
        this.focus = [];
    }

    setSliderPosition(pos, year) {
        if (!year) return;
       
        let width = max([this.step(year), 20]);
        let slider = this.slider.selectAll('rect.move');

        slider.attr('x', pos).attr('width', width);
    }

    drawSlider() {

        let dimensions = this.chart.getDimensions();

        let selectedYear, xPos;

        const dragBehavior = async (year) => {
            if (year === selectedYear) return;
            selectedYear = year; // update the current year on focus

            this.chart.sndlinks.hide();
            if (!this.focus.includes(selectedYear)) {
                await this.computeDistortion(selectedYear);
                this.setDistortion();
            }
            else if (event.type == 'drag') // to avoid change the position on click (start)
                this.setSliderPosition(xPos, selectedYear);

            this.setSliderAnimation(selectedYear); 
        };

        let drag$1 = drag()
            .on('start', () => dragBehavior(selectedYear))
            .on('drag', () => {
                xPos - event.x;
                xPos = event.x;

                let rightmostpos = this.scale(this.values[this.values.length - 1]); //dimensions.width - dimensions.right - this.tickDistances[lastIndex]
                xPos = xPos <= dimensions.left ? dimensions.left : xPos;
                xPos = xPos >= rightmostpos ? rightmostpos : xPos;

                let year = this.invert(xPos);

                //dragBehavior(year)
                this.setSliderPosition(xPos, year);
                this.setSliderAnimation(year); 
            }).on('end', () => {
                
                this.setSliderPosition(this.scale(selectedYear) - this.step(selectedYear)/ 2, selectedYear);
                
                this.clearSliderAnimation();
            });

        this.slider.select('.marker')
            .attr('width', this.step())
            .attr('height', dimensions.height - 10 - dimensions.bottom - dimensions.top)
            .attr('x', dimensions.left)
            .attr('y', 8)
            .attr('fill', 'none')
            .attr('stroke', '#ccc');
            
        this.slider.selectAll('.slider-button')
            .attr('width', this.step())
            .style('display', 'block');        

        this.slider.select('#top-button')
            .attr('height', 15)
            .attr('y', 8)
            .attr('x', dimensions.left)
            .call(drag$1);

        this.slider.select('#bottom-button')
            .attr('height', 15)
            .attr('x', dimensions.left)
            .attr('y', dimensions.height - 2 - dimensions.bottom - dimensions.top)
            .call(drag$1);

    }


    clearSliderAnimation() {
        this.chart.nodes.reverse();
    }

    setSliderAnimation(value) {

        if (this.chart.isFreezeActive()) return

        this.chart.group.selectAll('.item-circle')
            .attr('opacity', d => {
                if (this.focus.includes(d.year)) return 1
                if (!this.chart.isNodeVisible(d.node.key)) return 0 // hide when the items of the artist are hidden
                if (this.chart.getNodeSelection() && !this.chart.isNodeVisible(d.node.key)) return 0 // hide when the artist is not the one with the focus on
                if (d.year != value) return 0
                return 1
            });  

        this.chart.fstlinks.hideLabels();
    }

    

    // The methods below create a facade to TimeScale through common methods of d3 scales
    scale(d) {
        return this.timeScale.getPos(d)
    }

    step(d) {
        return this.timeScale.getStep(d)
    }

    invert(pos) {
        return this.timeScale.getValue(pos)
    }

    range() {
        return this.timeScale.getRange()
    }

}

// Main context menu function
function contextMenu({ shadowRoot, menuItems, onOpen = () => {}, onClose = () => {}, theme = 'd3-context-menu-theme', position } = {}) {
    let currentMenu = null;
  
    // Close the context menu and cleanup
    function closeMenu() {
      if (currentMenu) {
        select(shadowRoot.querySelector('.d3-context-menu')).style('display', 'none');
        select(shadowRoot).on('mousedown.d3-context-menu', null);
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
            const li = select(this);
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
  
      selectAll(listItems).remove(); // Remove existing items
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
      const event$1 = event; // Get current D3 event

      closeMenu(); // Close any existing menu

      currentMenu = true;

      // Select the menu container, apply theme and make it visible
      const div = select(shadowRoot.querySelector('.d3-context-menu'))
        .attr('class', `d3-context-menu ${theme}`)
        .style('display', 'block')
        .html(''); // Remove all children before adding new menu options

      // Register listeners to close menu on click outside
      select(shadowRoot)
        .on('click.d3-context-menu', function() {
            if (!shadowRoot.querySelector('.d3-context-menu').contains(event.target)) {
                closeMenu();
            }
        });
  
      // Build the menu based on provided items
      buildMenu(div, menuItems, 0, { data: d, index: i });
  
      // Optionally prevent menu from opening
      if (onOpen(d, i) === false) return;
  
      // Determine menu position
      const pos = position ? position(d, i) : { x: event$1.pageX, y: event$1.pageY };
  
      const pageWidth = window.innerWidth;
      const pageHeight = window.innerHeight;
  
      // Calculate position relative to page edges
      const left = (pos.x > pageWidth / 2) ? null : pos.x;
      const right = (pos.x > pageWidth / 2) ? pageWidth - pos.x : null;
      const top = (pos.y > pageHeight / 2) ? null : pos.y;
      const bottom = (pos.y > pageHeight / 2) ? pageHeight - pos.y : null;
  
      // Apply positioning styles to the menu
      const menuEl = div.node();
      select(menuEl)
        .style('left', left !== null ? `${left}px` : null)
        .style('right', right !== null ? `${right}px` : null)
        .style('top', top !== null ? `${top}px` : null)
        .style('bottom', bottom !== null ? `${bottom}px` : null);
  
      // Prevent default context menu and event bubbling
      event$1.preventDefault();
      event$1.stopPropagation();
    }
  
    handler.close = closeMenu; // Expose close method
    return handler; // Return the menu handler function
}

const fisheye = {
  scale: function (scaleType) {
    return d3FisheyeScale(scaleType(), 0, 0)
  },
  circular: function () {
    let radius = 200;
    let distortion = 2;
    let k0;
    let k1;
    let focus = [0, 0];

    function fisheye (d) {
      let dx = d.x - focus[0];
      let dy = d.y - focus[1];
      let dd = Math.sqrt(dx * dx + dy * dy);
      if (!dd || dd >= radius) return {x: d.x, y: d.y, z: dd >= radius ? 1 : 10}
      let k = k0 * (1 - Math.exp(-dd * k1)) / dd * 0.75 + 0.25;
      return {x: focus[0] + dx * k, y: focus[1] + dy * k, z: Math.min(k, 10)}
    }

    function rescale () {
      k0 = Math.exp(distortion);
      k0 = k0 / (k0 - 1) * radius;
      k1 = distortion / radius;
      return fisheye
    }

    fisheye.radius = function (_) {
      if (!arguments.length) return radius
      radius = +_;
      return rescale()
    };

    fisheye.distortion = function (_) {
      if (!arguments.length) return distortion
      distortion = +_;
      return rescale()
    };

    fisheye.focus = function (_) {
      if (!arguments.length) return focus
      focus = _;
      return fisheye
    };

    return rescale()
  }
};

function d3FisheyeScale (scale, d, a) {
  function fisheye (_) {
    let x = scale(_);
    let left = x < a;
    let range = extent(scale.range());
    let min = range[0];
    let max = range[1];
    let m = left ? a - min : max - a;
    if (m === 0) m = max - min;
    return (left ? -1 : 1) * m * (d + 1) / (d + (m / Math.abs(x - a))) + a
  }

  fisheye.invert = function (xf) {
    let left = xf < a;
    let range = extent(scale.range());
    let min = range[0];
    let max = range[1];
    let m = left ? a - min : max - a;
    if (m === 0) m = max - min;
    return scale.invert(a + m * (xf - a) / ((d + 1) * m - (left ? -1 : 1) * d * (xf - a)))
  };

  fisheye.distortion = function (_) {
    if (!arguments.length) return d
    d = +_;
    return fisheye
  };

  fisheye.focus = function (_) {
    if (!arguments.length) return a
    a = +_;
    return fisheye
  };

  fisheye.copy = function () {
    return d3FisheyeScale(scale.copy(), d, a)
  };

  fisheye.nice = scale.nice;
  fisheye.ticks = scale.ticks;
  fisheye.tickFormat = scale.tickFormat;
  fisheye.step = scale.step;
  fisheye.padding = scale.padding;

  const rebind = function (target, source) {
    let i = 1;
    const n = arguments.length;
    let method;
    while (++i < n) {
      method = arguments[i];
      target[method] = d3Rebind(target, source, source[method]);
    }    return target
  };
  function d3Rebind (target, source, method) {
    return function () {
      var value = method.apply(source, arguments);
      return value === source ? target : value
    }
  }
  return rebind(fisheye, scale, 'domain', 'range')
}

class ContextMenu {
    constructor(chart) {
        this.chart = chart;

        this.importDiv = this.chart.shadowRoot.querySelector('.import-form');
    }

    getItemMenu() {
        let menu = [];
        menu.push({ title: 'Go to source', 
            action: d => window.open(d.link) 
            });

        return menu;
    }

    getNodeMenu(d) {
        let menu = [];

        if (d.nodeLink) 
            menu.push({
                title: 'Go to source',
                action: d => window.open(d.nodeLink)
            });

        if (this.chart.data.getNodesKeys().length > 1) {
            menu.push({ title: d => this.chart.data.getFocus() === d ? 'Release highlight' : 'Highlight network', 
                        action: async(d) => { 
                            if (this.chart.data.getFocus() === d) {
                                this.chart.data.updateFilters('focus', null);
                            }
                                
                            else { 
                                this.chart.data.updateFilters('focus', d);
                            }

                            await this.chart.data.updateTime();
                            this.chart.update();
                        }
                    });            
        }

        menu.push({
            title: d => this.chart.isProfileVisible(d) ? 'Hide temporal profile' : 'Show temporal profile',
            action: d => {
                let index = this.chart.removeProfile(d);
                if (index > -1 && this.chart.isSelected(d)) this.chart.yAxis.setDistortion(d);
                if (index === -1) this.chart.displayProfile(d);

                this.chart.profiles.draw();
            }
        });

        menu.push({
            title: d => this.chart.areItemsVisible(d) ? 'Hide items' : 'Show items',
            action: d => {
                let index = this.chart.removeItems(d);
                if (index === -1) this.chart.displayItems(d);

                this.chart.nodes.draw();
            }
        });

        
        let keys = this.chart.data.getNodesKeys();
        if (keys.length > 1)
            menu.push({
                title: 'Remove node',
                action: d => {
                    let focus;
                    if (this.chart.yAxis.focus) {
                        if (this.chart.yAxis.focus === d) {
                            let index = keys.indexOf(d);
                            focus = index === 0 ? keys[index + 1] : keys[index - 1];
                        } else if (this.chart.visibleItems.includes(d)) this.chart.updateVisibleNodes(); 
                    }

                    this.chart.data.remove(d, focus);
                } 
            });

        if (keys.length > 1) {
            menu.push({
                title: 'Move',
                children: [
                    {title: 'Up', 
                    action: d => {
                        let index = keys.indexOf(d);
                        if (index === 0) return;
                        let indexB = index - 1;
                        this.chart.data.switchNodes(index, indexB);
                        
                        if (this.chart.yAxis.focus === d) { // if moving the node on focus, change the focus
                            this.chart.yAxis.setDistortion(this.chart.yAxis.focus);
                            this.chart.update(keys[indexB]);
                        } else { // if moving a non-focus node, update the visible nodes and redraw without changing the focus
                            this.chart.updateVisibleNodes(); 
                            this.chart.update();
                        }
                    } }, 
                    {title: 'Down', 
                    action: d => {
                        let index = keys.indexOf(d);
                        if (index === keys.length - 1) return;
                        let indexB = index + 1;
                        this.chart.data.switchNodes(index, indexB);

                        if (this.chart.yAxis.focus === d) { 
                            this.chart.update(keys[index]);
                        } else {
                            this.chart.updateVisibleNodes(); 
                            this.chart.update();
                        }
                    }} ]
                });
        }

        let collaborators = this.chart.data.getNodeById(d).collaborators;
      
        if (collaborators.length && this.chart.isIncremental()) { /// the author has one or more co-authors
            menu.push({ title: 'Explore collaborators', 
                action: (d) => this.openMenuSearch(d, collaborators)
            });
        }
       
        return menu
    }

    openMenuSearch(d, values) {
       
        const _this = this;
        
        let div = select(this.importDiv)
            .style('display', 'flex');
        
        let sorting = [{label: "Alphabetic Order", value: 'alpha'}, {label: "Number of Shared Items (Decreasing)", value: 'decreasing'}];

        let node = this.chart.data.getNodeById(d);

        let top = div.select('div#topbar');

        top.select('label')
            .text(`${node.name}: Search for collaborators`);

        top.select('img')
            .on('click', () => div.style('display', 'none'));

        let select$1 = div.select('.sort')
            .attr('id', 'ul-sort')
            .on('change', function() {
                let selectedOption = this.options[this.selectedIndex];
                _this.chart.data.sortCollaborators(selectedOption.value, d);

                createList(_this.chart.data.getNodeById(d).collaborators);
            });

        select$1.selectAll('option')
            .data(sorting)
            .join(
                enter => enter.append('option'),
                update => update,
                exit => exit.remove()
            )
            .attr('value', d => d.value)
            .text(d => d.label)
            .property('selected', e => e.value === node.sorting);

        div.select('input')
            .on('keyup', search);

        createList(values);

        function getGeneralOptions(values) {
            let options = [];
            options.push({
                id: 'all',
                name: 'All (' + values.length + ')' ,
                action: async () => {
                    _this.chart.appendDataFromQuery(values.filter(e => e.enabled));
                }
            });

            options.push({
                id: 'ten',
                name: 'First 10 collaborators (list order)',
                action: async () => {
                    _this.chart.appendDataFromQuery(values.slice(0, 10));                    
                }
            });

            return options
        }
        
        function createList(values) {
            let data = getGeneralOptions(values).concat(values);

            let listGroup = div.select('ul')
                .selectAll('li')
                .data(data)
                .join(
                    enter => enter.append('li')
                            .style('display', 'flex')
                            .style('gap', '10px')
                            .style('cursor', 'pointer')
                        .call(label => label.append('input')
                            .attr('type', 'checkbox')
                            .style('width', '15px')
                            .attr('class', 'node-check'))
                        .call(label => label.append('tspan')
                            .attr('id', 'node')
                            .text(e => `${e.name} ${e.type ? '(' + e.type + ')' : ''}`))
                        .call(label => label.append('tspan')
                            .attr('id', 'item-count')
                            .text(e => e.values ? `(${e.values.length} items)` : '')
                            .style('font-weight', 'bold'))
                        ,
                    update => update
                        .call(label => label.select('tspan#node')
                            .text(e => `${e.name} ${e.type ? '(' + e.type + ')' : ''} `))
                        .call(label => label.select('tspan#item-count')
                            .text(e => e.values ? `(${e.values.length} items)` : '')),
                    exit => exit.remove()
                );
               

            div.select('button')
                .on('click', e => {
                    let selectedValues = [];

                    let selected = listGroup.selectAll('input')
                        .filter(function() { return this.checked });

                    selected.each(function() {
                        let data = select(this.parentNode).datum();
                        
                        if (data.id === 'all') selectedValues = selectedValues.concat(values);
                        else if (data.id === 'ten') selectedValues = selectedValues.concat(values.slice(0, 10));
                        else selectedValues.push(data);
                    });
                    
                    _this.chart.appendDataFromQuery(selectedValues);

                    listGroup.selectAll('input').property('checked', false);
                    div.style('display', 'none');
                    
                });
        }

        function search() {
            var input, filter, ul, li, i, txtValue;
            input = _this.chart.shadowRoot.querySelector("#ul-search");
            filter = input.value.toUpperCase();
            ul = _this.chart.shadowRoot.querySelector("#ul-multi");
            li = ul.getElementsByTagName("li");
            for (i = 0; i < li.length; i++) {
                
                txtValue = li[i].textContent || li[i].innerText;
                if (txtValue.toUpperCase().indexOf(filter) > -1) {
                    li[i].style.display = "";
                } else {
                    li[i].style.display = "none";
                }
            }
        }
    }
}

var plusIcon = "plusd5dca73bc12bf158.svg";

var upIcon = "upba139714dd9352ba.svg";

var downIcon = "down2bee466f3086e100.svg";

class NodesAxis {
    constructor(chart) {
        this.chart = chart;
        this.scale = fisheye.scale(point$1); 

        this.tickDistances;
        this.div = select(this.chart.shadowRoot.querySelector('.nodes-panel'));

        this.freeze = false;

        this.tooltipId = 'node';

        this.slider = select(this.chart.shadowRoot.querySelector('#y-slider'));

        this.distortion = 4;
        this.shift = 0;

        this.color = {focus: '#2C3E50', normal: '#f5f5f5'};

        this.contextmenu = new ContextMenu(chart);
        
    }

    set() {
        let dimensions = this.chart.getDimensions();

        this.data = this.chart.data.getNodes();
        this.values = this.chart.data.getNodesKeys();

        this.min = this.shift;
        this.max = dimensions.height - dimensions.top - dimensions.bottom - this.shift;

        this.svg = this.div.select('svg')
            .attr('width', dimensions.left)
            .attr('height', dimensions.height);

        this.scale.domain(this.values)
            .range([this.min, this.max])
            .padding(.7);
        
        this.defaultScale = point$1().domain(this.values).range([this.min, this.max]).padding(.7);
            
        this.setSlider();
        
    }

    async setDistortion(d) {
        
        if (this.values.length === 1 || !d) return

        this.chart.sndlinks.hide();

        let distortion = () => new Promise( (resolve, reject) => {
            let pos = this.defaultScale(d);

            let l = this.values.length;
            if (l > 3) {
                let shift = this.defaultScale.step(d) * .2;
                let index = this.values.indexOf(d);
                let b = Math.trunc(l / 3);
                if (index >= 0 && index < b) {
                    pos -= shift;
                } else if (index >= b * 2 && index < l) {
                    pos += shift;
                }
            }

            this.scale.distortion(this.focus === d ? 0 : this.distortion).focus(pos);

            this.focus = this.focus == d ? null : d;

            this.tickDistances = getTicksDistance(this.scale, this.values);

            resolve();
        });
       
        distortion().then( async () => {
            await this.chart.updateVisibleNodes();
            this.drawLabels();
            this.chart.draw();
        });
    }

    setSlider() {
        let dimensions = this.chart.getDimensions();
        let shift = 10, 
            iconsize = 40,
            x = -dimensions.left/2 - iconsize / 2;

        this.slider.attr('transform', `translate(${dimensions.left - shift}, 10)`)
            .style('display', 'none');

        this.slider.selectAll('image')
            .attr('width', iconsize)
            .attr('height', iconsize)
            .style('cursor', 'pointer');

        // TODO: The following elements might not be used anymore, verify!
        this.slider.select("#slider-up")
            .attr('xlink:href', `../assets/${upIcon}`)
            .attr('transform', `translate(${x}, ${-shift - iconsize / 2})`)
            .on('click', () => {
                
                let index = this.values.indexOf(this.chart.getNodeSelection());
                if (index === 0) return;
                this.setDistortion(this.values[index - 1]);
            });

        this.slider.select('#slider-down')
            .attr('xlink:href', `../assets/${downIcon}`)
            .attr('transform', `translate(${x}, ${dimensions.height - dimensions.bottom - dimensions.top - shift - 10})`)
            .on('click', () => {
                let index = this.values.indexOf(this.chart.getNodeSelection());
                if (index === this.values.length - 1) return;
                this.setDistortion(this.values[index + 1]);
            });

    }

    setRange() {
        let point = this.scale(this.chart.data.nodes[0]);
        this.rangePoints = this.tickDistances.map(d => { let v = point; point += d; return v; });
    }

    invert(pos, dir){
        let index = bisectRight$1(this.rangePoints, pos) - (Math.sign(dir) > 0 ? 1 : 0);
        return index >= this.values.length ? this.values[this.values.length - 1] : this.values[index];
    }

    drawLabels() {
        const _this = this;

        this.slider.style('display', this.focus ? 'block' : 'none');

        let dimensions = this.chart.getDimensions();
        
        let rectwidth = dimensions.left * .7;
        let rectheight = 30;
        let iconsize = 20;

        // let getFontSize = (d, l) => { // font size changes according to whether the node is focused on or not
            
        //     if (!this.focus || (this.focus && this.chart.areItemsVisible(d))) return '1em'
        //     else if (this.focus && this.focus != d) return '.5em'

        //     let direction = this.values.indexOf(d) - this.values.indexOf(this.focus)
        //     let pos = this.scale(d), 
        //         focusPos = this.scale(this.focus) + Math.sign(direction) * this.getStep(this.focus) ;

        //     let p = pos > focusPos ? focusPos / pos : pos / focusPos;
        //     return Math.min( (rectwidth * .8) / l, .8) * p  + "em"
        // }

        let iconPath = d => this.chart.app === 'crobora' ? `${this.chart.baseUrl}/muvin/images/${this.chart.app}/${this.data[d].type}-icon.svg` : '';
        let rectFill = d => this.focus === d || this.chart.data.getFocus() === d ? this.color.focus : this.color.normal;
        let textColor =  d => this.focus === d || this.chart.data.getFocus() === d ? '#fff' : '#000';

        let group = select(this.chart.shadowRoot.querySelector('#labels-group'));
        group.selectAll('g.artist-label')
            .data(this.values)
            .join(
                enter => enter.append('g')
                    .classed('artist-label', true)
                    .style('cursor', 'pointer')
                    .attr('opacity', 1)

                    // Draw a rectangle that contains the node
                    .call(g => g.append('rect')
                        .attr('fill', rectFill)
                        .attr('width', rectwidth + 25)
                        .attr('height', rectheight)
                        .attr('x', rectwidth * -.05)
                        .on('click', d => this.setDistortion(d))
                        .on('mouseover', d => { let e = event; this.mouseover(e, d); })
                        .on('mouseout', () => this.mouseout())
                    )

                    // Draw a + sign next to the node to open the associated menu
                    .call(g => g.append('svg:image')
                        .attr('xlink:href', `../assets/${plusIcon}`)
                        .attr('class', 'circle-plus')
                        .attr('width', iconsize)
                        .attr('height', iconsize)
                        .attr('x', rectwidth)
                        .attr('y', rectheight / 2 - iconsize / 2)
                        .on('click', function(d, i) {
                            // Create and call the context menu handler with the correct context
                            const menuHandler = contextMenu({ 
                                shadowRoot: _this.chart.shadowRoot, 
                                menuItems : _this.contextmenu.getNodeMenu(d)
                            });  // Get the function
                            menuHandler.call(this, d, i);  // Call the function within the context of the clicked element
                        })
                        .call(image => image.append('title').text('Click to get more options'))
                    )
   
                    // Draw the name of the node
                    .call(g => g.append('text')
                        .text(d => this.data[d].name)
                        .attr('class', 'title')
                        .style('font-size', '11px')
                        .attr('y', rectheight / 2 + 4)
                        .attr('fill', textColor)
                        .style('pointer-events', 'none')
                    )

                    // Draw the icon for the crobora application, each category has an associated icon
                    .call(g => g.append('svg:image')
                        .attr('xlink:href', d => iconPath(d))
                        .attr('class', 'type-icon')
                        .attr('width', iconsize)
                        .attr('height', iconsize)
                        .attr('x', 2)
                        .attr('y', rectheight / 2 - iconsize / 2)
                        // .style('display', d => this.chart.areItemsVisible(d) && this.chart.app === 'crobora' ? 'block' : 'none')
                        .call(image => image.append('title').text(d => this.data[d].type))
                    )
                    
                    
                    ,

                update => update.call(g => g.select('text.title')
                        .text(d => this.data[d].name)
                        .attr('fill', textColor)
                    )
                    .call(g => g.select('.circle-plus')
                        .on('click', function(d, i) {
                            // Create and call the context menu handler with the correct context
                            const menuHandler = contextMenu({ 
                                shadowRoot: _this.chart.shadowRoot, 
                                menuItems : _this.contextmenu.getNodeMenu(d)
                            });  // Get the function
                            menuHandler.call(this, d, i);  // Call the function within the context of the clicked element
                        })
                    )

                    .call(g => g.select('rect').transition().duration(500)
                        .attr('fill', rectFill)
                    )

                    .call(g => g.select('.type-icon').attr('xlink:href', d => iconPath(d))
                        .call(image => image.select('title').text(d => this.data[d].type)) 
                    ),

                exit => exit.remove()
            )
            .call(g => g.transition().duration(500)
                .attr('transform', d => {
                    let y = this.scale(d) - rectheight / 2;
                    y = y < this.shift ? this.shift : y;
                    return `translate(10, ${y})`
                }));

            group.selectAll('text').each(function() { select(this).call(truncateText, rectwidth); });
                
    }

    setFreeze(d) {
        this.freeze = null;
        
        this.setHighlight(d);
        this.freeze = d;
    }

    releaseFreeze(){
        this.freeze = null;
        this.frozenNodes = null;
        this.removeHighlight();
    }

    mouseover(e, d) {
        this.chart.tooltip.setNodeContent(d, this.tooltipId);
        this.chart.tooltip.show(e, this.tooltipId, 400);

        this.setHighlight(d);
    }

    mouseout(){
        this.chart.tooltip.hide(this.tooltipId);
        this.removeHighlight();
    }

    async setHighlight(d) {
        // do nothing when the links of a node are highlighted, or if the node is not on focus, or if the player is active
        if (this.freeze || this.values.length === 1) return;
                
        let group = select(this.chart.shadowRoot.querySelector('#chart-group'));

        group.selectAll('g.link')
            .transition()
            .duration(500)
            .attr('opacity', e => e.source === d || e.target === d ? 1 : 0);

        this.frozenNodes = await this.chart.getConnectedNodes(d);

        group.selectAll('g.artist')
            .transition('focus-artist')
            .duration(500)
            .attr('opacity', e => d === e || this.frozenNodes.fst.includes(e) ? 1 : .1);

        group.selectAll('.artist-label')
            .transition('focus-node')
            .duration(500)
            .attr('opacity', e => d === e || this.frozenNodes.fst.includes(e) ? 1 : .1);

        this.chart.nodes.highlightNodeItems(this.frozenNodes.snd);

        if (this.chart.getTimeSelection())
            this.chart.sndlinks.highlightLinks(d);

    }

    removeHighlight() {
        if (this.freeze || this.values.length === 1) return;

        let group = select(this.chart.shadowRoot.querySelector('#chart-group'));

        this.chart.fstlinks.reverse();

        this.chart.nodes.reverse();
        
        group.selectAll('g.artist')
            .transition('unfocus-artist')
            .duration(500)
            .attr('opacity', 1);

        if (this.chart.getTimeSelection()) this.chart.sndlinks.reverse();

        group.selectAll('.artist-label')
            .transition('unfocus-node')
            .duration(500)
            .attr('opacity', 1);
    }

    getStep(value) {
        return this.tickDistances ? this.tickDistances[this.values.indexOf(value)] : this.scale.step()
    }

    getNextPos(d) {
        if (this.values.length === 1 || this.values.indexOf(d) === this.values.length - 1) return this.max;
        let index = this.values.indexOf(d);
        return this.scale(this.values[index + 1])
    }

    getPrevPos(d) {
        if (this.values.length === 1 || this.values.indexOf(d) === 0) return this.min;
        let index = this.values.indexOf(d);
        return this.scale(this.values[index - 1])
    }
}

class Profile {
    constructor(chart) {
        this.chart = chart;

        this.tooltipId = 'profile';

        this.selected = [];
    }

    async set() {
    
        let types = this.chart.data.getLinkTypes();
        let nodes = await this.chart.data.getNodesList();
        let dates = this.chart.data.getDates();
        let items = await this.chart.data.getItems();
       
        let itemsByYear = [];
        nodes.forEach(node => { // each node is an object containing name, type and a contributions array
            dates.forEach(year => {       
                
                let res = items.filter(d => d.node.key === node.key && d.year === year);

                let item = {
                    year: year,
                    node: node,
                    values: [...res]
                };

                types.forEach(type => {
                    let resType = res.filter(d => d.node.contribution.includes(type));
                
                    item[type] = resType.length;
                });

                itemsByYear.push(item);
            });
        });

        this.stack = stack()
            .keys(types);

        await this.setStack();
        
        this.data = nodes.map(node => {
            const nodeData = itemsByYear.filter(e => e.node.key === node.key && dates.includes(e.year));
            
            return {
                'node': node,
                'data' : this.stack(nodeData)
            }
        });

        /// one group per node ; it will hold the profile wave ////////
        this.group = select(this.chart.shadowRoot.querySelector('#nodes-group')).selectAll('g.artist')
            .selectAll('g.profile')
            .data(d => this.data.filter(e => e.node.key === d) )
            .join(
                enter => enter.append('g')
                    .classed('profile', true),
                update => update,
                exit => exit.remove()
            );


        this.heightScale = linear()
            .domain(this.getExtent());

        this.area = area()
            .x(d => this.chart.xAxis.scale(d.data.year) + this.chart.xAxis.step(d.data.year) / 2)
            .y0(d => this.chart.yAxis.scale(d.data.node.key) + (this.chart.isProfileActive(d) ? this.heightScale(d[1]) : 0))
            .y1(d => this.chart.yAxis.scale(d.data.node.key) + (this.chart.isProfileActive(d) ? this.heightScale(d[0]) : 0))
            .curve(basis); 

    }

    async setStack() {}

    getHeight() {}

    getExtent() {}

    setArea() {}

    draw() {
        const _this = this;

        this.group.selectAll('path')
            .data(d => this.chart.isProfileVisible(d.node.key) ? d.data : [])
            .join(
                enter => enter.append('path'),
                update => update,
                exit => exit.remove() 
            )
            .attr('d', function(d) { return _this.setArea(d, select(this.parentNode).datum().node.key) })
            .attr('fill', d => this.chart.getTypeColor(d.key))
            .attr('stroke', d => rgb(this.chart.getTypeColor(d.key)).darker())
            .attr('opacity', '1')
            .on('mouseenter', d => {let e = event; this.mouseover(e, d); })
            .on('mousemove', d => {let e = event; this.mouseover(e, d); })
            .on('mouseleave', () => this.mouseout())
            .on('click', d => {let e = event; this.select(e, d); });

        let dimensions = this.chart.getDimensions();
        this.group.selectAll('line')
            .data(d => !this.chart.isProfileVisible(d.node.key) ? [d.node.key] : [])
            .join(
                enter => enter.append('line'),
                update => update,
                exit => exit.remove()
            )
            .attr('x1', dimensions.left)
            .attr('x2', dimensions.width - dimensions.right)
            .attr('y1', d => this.chart.yAxis.scale(d))
            .attr('y2', d => this.chart.yAxis.scale(d))
            .attr('stroke', '#000');
            
    }

    /**
     * 
     * @param {*} d A key identifying a node (i.e. 'name-type')
     */
    downplay(d) {
        this.group
            .transition()
            .duration(500)
            .attr('opacity', e => {
                if (!d) return .1

                if (this.chart.data.getNodeById(d)) 
                    return this.chart.data.getNodeById(d).collaborators.some(x => x.key === e.node.key) || e.node.key === d ? .3 : 0
                
                if (d.contributors && d.contributors.some(x => this.chart.isNodeValid(x) && x.key !== d))
                    return d.contributors.some(x => x.key === e.node.key) || d === e.node.key ? .1 : 0
                
                return .1
            });
    }

    reverseDownplay() {
        this.group
            .transition()
            .duration(500)
            .attr('opacity', 1);
    }

    select(e, d) {
        let index = this.selected.findIndex(s => s.node.key === d[0].data.node.key && s.key === d.key);

        if (index >= 0) this.selected.splice(index, 1); // if path is already selected, remove it from the list
        else this.selected.push({ node: d[0].data.node, key: d.key }); // otherwise, include it in the list of selected paths

        this.mouseout();
        
    }

    mouseover(e, d) {

        // this.chart.tooltip.setContent(this.getTooltipContent(e, d), this.tooltipId)
        this.chart.tooltip.setProfileContent(e, d, this.tooltipId);
        this.chart.tooltip.show(e, this.tooltipId);
       
        let node = d[0].data.node;
        this.group.selectAll('path')
            .attr('opacity', x => node.key != x[0].data.node.key ? 1 : (d.key === x.key ? 1 : .1));

        this.chart.group.selectAll('.doc')
            .attr('opacity', x => x.node.key != node.key ? 1 : ( x.node.key === node.key && x.node.contribution.includes(d.key) ? 1 : .1));

        //if (!this.chart.isFreezeActive()) this.chart.fstlinks.reverse()
    }

    mouseout() {
        this.chart.tooltip.hide(this.tooltipId);

        this.group.selectAll('path') // update opacity of paths
            .attr('opacity', x => !this.selected.some(s => s.node.key === x[0].data.node.key) ? 1 : (this.selected.some(s => s.node.key === x[0].data.node.key && s.key === x.key) ? 1 : .1));

        this.chart.group.selectAll('.doc')
            .attr('opacity', x => !this.selected.some(s => s.node.key === x.node.key) ? 1 : (this.selected.some(s => s.node.key === x.node.key && x.node.contribution.includes(s.key)) ? 1 : .1));

        //if (!this.chart.isFreezeActive()) this.chart.fstlinks.reverse()
    }  
}

class StreamGraph extends Profile {
    constructor(chart) {
        super(chart);
    }

    async setStack() {
        this.stack
            .offset(silhouette)
            .order(none);
    }

    getHeight(d) {
        let height = this.chart.yAxis.getStep(d); // reference height for the wave
        if (!this.chart.getNodeSelection()) // no selected node
            return height * .6

        if (this.chart.isSelected(d) && this.chart.data.getNodesKeys().indexOf(d) === 0) // the given node is selected and it is the first one in the list
            return height * .5
        
        return height * .5
    }

    getExtent(){
        // compute min and max height of waves
        let min$1 = 1000, max$1 = -1000;
        this.data.forEach(d => {
            d.data.forEach(item => {
                item.forEach(e => {
                    let min_e = min(e),
                        max_e = max(e);
                    if (min$1 > min_e) min$1 = min_e;
                    if (max$1 < max_e) max$1 = max_e;
                });
            });
        });

        return [min$1, max$1]
    }

    setArea(d, key) {
        let height = this.getHeight(key);
        this.heightScale.range([-height, height]); // changes for each node
        return this.area(d)
    }

}

class LinksGroup {
    constructor(chart) {
        this.chart = chart;

        this.group = select(this.chart.shadowRoot.querySelector('#link-group')); // group that holds the first-level links (i.e. links between authors without details)
        
    }

    getData() {
        let isValid = d => this.chart.isNodeValid(d.source) && this.chart.isNodeValid(d.target) && !this.chart.isSelected(d.year);
        let data = this.chart.data.getLinks().filter(d => isValid(d) );
        
        return data
    }

    /**
     * draw the first level links (e.g. overal relationship between first level nodes -- authors/artists)
     */
    draw() {

        this.data = this.getData(); 

        let nestedData = nest()
            .key(d => d.year)
            .key(d => d.source.key + '-' + d.target.key)
            .entries(this.data);
            
        let max$1 = max(nestedData, d => max(d.values, e => e.values.length));
        let strokeScale = linear()
            .domain([1, max$1])
            .range([2, 6]);
        
        const lineAttrs = { x1: 0,
            x2: 0,
            y1: d => this.chart.yAxis.scale(d.source),
            y2: d => this.chart.yAxis.scale(d.target),
            //'stroke-dasharray': d => this.chart.isUncertain(d) ? 4 : 'none',
            'stroke': '#000',
            'stroke-opacity': 1,
            'stroke-width': d => strokeScale(d.values.length),
            'stroke-linecap': 'round'
        };

        let timeGroup = this.group.selectAll('g.link-year')
            .data(nestedData)
            .join(
                enter => enter.append('g')
                    .classed('link-year', true),
                update => update,
                exit => exit.remove()
            )
            .attr('transform', d => `translate(${this.chart.xAxis.scale(d.key) + this.chart.xAxis.step(d.key) / 2}, 0)`)
            .style('display', d => this.chart.isSelected(d.key) ? 'none' : 'block' );
            
        timeGroup.selectAll('.link')
            .data(d => d.values.map(e => ({key: e.key, values: e.values, source: e.key.split('-')[0], target: e.key.split('-')[1], year: d.key }) ))
            .join(
                enter => enter.append('g')
                    .classed('link', true)
                    .call(g => g.append('line')
                        .classed('link-line', true)
                        .style('cursor', 'pointer')
                        .attrs(lineAttrs)
                    )
                    .call(g => g.append('title')
                        .text(d => `Items: ${d.values.length}`)
                    ),
                update => update
                    .call(g => g.select('line')
                        .attrs(lineAttrs)
                    )
                    .call(g => g.select('title')
                        .text(d => `Items: ${d.values.length}`)
                    ),
                exit => exit.remove()
            );

        this.drawTicks('source');
        this.drawTicks('target');

    }

    drawTicks(type) {

        const textLength = d => d[type].name.length * 10;

        let rectHeight = 25;
        const rectAttrs = {
            width: d => textLength(d), 
            height: rectHeight,
            fill: "#f5f5f5",
            stroke: "none",
            rx: 10,
            x: d => this.chart.xAxis.scale(d.year) - textLength(d) - 15,
            y: d => this.chart.yAxis.scale(d[type].key)
        };
        
        const textAttrs = {
            x: d => this.chart.xAxis.scale(d.year) - 20,
            y: d => this.chart.yAxis.scale(d[type].key) + rectHeight * .7
        };

        select(this.chart.shadowRoot.querySelector('#ticks-group'))
            .selectAll(`g.${type}-labels`)
            .data(this.data)
            .join(
                enter => enter.append('g')
                    .classed(`${type}-labels`, true)
                    .style('display', 'none')
                    .style('pointer-events', 'none')

                    .call(g => g.append('rect')
                        .classed('link-label', true)
                        .attrs(rectAttrs)
                    )
                    .call(g => g.append('text')
                        .classed('link-label', true)
                        .style('font-size', '12px')
                        .style('font-weight', 'bold')
                        .style('text-anchor', 'end')
                        .attrs(textAttrs)
                        .text(d => d[type].name)
                    ),

                update => update
                    .call(g => g.select('rect').attrs(rectAttrs))
                    .call(g => g.select('text').attrs(textAttrs).text(d => d[type].name)),

                exit => exit.remove()
            );

    }

    downplay() {
        this.group.selectAll('.link').attr('opacity', 0);

        this.group.selectAll("[class$='-ticks']").attr('opacity', 0);
        
        this.hideLabels();
    }

    highlight(d) {
        
        this.group.selectAll('.link')
            .attr('opacity', e => (e.source === d.node.key || e.target === d.node.key) && e.values.some(x => x.item === d.id) && +e.year === d.year ? 1 : 0);
          
        this.highlightLabels(d);
    }

    highlightLabels(d) {
        this.chart.group.selectAll("[class$='-labels']")
            .style('display', e => e.item === d.id && e.year === d.year ? 'block' : 'none');
    }

    reverse() {
        this.group.selectAll('.link').attr('opacity', 1);

        this.group.selectAll("[class$='-ticks']").attr('opacity', 1);

        this.hideLabels();
    }

    hideLabels() {
        this.chart.group.selectAll("[class$='-labels']").style('display', 'none');
    }

    mouseover() {

    }

    mouseout() {

    }
}

// group that holds the second-level links (i.e. links between specific items)

class NodeLinksGroup{
    constructor(chart) {
        this.chart = chart;

        this.group = select(this.chart.shadowRoot.querySelector('#nodeLinks-group')); 
    }

    set() {

        this.linkInfo = d => `${d.source.name} ${d.symmetric ? '↔' : '→' } ${d.target.name}\n\nItem: ${d.item.title}\n\nContribution Type: ${d.type}`;  
        
        this.linkGenerator = linkVertical()
            .x(d => d.x)
            .y(d => d.y);

        this.pathAttrs = {
            "stroke": d => this.chart.getTypeColor(d.type),
            'stroke-width': 5,
            'fill': 'none',
            'd': d => this.linkGenerator(d),
            'opacity': 1
        };

        this.strokeAttrs = {
            "stroke": d => rgb(this.chart.getTypeColor(d.type)).darker(),
            'stroke-width': 7,
            'fill': 'none',
            'd': d => this.linkGenerator(d),
            'opacity': 1
        };
    }

    // draw the second level links (e.g. links between second level nodes -- songs/documents)
    async draw() {
        const _this = this;

        let data = await this.getData();

        let link = this.group.selectAll('.node-link')
            .data(data)
            .join(
                enter => enter.append('g')
                    .classed('node-link', true),                   
                update => update, 
                exit => exit.remove()
            )
            .call(g => g.attr('opacity', d => this.chart.isFreezeActive() ? (this.chart.isFrozen(d.value.id) ? 1 : 0) : 1  ));

        // Set a constant offset value
        const offset = 10; // Adjust this value based on the desired distance between paths
        const transform = (d, i, nodes) => {
        
            // Step 1: Normalize the source-target pairs (make undirected paths equivalent)
            let normalizePair = (a, b) => a < b ? `${a}-${b}` : `${b}-${a}`;
            let currentPair = normalizePair(d.source.key, d.target.key);

            // Step 2: Normalize all pairs from nodes
            let pairs = nodes.map(node => { 
                let datum = select(node).datum();
                return normalizePair(datum.source.key, datum.target.key);
            });

            // Step 3: Count how many times the current pair appears
            let totalPaths = pairs.filter(pair => pair === currentPair).length;

            // Step 4: Calculate centralOffset for centering
            const centralOffset = (totalPaths - 1) / 2;
        
            // Step 5: Return the transformation (no need to transform if there is only one unique link)
            return totalPaths === 1 ? `translate(0, 0)` : `translate(${(i - centralOffset) * offset}, 0)`;
        };

        link.selectAll('path.path-stroke')
            .data(d => d.values.flat()) // Add an offset index to each path
            .join(
                enter => enter.append('path')
                    .attr('class', 'path-stroke single-link'),
                update => update,
                exit => exit.remove()
            )
            .attrs(this.strokeAttrs)
            .attr('transform', transform);
            

        link.selectAll('path.path-link')
            .data(d => d.values.flat()) // Add an offset index to each path
            .join(
                enter => enter.append('path')
                    .attr('class', 'path-link single-link')
                    .attrs(this.pathAttrs)
                    .attr('transform', transform)
                    .call(path => path.append('title').text(this.linkInfo)),
                update => update.call(path => path.attrs(this.pathAttrs)
                        .attr('transform', transform))
                    .call(path => path.select('title').text(this.linkInfo)),
                exit => exit.remove()
            )
            .on('mouseenter', function(d) { _this.mouseover(d, this); })
            .on('mouseleave', () => this.mouseout());
            
    }
    
    hide() {
        this.group.selectAll('.node-link').attr('opacity', 0); 
    }

    reverse() {
        this.group.selectAll('.node-link')
            .transition()
            .duration(200)
            .attr('opacity', d => this.chart.isFreezeActive() ? (this.chart.isFrozen(d.value.id) ? 1 : 0) : 1 );

        this.group.selectAll('.single-link')
            .transition()
            .duration(200)
            .attr('opacity', 1);
    }

    highlightLinks(d) {
        this.group.selectAll('.single-link')
            .transition()
            .duration(200)
            .attr('opacity', e => (d.id ? e.item.id === d.id : e.nodes.includes(d)) ? 1 : 0.2);  
    }

    mouseover(d, elem) {        
        if (!this.chart.getTimeSelection()) return

        this.group.selectAll('.single-link')
            .transition()
            .duration(200)
            .attr('opacity', e => e.source.key === d.source.key && 
                e.target.key === d.target.key && e.type === d.type && e.item.id === d.item.id ? 1 : .2 );
        
        let selected = e => e.id === d.item.id && e.year === d.item.year && ([d.source.key, d.target.key].includes(e.node.key));
        this.chart.group.selectAll('.item-circle')
            .attr('opacity', e => selected(e) ? 1 : .2 )
            .attr('stroke-width', e => selected(e) ? 2 : 1 );

        this.chart.profiles.downplay();
        this.chart.fstlinks.downplay();

    }

    mouseout() {
        if (!this.chart.getTimeSelection()) return
        
        this.reverse();
        
        this.chart.nodes.reverse();

        this.chart.profiles.reverseDownplay();
        this.chart.fstlinks.reverse();
    }


    async getLinks() {

        // keep one link per node
        let links = JSON.parse(JSON.stringify(this.chart.data.getLinks())); // make a local copy of the data to avoid propagating the modifications below
        
        links = links.filter(d => this.chart.isSelected(d.year));

        // remove crossing links
        let nodes = this.chart.data.getNodesKeys();
       
        let temp = {};
        links.forEach( d => {
            let s = nodes.indexOf(d.source.key);
            let t = nodes.indexOf(d.target.key);

            let key = `${s}-${t}-${d.item}-${d.type}`;
            let alternativeKey = `${t}-${s}-${d.item}-${d.type}`;
            if (!temp[key] && !temp[alternativeKey]){
                temp[key] = d;
            } 
        });

        let vertices = Object.keys(temp); // keys of links (source-target-item)
        let items = Object.values(temp).map(d => d.item); // keys of items
        let types =  Object.values(temp).map(d => d.type);

        let indices = Object.keys(nodes); // keys of nodes
        for (let i of items) {
            for (let t of types) {
                for (let x of indices) {
                    for (let y of indices) {
                        for (let z of indices) {
                            // Check for the transitivity condition: x → y, y → z, and x → z all exist
                            if (
                                vertices.includes(`${x}-${z}-${i}-${t}`) && // shortcut link
                                vertices.includes(`${x}-${y}-${i}-${t}`) && // first part of transitivity
                                vertices.includes(`${y}-${z}-${i}-${t}`)    // second part of transitivity
                            ) {
                                // Delete only the direct link that "skips" the intermediate node y
                                delete temp[`${x}-${z}-${i}-${t}`];
                            }
                        }
                    }
                }
            }
        }

        return Object.values(temp)

    }  
    

    /**
     * Function to compute the second level links of the network based on the nodes in focus
     * @returns an array containing the links
     */
    async getData() {
        
        let links = await this.getLinks();
        
        let linkedItems = links.map(d => d.item);
        let selection = await this.chart.data.getItems();
        selection = selection.filter(e => linkedItems.includes(e.id) && this.chart.isSelected(e.year));

        let nestedLinks = nest()
            .key(d => d.item)
            .entries(links);

        nestedLinks.forEach(d => {
            let nodesData = selection.filter(e => e.id === d.key );
            if (nodesData.length <= 1) return

            
            d.values = d.values.map( e => {
               
                let sData = nodesData.find(x => x.node.key === e.source.key);
                let source = this.chart.app === 'crobora' ? {x: sData.x + sData.r, y: sData.y} : 
                    {x: sData.x, y: sData.y};

               
                let tData = nodesData.find(x => x.node.key === e.target.key);
                let target = this.chart.app === 'crobora' ? {x: tData.x + tData.r, y: tData.y + tData.r} : 
                    {x: tData.x, y: tData.y};     
                    
                if (source.y > target.y) {
                    source.y -= sData.r;
                    target.y += tData.r;
                } else {
                    source.y += sData.r;
                    target.y -= tData.r;
                }
                
                let values = [];

                let item = { ...nodesData[0] };
                values.push( { source: { ...e.source.contribution.includes(e.type) ? e.source : e.target,  ...source}, 
                    target: {...e.source.contribution.includes(e.type) ? e.target : e.source, ...target}, 
                    type: e.type, 
                    item: item,
                    symmetric:  e.source.contribution.includes(e.type) && e.target.contribution.includes(e.type),
                    nodes: item.contributors.map(x => x.key)
                } );

                return values
            });
        });


        return nestedLinks
    }
}

class NodesGroup {
    constructor(chart) {
        this.chart = chart;

        this.group = select(this.chart.shadowRoot.querySelector('#nodes-group'));

        this.forceSimulation = simulation()
            .alphaMin(.1)
            .force("x", x$1()
                .strength(d => this.chart.getTimeSelection() && this.chart.isSelected(d.year) ? 0.05 : .5)
                .x(d => this.chart.xAxis.scale(d.year) + this.chart.xAxis.step(d.year) / 2))
            
            .force("y", y$1()
                .strength(d => this.chart.getTimeSelection() && this.chart.isSelected(d.year) ? 1 : .5)
                .y(d => this.chart.yAxis.scale(d.node.key))) 

            .force("collide", collide().radius(d => d.r).iterations(32)) // Force that avoids circle overlapping
            .tick(10)
                
            .on('end', () => { if (this.chart.getTimeSelection()) this.chart.sndlinks.draw(); }); 

        this.mouseoverTimeout;
        this.tooltipId = null;

        this.circleAttrs = {
            r: d => d.r,
            fill: () => this.chart.getItemColor(),
            stroke: '#000',
            opacity: d => this.opacity(d),
            class: 'item-circle',
            //display: d => this.opacity(d) ? 'block' : 'none'
        };

        this.displayCircle = d => this.opacity(d) ? 'block' : 'none';

        this.contextmenu = new ContextMenu(chart);
    }

    set() {}

    async computeRadius() {}

    async appendNodes() { }

    // draw the second level nodes of the network (e.g. documents, songs/albums)
    async draw() {

        this.data = await this.chart.data.getItems();
        
        await this.computeRadius();

        await this.appendNodes();

        this.group.selectAll('.doc')
            .on('click', d => window.open(d.link))
            .on('mouseenter', d => { let e = event; this.mouseover(e, d, 'item'); })
            .on('mouseleave', () => this.mouseout()); // set a timeout to ensure that mouseout is not triggered while rapidly changing the hover

        this.placeItems();

    }      
    
    placeItems() {
        this.forceSimulation.nodes(this.data);
        this.forceSimulation.force('x').initialize(this.data);
        this.forceSimulation.force('collide').initialize(this.data);
        this.forceSimulation.alpha(1).restart();
    }

    /**
     * Function to compute the opacity of nodes according to a number of aspects that define whether they should be visible or not
     * @param {*} d data record 
     * @returns opacity (0, 1)
     */
     opacity(d) {
        let key = d.node.key;

        if (!this.chart.drawItems()) { // by default, items should be hidden
            if (this.chart.isSelected(d.year)) return 1 // exception: the given year is selected
            if (this.chart.getNodeSelection() && this.chart.isSelected(key)) {
                if (this.chart.areItemsVisible(key)) return 1 // exception: the given node is selected and its items are visible
            }
        }

        if (!this.chart.drawItems() && !this.chart.isSelected(d.year)) return 0 // by default, items are hidden and the year is not selected
        if (this.chart.getNodeSelection() && !this.chart.isNodeVisible(key)) return 0 // there is a node selected but the user chose not to display the items of that node, or the item do not belong to the selected node
        if (this.chart.isFreezeActive() && !this.chart.isFrozen(d.id)) return 0.1 

        if (this.chart.areItemsVisible(key)) return 1 // display if the items are visible for the given node
        if (this.chart.getTimeSelection() && this.chart.isSelected(key)) return 1 // display if there is a node selected and the item belong to that node
        if (this.chart.areItemsVisible(key) && this.chart.getTimeSelection() && this.chart.isSelected(d.year)) return 1 // display if items are visible for the given node and there 
        if (!this.chart.getTimeSelection() && this.chart.getNodeSelection() && this.chart.isSelected(key)) return 1

        return 0
    }

    mouseover(e, d, tooltipId) {

        this.chart.tooltip.setItemContent(d, tooltipId);
        this.chart.tooltip.show(e, tooltipId);
        this.tooltipId = tooltipId;

        
        this.group.selectAll('.item-circle')    
            .attr('stroke-width', e => d.id === e.id ? 3 : 1);

        this.chart.fstlinks.highlightLabels(d);
        this.chart.sndlinks.highlightLinks(d);

        if (this.chart.isFreezeActive())  return

        let collab = d.contnames ? d.contnames.filter( (e,i) => e != d.node.name && this.chart.areItemsVisible(e)) : [];

        this.group.selectAll('.item-circle')
            .attr('opacity', e => {
                if (!this.chart.isNodeVisible(e.node.key)) return 0
                if (collab.length && e.node.name != d.node.name && !collab.includes(e.node.name)) return 0
                if (e.id === d.id) return 1 // show selected item
                if (d.parent && e.parent && e.parent.id === d.parent.id) return 1 // show siblings (items from same cluster)
                
                return .2
            })
            .attr('stroke-width', e => d.id === e.id ? 3 : 1);
       
        this.chart.group.selectAll('.image-border')
            .attr('stroke', e => e.id === d.id ? '#000' : '#fff');

        this.chart.fstlinks.highlight(d);
        this.chart.profiles.downplay(d.node.key);
    }

    mouseout() {

        
        if (this.chart.getTimeSelection()) this.chart.sndlinks.reverse();

        this.chart.tooltip.hide(this.tooltipId);
        this.tooltipId = null;

        this.reverse();     

        this.chart.fstlinks.hideLabels();

        if (this.chart.isFreezeActive()) return

        this.chart.fstlinks.reverse();
        
        this.chart.profiles.reverseDownplay();

    }

    reverse() {
        this.group.selectAll('.item-circle')
            .attr('opacity', d => this.chart.isFreezeActive() ? (this.chart.isFrozen(d.id) ? 1 : .1) : this.opacity(d) ) 
            .attr('stroke-width', 1)
            .attr('fill', this.chart.getItemColor());

        this.chart.group.selectAll('.image-border').attr('stroke', '#fff');
    }

    highlightNodeItems(nodes) {
        this.group.selectAll('.item-circle')
            .filter(e => this.chart.areItemsVisible(e.node.key))
            .transition('focus-items')
            .duration(200)
            .attr('opacity', e => nodes.includes(e.id) ? 1 : .1)
            .attr('fill', this.chart.getItemColor());
    }

    highlightItem(name){
        let packGroups = selectAll(this.chart.shadowRoot.querySelectorAll('.item-circle'))
            .filter(d => this.opacity(d) ? true : false);

        let selection = packGroups.filter(d => d.title === name);
       
        if (selection.size()) {
            let data = [];
            selection.each(function() {
                let d = select(this).datum();

                data.push({
                    cx: d.x,
                    cy: d.y,
                    r: d.r 
                });
            });   

            select(this.chart.shadowRoot.querySelector('#chart-group'))
                .selectAll('.highlight')
                .data(data)
                .join(
                    enter => enter.append('circle')
                        .attr('fill', 'none')
                        .classed('highlight high-item', true),
                    update => update,
                    exit => exit.remove()
                )
                .attrs(d => d);
        } else {
            selectAll(this.chart.shadowRoot.querySelectorAll('.highlight')).classed('high-item', false);
        }
    }

    clearHighlight() {
        this.highlightItem('');
    }

    setUncertainPattern() {
        const defs = this.group
            .append("defs");

        let pattern = defs.append('pattern')
            .attr('id', 'diagonalStripes')
            .attr('patternUnits', 'userSpaceOnUse')
            .attr('patternTransform', 'rotate(45)')
            .attr('width', 4)
            .attr('height', 4);
        
        pattern
            .append("rect")
            .attr("height", "100%")
            .attr("width", "100%")
            .attr("fill", this.chart.getItemColor());

        pattern
            .append("rect")
            .attr("x", 3)
            .attr("y", 0)
            .attr("height", "100%")
            .attr("width", "10%")
            .attr("fill", "white");
    }

    getPatternUrl() {
        return `url('${window.location.pathname}${window.location.search}#diagonalStripes')`
    }
}

class ImageNodes extends NodesGroup {
    constructor(chart) {
        super(chart);

        this.radius = {normal: 7, focus: 40};

    }

    async set() {

        this.group.append('clipPath')
            .attr('id', 'clipObj-focus')
            .append('circle')
            .attr('cx', this.radius.focus / 2 + this.radius.focus / 2)
            .attr('cy', this.radius.focus / 2 )
            .attr('r', this.radius.focus / 2);

        this.imageAttrs = {
            width: d => d.r * 2,
            'xlink:href': d => getImage(d.title, this.chart.getToken()),
            alt: d => d.name,
            opacity: d => this.opacity(d),
            class: 'item-circle',
            display: d => this.chart.getTimeSelection() && this.chart.isSelected(d.year) ? 'block' : 'none',
            'clip-path': d => 'url(#clipObj-focus)'
        };

        this.imageBorderAttrs = {
            r: d => d.r / 2,
            cx: d => d.r / 2 + d.r / 2,
            cy: d => d.r / 2,
            opacity: d => this.opacity(d),
            stroke: "#fff",
            'stroke-width': 3,
            class: 'image-border',
            display: d => this.chart.getTimeSelection() && this.chart.isSelected(d.year) ? 'block' : 'none',
            fill: 'none'
        };

        this.circleAttrs.display = d => !this.chart.isSelected(d.year) ? 'block' : 'none';

        this.forceSimulation
            .force("x", x$1()
                .strength(d => this.chart.getTimeSelection() && this.chart.isSelected(d.year) ? .2 : .5)
                .x(d => this.chart.xAxis.scale(d.year) + this.chart.xAxis.step(d.year) / 2))
            
            .force("y", y$1()
                .strength(d => this.chart.getTimeSelection() && this.chart.isSelected(d.year) ? .7 : .5)
                .y(d => this.chart.yAxis.scale(d.node.key))) 

            .force("collide", collide().radius(d => this.chart.isSelected(d.year) ? d.r / 2 : d.r).iterations(32))

            .on("tick", () => this.group.selectAll('.doc')
                .attr('transform', d => `translate(${d.x}, ${d.y})` ));
    }

    async computeRadius() {

        this.data.forEach(d => {
            if (this.chart.getTimeSelection()) {
                if (this.chart.isSelected(d.year)) 
                    d.r = this.radius.focus;
                
            } else d.r = this.radius.normal;

        });
    }

    async appendNodes() {

         // a group per item (e.g. an item == an image)
        this.group.selectAll('g.artist')
            .selectAll('.doc')            
            .data(d => this.data.filter(e => e.node.key === d) )
            .join(
                enter => enter.append('g')
                    .classed('doc', true)
                    .style('pointer-events', d => this.opacity(d) ? 'auto' : 'none')
                    .call(g => g.append('circle')
                            .attrs(this.circleAttrs) )
                    .call(g => g.append('svg:image')
                        .attrs(this.imageAttrs))
                    .call(g => g.append('circle')
                        .attrs(this.imageBorderAttrs)),
                update => update.style('pointer-events', d => this.opacity(d) ? 'auto' : 'none')
                    .call(g => g.select('circle.item-circle')
                            .attrs(this.circleAttrs) )
                    .call(g => g.select('image')
                        .attrs(this.imageAttrs) )
                    .call(g => g.select('circle.image-border')
                        .attrs(this.imageBorderAttrs)),
                exit => exit.remove()        
            );

    }


}

class NormalNodes extends NodesGroup{
    constructor(chart) {
        super(chart);

        this.radius = {min: 3, max: 15, minFocus: 10, maxFocus: 30};

        this.radiusScale = log().range([this.radius.min, this.radius.max]);
    }

    set() {

        this.forceSimulation.on("tick", () => this.group.selectAll('.doc')
            .attr('transform', d => `translate(${d.x}, ${d.y})` ));
    }

    async computeRadius() {
        this.radiusScale.domain(extent(this.data, d => d.contributors.length));

        this.data.forEach(d => {
            if (this.chart.getTimeSelection() && this.chart.isSelected(d.year)) {
                    this.radiusScale.range([this.radius.minFocus, this.radius.maxFocus]);
            } else this.radiusScale.range([this.radius.min, this.radius.max]);

            d.r = this.radiusScale(d.contributors.length);
        });
    }

    async appendNodes() {
        // a group per item (e.g. an item == a song)
        this.group.selectAll('g.artist')
            .selectAll('.doc')
            .style('display', d => this.displayCircle(d))            
            .data(d => this.data.filter(e => e.node.key === d) )
            .join(
                enter => enter.append('g')
                    .classed('doc', true)
                    .style('pointer-events', d => this.opacity(d) ? 'auto' : 'none')
                    .call(g => g.append('circle')
                            .attrs(this.circleAttrs) ),
                update => update.style('pointer-events', d => this.opacity(d) ? 'auto' : 'none')
                    .call(g => g.select('circle')
                            .attrs(this.circleAttrs) ),
                exit => exit.remove()        
            );

    }
}

class Tooltip {
    constructor(chart) {
        this.chart = chart;
    }

    set() {
    
    }

    hideAll() {
        selectAll(this.chart.shadowRoot.querySelectorAll('.tooltip'))
            .style('display', 'none');
    }

    hide(id) {
        select(this.chart.shadowRoot.querySelector(`#${id}-tooltip`))
            .style('display', 'none');
    }

    setContent(htmlContent, id) {
        select(this.chart.shadowRoot.querySelector(`#${id}-tooltip`)).html(htmlContent);
    }

    show(event, id, width = 250) {
        let tooltip = this.chart.shadowRoot.querySelector(`#${id}-tooltip`);
        tooltip.style.display = 'block';
        
        let x = event.pageX + 10,
            y = event.pageY + 10,
            tHeight = tooltip.clientHeight,
            tWidth = tooltip.clientWidth;

        if ( (x + tWidth) > window.innerWidth) x -= (tWidth + 30);
        if ( (y + tHeight) > window.innerHeight) y -= (tHeight + 30);

        select(tooltip)
            .styles({
                left: x + 'px',
                top: y +'px',
                'pointer-events': 'none',
                'max-width': width + 'px'
            });
    }

    getVisibleCollaborators(d) {
        let nodes = Object.keys(this.chart.data.getNodes());
        return d.collaborators.filter(e => e.key !== d.key && nodes.includes(e.key))
    } 

    ////////////
    // General implementations of the tooltips. For custom content, extend the class and overwrite the methods below 

    setItemContent(d, id) {
        const itemName = `<b>${d.title} (${d.year})</b><br>`;
        const type = `<b>Type:</b> ${d.type}`;
        const more = `<br><br>Click to go to source`;

        let keys = this.chart.data.getNodesKeys();
       
        const contributors = e => `<b>${e.contnames.length} node(s):</b> ${e.contributors.map(val => keys.includes(val.key) ? `<b><i>${capitalizeFirstLetter(val.name)}</i></b>` : capitalizeFirstLetter(val.name)).join(', ')}`;

        this.setContent(`${itemName}<br>${contributors(d)}<br><br>${type}${more}`, id); 
    }

    async setProfileContent(e, d, id) {
        let node = d[0].data.node;
        let year = this.chart.xAxis.invert(e.pageX, 1);

        let data = await this.chart.data.getItems();
        let values = data.filter(e => e.node.key === node.key && e.year === year && e.node.contribution.includes(d.key));
        let totalYear = data.filter(e => e.node.key === node.key && e.year === year);        
        let percentage = ((values.length / totalYear.length) * 100).toFixed(2);

        let content = `<b>${year}</b> (${node.name})<br><br>
        <b>${totalYear.length}</b> items in total<br><br>
        <b>${capitalizeFirstLetter(d.key)}</b>: <b>${values.length}</b> item${values.length === 1 ? '' : 's'} (<b>${percentage}%</b>)<br><br>
        Click to keep it highlighted`;

        this.setContent(content, id);
    }

    setNodeContent(d, id) {
        let value = this.chart.data.getNodeById(d);
        
        let content = `<b>${value.name}</b><br>
        <b>${value.collaborators.length}</b> relationships in total<br>
        <b>${this.getVisibleCollaborators(value).length}</b> relationships in this network<br><br>
            `;

        this.setContent(content, id);
    }
}

class ImageTooltip extends Tooltip{
    constructor(chart) {
        super(chart);

    }

    setItemContent(d, id) { // TO-DO: modify according to crobora data
        const image = `<div style="width: 100%; margin:auto; text-align:center;">
                <a href="${d.link}" target="_blank" style="pointer-events: ${d.link ? 'auto' : 'none'};">
                    <img class="main-image" src=${getImage$1(d.title, this.chart.getToken())} width="250px" title="Click to explore the archive metadata in the CROBORA platform" ></img> </a>
                <br></div>`;

        let content = `${image}
                    <p>Archive: <b>${d.parent.name}</b></p>
                    <p>Broadcast date: <b>${d.date}</b></p>
                    <p><b>Broadcaster:</b> ${d.node.contribution.join(', ')}</p> 
                    <p><b>Keywords(s):</b>
                    <ul style='list-style-type: none;'>
                    ${d.contributors.map(val => `<li title="${val.type}" style="display:flex; gap:10px;"> <img src="${this.chart.baseUrl}/muvin/images/${this.chart.app}/${val.type}-icon.svg" width="15px"></img>${capitalizeFirstLetter(val.name)}</li>` ).join('')}
                    </ul>
                    <br><br><p>Click for more</p>
                    `;
        this.setContent(content, id); 
    }

    async setProfileContent(e, d, id) { 
        let node = d[0].data.node;
        let year = this.chart.xAxis.invert(e.pageX, 1);

        let data = await this.chart.data.getItems();
        let values = data.filter(e => e.node.key === node.key && e.year === year && e.node.contribution.includes(d.key));
        let totalYear = data.filter(e => e.year === year);
        
        let content = `<img src="${this.chart.baseUrl}/muvin/images/${this.chart.app}/${node.type}-icon.svg" width="15px"></img><b> ${node.name}</b><br><br>
        <b>Broadcaster:</b> ${capitalizeFirstLetter(d.key)}<br><br>
        <b>${year}: ${values.length}</b> image${values.length > 1 ? 's' : ''} out of ${totalYear.length}<br><br>
        Click to keep it highlighted`;

        this.setContent(content, id);
    }

    setNodeContent(d, id) {
        let value = this.chart.data.getNodeById(d);
        
        let content = `<b>${value.name}</b><br><br>
            Category: <b>${value.type}</b><br>
            <b>${value.collaborators.length}</b> co-occurrences in total<br>
            <b>${this.getVisibleCollaborators(value).length}</b> co-occurrences in this network<br><br>`;

        this.setContent(content, id);
    }
}

class TooltipFactory {

    static getTooltip(app, chart) {
        switch (app) {
            case 'crobora':
                return new ImageTooltip(chart) // tuned to display images
            default:
                return new Tooltip(chart) // default tooltip, generated from metadata
        }
    }
}

class ViewSettings{
    constructor(chart) {
        this.chart = chart;
    }

    set() {
        const _this = this;
        this.displayItemsCheckbox = this.chart.shadowRoot.querySelector('#display-items');

        select(this.displayItemsCheckbox).on('click', function() { 
                _this.chart.updateItemsDisplay(this.checked); 
            } );

        const clearNetworkButton = this.chart.shadowRoot.querySelector('#clear-network');    
        select(clearNetworkButton)
            .on('click', async () => await this.handleClearNetwork());
    }
    
    async handleClearNetwork() {
        await this.chart.data.clear();
        this.chart.clear();
        //window.open(window.href, "_self") 
    }

    toggleDisplayItems(value) {
        select(this.displayItemsCheckbox).property('checked', value);
    }
}

class Search{
    constructor(chart) {
        this.chart = chart;
        this.searchInput = this.chart.shadowRoot.querySelector("#ul-search");
    }

    set() {
        let eventSource;
        const _this = this;
        
        select(this.searchInput)
            .on('keydown', () => eventSource = event.key ? 'key' : 'list')
            .on('input', function() {
                if (eventSource === 'key') return;
                _this.chart.nodes.highlightItem(this.value);
            });

        let clearButton = this.chart.shadowRoot.querySelector("#items-input-clear");
        select(clearButton).on('click', () => { 
            this.chart.nodes.clearHighlight();
            this.clear();
        });
    }

    clear() {
        this.searchInput.value = '';
    }

    async update() {
        this.data = await this.chart.data.getItems();

        let itemNames = this.data.map(d => d.title);
        itemNames = itemNames.filter((d,i) => itemNames.indexOf(d) === i);
        itemNames.sort((a,b) => a.localeCompare(b));

        select(this.chart.shadowRoot.querySelector('#items-list'))
            .selectAll('option')
            .data(itemNames)
            .join(
                enter => enter.append('option'),
                update => update,
                exit => exit.remove()
            ).attr('value', d => d);
    
    }

}

class TimeSlider {
    constructor(chart) {
        this.chart = chart;

        this.lowerSlider = this.chart.shadowRoot.querySelector('#lower');
        this.upperSlider = this.chart.shadowRoot.querySelector('#upper');
        this.lowerLabel = this.chart.shadowRoot.querySelector('#lower-value');
        this.upperLabel = this.chart.shadowRoot.querySelector('#upper-value');
    }

    // Function to update dynamic labels and their positions
    updateLabels() {
        const range = this.lowerSlider.max - this.lowerSlider.min;
    
        const sliderRect = this.lowerSlider.getBoundingClientRect();
        const sliderWidth = sliderRect.width;
    
        const lowerPercent = (this.lowerSlider.value - this.lowerSlider.min) / range;
        const upperPercent = (this.upperSlider.value - this.upperSlider.min) / range;
    
        const lowerPx = this.lowerSlider.offsetLeft + lowerPercent * sliderWidth;
        const upperPx = this.upperSlider.offsetLeft + upperPercent * sliderWidth;
    
        this.lowerLabel.textContent = this.lowerSlider.value;
        this.upperLabel.textContent = this.upperSlider.value;
    
        this.lowerLabel.style.left = `${lowerPx}px`;
        this.upperLabel.style.left = `${upperPx}px`;
    }

    async applyFilters() {
        this.updateLabels();

        this.chart.data.updateFilters('timeTo', +this.upperSlider.value);
        this.chart.data.updateFilters('timeFrom', +this.lowerSlider.value);
        await this.chart.data.updateTime();
        this.chart.update();
    }

    update() {

        let extent$1 = extent(this.chart.data.getAllDates());
        let min = this.chart.data.getFiltersByType('timeFrom'),
            max = this.chart.data.getFiltersByType('timeTo');


        this.chart.shadowRoot.querySelector('#from-label').textContent = extent$1[0];
        this.chart.shadowRoot.querySelector('#to-label').textContent = extent$1[1];

        select(this.chart.shadowRoot.querySelector('#lower'))
            .attr('min', extent$1[0])
            .attr('max', extent$1[1])
            .attr('value', min)
            .on('input', () => {
                let lowerVal = parseInt(this.lowerSlider.value);
                let upperVal = parseInt(this.upperSlider.value);
                
                if (lowerVal > upperVal - 4) {
                    this.upperSlider.value = lowerVal + 4;
                    
                    if (upperVal == this.upperSlider.max) {
                        this.lowerSlider.value = parseInt(this.upperSlider.max) - 4;
                    }
                }

                this.applyFilters();
            });

        select(this.chart.shadowRoot.querySelector('#upper'))
            .attr('min', extent$1[0])
            .attr('max', extent$1[1])
            .attr('value', max)
            .on('input', () => {
                let lowerVal = parseInt(this.lowerSlider.value);
                let upperVal = parseInt(this.upperSlider.value);
                
                if (upperVal < lowerVal + 4) {
                    this.lowerSlider.value = upperVal - 4;
                    
                    if (lowerVal == this.lowerSlider.min) {
                        this.upperSlider.value = parseInt(this.lowerSlider.min) + 4;
                    }
                }

                this.applyFilters();
            
            });

        // wait for next paint to ensure all styles are applied
        requestAnimationFrame(() => this.updateLabels());
            
    }

}

var questionIcon = "question4cf1c0012170e601.svg";

class Legend {
    constructor(chart) {
        this.chart = chart;
        
        this.itemRadius = 7;
        this.fontSize = 12;
        this.left = 10;

        this.div = select(this.chart.shadowRoot.querySelector('div.legend'));

        this.selected = [];
    }

    init() {

        // color legend for links (i.e. collaboration type)
        this.linkLegend = this.div.append('div')
            .classed('link-legend', true)
            .style('width', "100%");

        this.svg = this.linkLegend.append('svg')
            .attr('id', 'link-legend');
            
        this.svg.append('text')
            .text(this.chart.app === 'crobora' ? 'Broadcaster' : 'Contribution Type') //TODO: feed from stylesheet
            .attr('font-size', this.fontSize)
            .attr('transform', `translate(0, 25)`);
        
        this.svg.append('svg:image')
            .attr('xlink:href', `../assets/${questionIcon}`)
            .attr('width', 15)
            .attr('height', 15)
            .attr('x', 110)
            .attr('y', 12)
            .style('cursor', 'pointer')
            .append('title')
            .text(`Click on the circles to show/hide items in each ${this.chart.app === 'crobora' ? 'channel' : 'category'}`);

        this.hide();
        
    }

    update() {

        let chartData = this.chart.getData();
        this.colors = chartData.colors;
        this.data = chartData.linkTypes;

        this.drawLinkLegend();

        this.show();

    }

    drawLinkLegend() {

        this.svg.attr('width', "100%").attr('height', 70);

        // Get the total width of the SVG container
        let totalWidth = window.innerWidth;

        // Calculate the total width needed by summing up the width of all text labels
        let textWidths = this.data.map(d => {
            let text = capitalizeFirstLetter(d);
            return text.length * this.fontSize * .4;  // Estimate text width based on font size
        });

        // Total required width (including circles and some padding)
        let totalRequiredWidth = textWidths.reduce((acc, width) => acc + width, 0) + this.data.length * (this.itemRadius * 2 + 10);

        // Calculate the spacing between each item to evenly distribute them
        let availableSpace = totalWidth - totalRequiredWidth;
        let spacing = availableSpace / (this.data.length - 1);

        // Center offset for text positioning relative to circles
        let circleTextPadding = this.itemRadius + 10;
            
        // Ensure that `xPosition` values do not overlap
        let currentX = this.left;

        this.group = this.svg.selectAll('g')
            .data(this.data)
            .join(
                enter => enter.append('g')
                    .call(g => g.append('circle')
                        .attr('cx', 0)
                        .attr('cy', this.left)         
                        .attr('r', this.itemRadius)
                        .attr('fill', e => this.selected.includes(e) ? '#fff' : this.colors.typeScale(e) )
                        .attr('stroke', d => rgb(this.chart.getTypeColor(d)).darker())
                        .style('cursor', 'pointer') 
                        
                        .call(circle => circle.append('title')
                            .text(e => `Click to display/hide items in this ${this.chart.app === 'crobora' ? 'channel' : 'category'}`)) )
                    
                    .call(g => g.append('text')
                        .attr('font-size', this.fontSize)
                        .attr('y', (_,i) => this.itemRadius * 2)
                        .attr('x', (d,i) => circleTextPadding)
                        .text(d => capitalizeFirstLetter(d))),
                update => update
                    .call(g => g.select('circle')
                        .attr('fill', e => this.selected.includes(e) ? '#fff' : this.colors.typeScale(e)) 
                        .attr('stroke', d => rgb(this.chart.getTypeColor(d)).darker()) )

                    .call(g => g.select('text')
                        .attr('x', circleTextPadding)
                        .text(d => capitalizeFirstLetter(d))),
                exit => exit.remove()
            )
            // Calculate the x position by summing the widths and adding spacing
            .attr('transform', (d, i) => {
                let xPosition = currentX;
                currentX += textWidths[i] + this.itemRadius * 2 + spacing; // Move currentX to the next position
                return `translate(${xPosition}, 35)`;
            });

        this.group.selectAll('circle')
            .on('click', d => this.handleClick(d));
            
            
    }

    handleClick(d) {
        
        if (this.selected.includes(d)) {
            let index = this.selected.indexOf(d);
            this.selected.splice(index, 1);
        }
        else this.selected.push(d);

        this.chart.data.updateFilters('linkTypes', this.selected);
        this.chart.update();

    }

    show() {
        this.div.style('display', 'flex');
    }

    hide() {
        this.div.style('display', 'none');
    }
}

class InfoPanel {
    constructor(chart) {
        this.chart = chart;
    }

    update() {
        let infoContent = this.chart.shadowRoot.querySelector("#info");
        let stats = this.chart.data.getStats();
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

class NavBar {
    constructor() {
        this.chart = document.querySelector('vis-muvin');
    }

    set() {
        this.setInteractors();

        this.legend = new Legend(this.chart); // color legend for links (different types) and items (nodes of the second level of the network)
        this.legend.init();

        this.timeSlider = new TimeSlider(this.chart);

        this.viewSettings = new ViewSettings(this.chart);
        this.viewSettings.set();

        this.searchBar = new Search(this.chart);
        this.searchBar.set();

        this.infoPanel = new InfoPanel(this.chart);
    }

    update() {
        this.searchBar.update();
        this.timeSlider.update();
        this.legend.update();
        this.infoPanel.update();
        this.viewSettings.toggleDisplayItems(this.chart.drawItems());
    }

    setInteractors() {
        const buttons = this.chart.shadowRoot.querySelectorAll('.tab-buttons button');
        const contents = this.chart.shadowRoot.querySelectorAll('.tab-content');

        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Deactivate all buttons and contents
                buttons.forEach(b => b.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));

                // Activate current
                btn.classList.add('active');
                this.chart.shadowRoot.getElementById(btn.dataset.tab).classList.add('active');
            });
        });
    }
}

class Muvin extends HTMLElement {
    constructor () {
        super();

        this.svg = null;
        this.width = null;
        this.height = null;
        this.margin = { top: 30, right: 50, bottom: 30, left: 150 };

        this.visibleNodes = null;
        this.visibleItems = null;
        this.visibleProfile = null;

        this.showItems = true;
        this.incremental = true; // if the webcomponent is used with sparqlResults, the incremental approach is deactivated. We assume that the user wants to visualize the data given in input.

        // To organize private attributes (e.g. query, endpoint)
        this.internalData = new WeakMap();
        this.internalData.set(this, {}); // Initialize internal storage
    }

    set sparqlQuery(query) {
        const data = this.internalData.get(this) || {};
        data.sparqlQuery = query;
        this.internalData.set(this, data);
    }
    
    get sparqlQuery() {
        return this.internalData.get(this)?.sparqlQuery;
    }

    set sparqlEndpoint(endpoint) {
        const data = this.internalData.get(this) || {};
        data.sparqlEndpoint = endpoint;
        this.internalData.set(this, data);
    }
    
    get sparqlEndpoint() {
        return this.internalData.get(this)?.sparqlEndpoint;
    }

    set sparqlProxy(url) {
        const data = this.internalData.get(this) || {};
        data.sparqlProxy = url;
        this.internalData.set(this, data);
    }
    
    get sparqlProxy() {
        return this.internalData.get(this)?.sparqlProxy;
    }

    async connectedCallback() {
        this.attachShadow({ mode: "open" });

        const style = document.createElement('style');
        style.textContent = timelineCSS + navBarCSS + timesliderCSS + contextMenuCSS;
        this.shadowRoot.appendChild(style);

        this.shadowRoot.appendChild(template.content.cloneNode(true));
        
        // Treat query parameters
        this.app = this.getAttribute("app"); // include a config file to avoid using this attribute
        this.token = this.getAttribute("token"); // for crobora, see to use it on the app side

        this.div = select(this.shadowRoot.querySelector('div.timeline'));
        this.defaultWidth = this.width = await this.computePixelValue('width');
        this.height =  await this.computePixelValue('height');
        
        this.svg = this.div.select('svg#chart');
        this.svg.attr('height', this.height).attr('width', this.width);

        this.group = this.svg.select('g#chart-group')
            .attr('transform', `translate(0, ${this.margin.top})`);

        select(this.shadowRoot).on('click', () => {
            this.shadowRoot.querySelectorAll('div.context-menu').style = 'none';
        });
        
        this.data = new DataModel(this);

        this.xAxis = new TimeAxis(this); // temporal axis formed by years
        this.yAxis = new NodesAxis(this); // axis formed by authors/artists names (nodes of the first level of the network)

        this.nodes = this.app === 'crobora' ? new ImageNodes(this) : new NormalNodes(this);
        this.nodes.set();
        
        this.fstlinks = new LinksGroup(this);
        this.sndlinks = new NodeLinksGroup(this);
        this.sndlinks.set();

        this.profiles = new StreamGraph(this);

        this.tooltip = TooltipFactory.getTooltip(this.app, this);
        this.tooltip.hideAll();

        this.navBar = new NavBar(this);
        this.navBar.set();
    }

    async computePixelValue(attr) {
        const sizeStr = this.getAttribute(attr);
        let pixelValue;
      
        if (sizeStr?.endsWith('vw')) {
          const vw = parseFloat(sizeStr);
          pixelValue = (vw / 100) * window.innerWidth;
      
        } else if (sizeStr?.endsWith('vh')) {
          const vh = parseFloat(sizeStr);
          pixelValue = (vh / 100) * window.innerHeight;
          pixelValue *= .85;
      
        } else if (sizeStr?.endsWith('px')) {
          pixelValue = parseFloat(sizeStr);
      
        } else {
          // fallback if invalid or missing
          pixelValue = null;
        }
      
        return pixelValue;
    }

    /**
     * Update the view when adding or removing a node from the network
     * @param {} focus An object defining the node on focus 
     */
    async update(focus){
        
        if (this.data.isEmpty()) {
            this.clear();
            return
        }

        this.div.style('display', 'flex');
        this.hideLoading();

        select(this.shadowRoot.querySelector('#nodes-group'))
            .selectAll('g.artist')
            .data(this.data.getNodesKeys())
            .join(
                enter => enter.append('g')
                    .classed('artist', true)
                    .attr('opacity', 1),
                update => update,
                exit => exit.remove()
            );
        
        this.visibleNodes = [...this.data.getNodesKeys()];
        this.visibleProfile = [...this.visibleNodes];
        this.visibleItems = [...this.visibleNodes];

        this.xAxis.set();
        this.yAxis.set();
        await this.profiles.set();
        
        this.yAxis.drawLabels();
        this.xAxis.drawLabels();
        this.xAxis.drawSlider();

        if (this.yAxis.focus && focus && this.yAxis.focus != focus) 
            this.yAxis.setDistortion(focus);
        else if (this.getTimeSelection()){
            let previousFocus = [...this.xAxis.focus];
            this.xAxis.clearFocus();
            previousFocus.forEach(async (d) => await this.xAxis.computeDistortion(d));
            this.xAxis.setDistortion();
        }
        else {
            this.draw();
        }

        this.navBar.update(); // update elements of the nav bar
            
    }

    draw() {
        this.width = this.xAxis.range()[1];
        
        this.svg.attr('height', this.height).attr('width', this.width);

        this.profiles.draw();
        this.nodes.draw();
        this.fstlinks.draw();
    }

    async appendDataFromQuery(values) {
        await this.data.load(values, { query: this.sparqlQuery, endpoint: this.sparqlEndpoint, proxy: this.sparqlProxy, token: this.token } );
        await this.update();
    }

    async loadSparqlResults(values, sparqlResults) {
        for (let value of values) {
            const data = await transform(value, sparqlResults);
            await this.data.update(data);
        }
        await this.update();
        this.incremental = false;
    }
    

    /// helpers

    isIncremental() {
        return this.incremental
    }

    showLoading() {
        this.shadowRoot.querySelector('#loading').style.display = "block";
    }

    hideLoading() {
        this.shadowRoot.querySelector('#loading').style.display = "none";
    }

    getToken() {
        return this.token;
    }

    clear() {
        //this.legend.hide()
        this.div.style('display', 'none');
    }

    getDefaultWidth() {
        return this.defaultWidth
    }

    getData() {
        return this.data;
    }

    updateItemsDisplay(display) {
        this.showItems = display;
        this.draw();
    }

    /**
     * Verify whether the global option for drawing items is active
     * 
     * @returns true or false
     */
    drawItems() {
        return this.showItems
    }

    areItemsVisible(key) {
        return this.visibleItems.includes(key)
    }

    displayItems(d) {
        this.visibleItems.push(d);
    }

    removeItems(d) {
        let index = this.visibleItems.indexOf(d);
        if (index > -1) this.visibleItems.splice(index, 1);
        return index
    }

    isNodeVisible(key){
        return this.visibleNodes.includes(key)
    }

    isNodeValid(node){
        return this.data.isNodeValid(node)
    }

    displayNode(d) {
        this.visibleNodes.push(d);
    }

    isProfileVisible(key) {
        return this.visibleProfile.includes(key)
    }

    displayProfile(d) {
        this.visibleProfile.push(d);
    }

    removeProfile(d) {
        let index = this.visibleProfile.indexOf(d);
        if (index > -1) this.visibleProfile.splice(index, 1);
        return index
    }

    isProfileActive(d) {
        let key = d.data.node.key;
        if (!this.isNodeVisible(key)) return 0
        if (this.isProfileVisible(key)) return 1;
        if (!this.getNodeSelection() && this.isProfileVisible(key) || (this.isProfileVisible(key) && this.getNodeSelection() && this.isSelected(key))) return 1
        return 0
    }

    getItemColor() {
        return this.data.colors.item;
    }

    getTypeValue(key) {
        return this.data.linkTypes[key]
    }

    getTypeColor(key) {
        return this.data.colors.typeScale(key)
    }

    /**
     * 
     * @param {*} d a link between two nodes 
     * @returns a boolean indicating whether that link is uncertain or not
     */
    async isUncertain(d) {        
        let items = await this.data.getItems().filter(a => a.id === d.item.id && a.year === d.year);
        let foundInSource = items.some(a => a.node.key === d.source);
        let foundIntarget = items.some(a => a.node.key === d.target);

        return !(foundInSource && foundIntarget)
    }

    // return chart dimensions
    getDimensions() {
        return { left: this.margin.left, right: this.margin.right, top: this.margin.top, bottom: this.margin.bottom, width: this.width, height: this.height }
    }

    ////////
    getNodeSelection() {
        return this.yAxis.focus
    }

    async updateVisibleNodes(){ // according to yAxis focus
        
        let keys = this.data.getNodesKeys();
        let index = keys.indexOf(this.yAxis.focus);
        let nodes = index === -1 || !this.yAxis.focus ? keys : [this.yAxis.focus];

        if (index === 0) {
            nodes.push(keys[index + 1]);
            nodes.push(keys[index + 2]);
        } else if (index === keys.length - 1) {
            nodes.push(keys[index - 1]);
            nodes.push(keys[index - 2]);
        } else {
            nodes.push(keys[index - 1]);
            nodes.push(keys[index + 1]);
        }

        this.visibleItems = [...nodes];
        this.visibleProfile = [...nodes];
    }

    getTimeSelection() {
        return this.xAxis.focus.length;
    }

    /**
     * Verify whether a node or a time period is selected
     * 
     * @param {d} d data record 
     * @returns true or false
     */
    isSelected(d) {
        return this.yAxis.focus === d || this.xAxis.focus.includes(+d)
    }

    isFreezeActive() {
        return this.yAxis.freeze
    }

    isFrozen(id) {
        return this.yAxis.frozenNodes && this.yAxis.frozenNodes.snd.includes(id)
    }

    /**
     * Function that provides the list of items affected by the selected node (mouseover or freeze)
     * @param   {String} d selected label on the y axis
     * @return  {Object} keys: "snd" list of ids of second level nodes, "fst" list of first level nodes 
     */
    async getConnectedNodes(d) {
        let value = d || this.yAxis.freeze;

        if (!value) return

        let targets = this.data.links.filter(e => e.source.key === value || e.target.key === value).map(e => e.target.key === value ? e.source.key : e.target.key);
        targets =  targets.filter((e,i) => this.yAxis.values.includes(e) && targets.indexOf(e) === i);

        let items = await this.data.getItems();
        let nodes = items.filter(e => {
            let values = e.contributors.map(x => x.key);
            return values.includes(value) && values.some(a => targets.includes(a)) 
        });

        nodes = nodes.map(e => e.parent ? [e.id, e.parent.id] : e.id).flat();
        nodes = nodes.filter( (e,i) => nodes.indexOf(e) === i );

        return { snd: nodes, fst: targets } 
        
    }

    isPlayable(d){
        return this.data.nodes[d].audio
    }

    /**
     * Function that sets the focus on the selected node (artist/author)
     * @param {String} d selected label on the y axis
     */
    focusOnNode(d) {
        if (!this.isSelected(d) && this.data.getNodesKeys().length > 1) {
            this.yAxis.setDistortion(d);
        }
    }

    async releaseNodeFocus(d) {
        this.yAxis.setDistortion(d);    
    }

    focusOnTime(value) {
        if (this.getTimeSelection()) this.xAxis.setDistortion(value);
        
        else this.xAxis.setSliderPosition(this.xAxis.timeScale(value) - this.xAxis.getStep(value) / 2, value);
    }

    releaseTimeFocus(d) {
        this.xAxis.setDistortion(d);
    }
}

customElements.define("vis-muvin", Muvin);
//# sourceMappingURL=vis-muvin.bundle.js.map
