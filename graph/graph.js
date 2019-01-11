const generateGraphData = require('./generate-graph-data')
const SVGPathData = require('./svg-path-data')

const COLOURS = ["#e11d21", "#fbca04", "#009800", "#006b75", "#207de5", "#0052cc", "#5319e7", "#f7c6c7", "#fad8c7", "#fef2c0", "#bfe5bf", "#c7def8", "#bfdadc", "#bfd4f2", "#d4c5f9", "#cccccc", "#84b6eb", "#e6e6e6", "#ffffff", "#cc317c"];

module.exports = function(commits, opts) {
  opts = opts || {}
  let graphData = null
  let branchCount = null
  let selected = null

  const domNode = opts.domNode || (()=> { throw new Error('Specify opts.dokNode') })

  const state = Object.assign({}, {
    y_step: 20,
    x_step: 20,
    dotRadius: 3,
    lineWidth: 2,
    mirror: false,
    unstyled: false
  }, opts)

  return renderGraph

  function getGraphData() {
    return graphData || (graphData = generateGraphData(commits))
  }

  function getBranchCount() {
    return branchCount || (branchCount = getBranchCountFromData(getGraphData()))
  }

  function getWidth() {
    if (state.width != null) {
      return state.width
    }
    return getContentWidth()
  }

  function getContentWidth() {
    return (getBranchCount() + 0.5) * state.x_step
  }

  function getHeight() {
    if (state.height != null) {
      return state.height
    }
    return getContentHeight()
  }

  function getContentHeight() {
    return (getGraphData().length + 2) * state.y_step;
  }

  function getInvert() {
    return state.mirror ? 0 - state.width : 0
  }

  function getOffset() {
    return getWidth() / 2 - getContentWidth() / 2
  }

  function renderRouteNode(d, branch) {
    var classes, colour, style;
    if (!state.unstyled) {
      colour = getColour(branch)
      style = {
        'stroke': colour,
        'stroke-width': state.lineWidth,
        'fill': 'none'
      }
    }
    classes = "commits-graph-branch-" + branch
    return domNode('path', {
      d,
      style,
      classes
    })
  }

  function renderRoute(commit_idx, [from, to, branch]) {
    const x_step = state.x_step
    const y_step = state.y_step
    const offset = getOffset()
    const invert = getInvert()

    const svgPath = new SVGPathData()
    const from_x = offset + invert + (from + 1) * x_step
    const from_y = (commit_idx + 0.5) * y_step
    const to_x = offset + invert + (to + 1) * x_step
    const to_y = (commit_idx + 0.5 + 1) * y_step
    svgPath.moveTo(from_x, from_y)
    if (from_x === to_x) {
      svgPath.lineTo(to_x, to_y)
    } else {
      svgPath.bezierCurveTo(from_x - x_step / 4, from_y + y_step / 3 * 2, to_x + x_step / 4, to_y - y_step / 3 * 2, to_x, to_y)
    }
    return renderRouteNode(svgPath.toString(), branch)
  }

  function renderCommitNode(x, y, sha, dot_branch) {
    var classes, colour, radius, selectedClass, strokeColour, strokeWidth, style;
    radius = state.dotRadius
    if (!state.unstyled) {
      colour = getColour(dot_branch)
      if (sha === selected) {
        strokeColour = '#000'
        strokeWidth = 2
      } else {
        strokeColour = colour
        strokeWidth = 1
      }
      style = {
        'stroke': strokeColour,
        'stroke-width': strokeWidth,
        'fill': colour
      }
    }
    if (selected) {
      selectedClass = 'selected'
    }
    classes = classSet("commits-graph-branch-" + dot_branch, selectedClass)
    return domNode('circle', {
      cx: x,
      cy: y,
      r: radius,
      style: style,
      //'ev'click': handleClick,
      'data-sha': sha,
      classes
    })
  }

  function renderCommit(idx, [sha, dot, routes_data]) {
    const [dot_offset, dot_branch] = dot
    const x_step = state.x_step
    const y_step = state.y_step
    const offset = getOffset()
    const invert = getInvert()
    const x = offset + invert + (dot_offset + 1) * x_step
    const y = (idx + 0.5) * y_step 

    const commitNode = renderCommitNode(x, y, sha, dot_branch)
    const routeNodes = routes_data.map(route => renderRoute(idx, route) )
    
    return [commitNode, routeNodes]
  }

  function renderGraph() {
    const allCommitNodes = []
    let allRouteNodes = []
    getGraphData().forEach( (commit, index) => {
      const [commitNode, routeNodes] = renderCommit(index, commit)
      allCommitNodes.push(commitNode)
      allRouteNodes = allRouteNodes.concat(routeNodes)
    })
    
    const children = [].concat(allRouteNodes, allCommitNodes)
    
    const height = getHeight()
    const width = getWidth()
    
    let style = {}
    if (!state.unstyled) {
      style = {
        height, width,
        cursor: 'pointer'
      }
    }

    return domNode('svg', {
      //'ev-click': this.handleClick,
      xmlns: "http://www.w3.org/2000/svg",
      height, width, style, children
    })
  }
}

// -- utils

function classSet() {
  const classes =  Array.from(arguments)
  return classes.filter(Boolean).join(' ')
}

function getColour(branch) {
  return COLOURS[branch % COLOURS.length]
}

function getBranchCountFromData(data) {
  var i, j, maxBranch;
  maxBranch = -1;
  i = 0;
  while (i < data.length) {
    j = 0;
    while (j < data[i][2].length) {
      if (maxBranch < data[i][2][j][0] || maxBranch < data[i][2][j][1]) {
        maxBranch = Math.max.apply(Math, [data[i][2][j][0], data[i][2][j][1]]);
      }
      j++;
    }
    i++;
  }
  return maxBranch + 1
}

