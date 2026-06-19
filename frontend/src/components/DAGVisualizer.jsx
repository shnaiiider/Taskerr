import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

// color for each status
const statusColor = {
  pending: '#555',
  in_progress: '#3b82f6',
  completed: '#10b981',
  blocked: '#ef4444',
}

export default function DAGVisualizer({ nodes, edges, order }) {
  const svgRef = useRef(null)

  useEffect(() => {
    if (!nodes || nodes.length === 0) return

    const W = svgRef.current.parentElement.clientWidth || 700
    const H = 420

    // clear previous render
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width', W).attr('height', H)

    // dark background
    svg.append('rect').attr('width', W).attr('height', H).attr('fill', '#0a0a0a')

    // arrowhead marker
    svg.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 26).attr('refY', 0)
      .attr('markerWidth', 6).attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path').attr('d', 'M0,-4L8,0L0,4').attr('fill', '#333')

    // copy nodes and edges so D3 can mutate them
    const nodeData = nodes.map(n => ({ ...n }))
    const linkData = edges.map(e => ({ ...e }))

    // force simulation — positions nodes automatically
    const simulation = d3.forceSimulation(nodeData)
      .force('link', d3.forceLink(linkData).id(d => d.id).distance(130))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collision', d3.forceCollide(48))

    // draw edges (lines between nodes)
    const link = svg.append('g')
      .selectAll('line')
      .data(linkData)
      .join('line')
      .attr('stroke', '#333')
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#arrow)')

    // draw nodes (group: circle + label)
    const node = svg.append('g')
      .selectAll('g')
      .data(nodeData)
      .join('g')
      .style('cursor', 'grab')
      .call(
        d3.drag()
          .on('start', (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
          .on('drag',  (e, d) => { d.fx = e.x; d.fy = e.y })
          .on('end',   (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null })
      )

    // outer ring — color = status
    node.append('circle')
      .attr('r', 22)
      .attr('fill', d => statusColor[d.status] + '22')
      .attr('stroke', d => statusColor[d.status])
      .attr('stroke-width', 1.5)

    // center dot
    node.append('circle')
      .attr('r', 5)
      .attr('fill', d => statusColor[d.status])

    // task title below the circle
    node.append('text')
      .attr('y', 36)
      .attr('text-anchor', 'middle')
      .attr('font-size', 10)
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('fill', '#888')
      .text(d => d.title.length > 14 ? d.title.slice(0, 13) + '…' : d.title)

    // execution order badge — top right
    node.append('text')
      .attr('x', 16).attr('y', -14)
      .attr('text-anchor', 'middle')
      .attr('font-size', 9)
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('fill', '#d4f100')
      .text(d => {
        const i = (order || []).indexOf(d.id)
        return i >= 0 ? '#' + (i + 1) : ''
      })

    // update positions on every simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y)
      node.attr('transform', d =>
        'translate(' + Math.max(30, Math.min(W - 30, d.x)) + ',' + Math.max(30, Math.min(H - 44, d.y)) + ')'
      )
    })

    return () => simulation.stop()

  }, [nodes, edges, order])

  if (!nodes || nodes.length === 0) {
    return <div style={{ textAlign: 'center', padding: '60px 20px', color: '#444', fontFamily: 'JetBrains Mono', fontSize: 13 }}>Add tasks with dependencies to see the graph</div>
  }

  return (
    <div>
      <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 10, overflow: 'hidden' }}>
        <svg ref={svgRef} style={{ width: '100%', display: 'block' }} height="420" />
      </div>
      {/* legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
        {Object.entries(statusColor).map(([status, color]) => (
          <span key={status} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#555', fontFamily: 'JetBrains Mono' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
            {status.replace('_', ' ')}
          </span>
        ))}
        <span style={{ fontSize: 11, color: '#d4f100', fontFamily: 'JetBrains Mono' }}>#n = run order</span>
      </div>
    </div>
  )
}
