const WatchHistory = require('tre-revision-history')
const computed = require('mutant/computed')
const MutantMap = require('mutant/map')
const h = require('mutant/html-element')
const Graph = require('./graph/graph')
const svgDataUri = require('mini-svg-data-uri')
const setStyles = require('module-styles')("tre-revisions-view")

module.exports = function(ssb, opts) {
  opts = opts || {}
  const watchHistory = WatchHistory(ssb)
  const renderItem = opts.renderItem || defaultRenderItem

  const y_step = 30;

  setStyles(`
    .tre-revisions-view {
      display: grid;
      grid-template-columns: min-content auto;
      align-content: stretch;
      grid-auto-rows: ${y_step}px;
    }
    .tre-revisions-view .graph {
      grid-column: 1 / 2;
    }

    .tre-revisions-view .revision {
      grid-column: 2 / 3;
    }
  `)

  function defaultRenderItem(kv) {
    return h('li', kv.value.content.name)
  }

  return function renderHistory(revRoot, ctx) {
    ctx = ctx || {}
    const revsObs = watchHistory(revRoot, {reverse: true})

    return h('.tre-revisions-view', {}, [

      computed(revsObs, kvs => {
        const graph = Graph(kvs.map(kv => {
          return {sha: kv.key, parents: ary(kv.value.content.revisionBranch)}
        }), {domNode, y_step})
        const svg = graph().toString()
        const url = svgDataUri(svg)
        return h('img.graph', {
          style: {
            'grid-row': `1 / ${kvs.length + 1}`
          },
          src: url
        })
      }),
      
      MutantMap(revsObs, renderItem)

    ])
  }
}

function ary(a) {
  if (!a) return []
  return Array.isArray(a) ? a : [a]
}

function domNode(tag, opts) {

  function children() {
     return (opts.children || []).map( x => x.toString() ).join('') 
  }

  function attr(a) {
    if (a == 'children') return
    if (a == 'classes') return

    let value = opts[a]
    if (a == 'style') {
      value = Object.keys(value).map( k => `${k}:${value[k]};` ).join('')
    }
    return `${a}='${value}'`
  }
  function attrs() {
    return Object.keys(opts).map( a => attr(a) ).filter(Boolean).join(' ')
  }
  return {
    toString: ()=> {
      return `<${tag} ${attrs()}>${children()}</${tag}>`
    }
  }
}
